/// Manual
// let testServerUrl = "ws://127.0.0.1:1234";
// let testServerUrl = "ws://carta.asiaa.sinica.edu.tw:4003";
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let testSubdirectoryName = "set_QA";
let connectTimeout = 1000;
let testTimeout = 20000;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let expectRootPath = "";
let testFileName = "aJ.fits";
let testNumber = 10;
let Connection: WebSocket[] = new Array(testNumber);

describe("GET_FILELIST_ROOTPATH_CONCURRENT test: Testing generation of a file list at root path from multiple concurrent users.", () => {    

    test(`establish ${testNumber} connections to "${testServerUrl}".`,
    done => {
        let promiseConn: Promise<void>[] = new Array(testNumber);
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx] = new WebSocket(testServerUrl);
            Connection[idx].binaryType = "arraybuffer";
            promiseConn[idx] = new Promise( (resolve, reject) => {
                Connection[idx].onopen = () => {
                    // console.log(promiseConn);
                    // Checkout if Websocket server is ready
                    if (Connection[idx].readyState === WebSocket.OPEN) {
                        // Preapare the message on a eventData
                        let message = CARTA.RegisterViewer.create({sessionId: "", apiKey: "1234"});
                        let payload = CARTA.RegisterViewer.encode(message).finish();
                        let eventData = new Uint8Array(32 + 4 + payload.byteLength);

                        eventData.set(Utility.stringToUint8Array("REGISTER_VIEWER", 32));
                        eventData.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventData.set(payload, 36);

                        Connection[idx].onmessage = (event: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                            if (eventName === "REGISTER_VIEWER_ACK") {
                                resolve();
                            }
                        };
                        
                        Connection[idx].send(eventData);
                        
                    } else {
                        console.log(`connection #${idx + 1} can not open. @${new Date()}`);
                        reject();
                    }
                        
                };
            });
        }
        
        Promise.all(promiseConn).then( () => done() );
    }, testTimeout);

    let fileListResponse: CARTA.FileListResponse[] = new Array(testNumber);
    
    test(`${testNumber} connections send EventName: "FILE_LIST_REQUEST" to CARTA "${testServerUrl}".`, 
    done => {
        let promiseConnection: Promise<void>[] = new Array(testNumber);
        for (let idx = 0; idx < testNumber; idx++) {
            promiseConnection[idx] = new Promise( (resolve, reject) => {
                Connection[idx].onmessage = (messageEvent: MessageEvent) => {
                    expect(messageEvent.data.byteLength).toBeGreaterThan(40);
                    let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                    if (eventName === "FILE_LIST_RESPONSE") {
                        let messageEventData = new Uint8Array(messageEvent.data, 36);
                        fileListResponse[idx] = CARTA.FileListResponse.decode(messageEventData);
                        resolve();
                    }
                };
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectTimeout);
            });
        }
        Promise.all(promiseConnection).then( () => done() );

        // Preapare the message on a eventData
        let messageFileListRequest = CARTA.FileListRequest.create({directory: expectRootPath});
        let payloadFileListRequest = CARTA.FileListRequest.encode(messageFileListRequest).finish();
        let eventDataFileListRequest = new Uint8Array(32 + 4 + payloadFileListRequest.byteLength);

        eventDataFileListRequest.set(Utility.stringToUint8Array("FILE_LIST_REQUEST", 32));
        eventDataFileListRequest.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
        eventDataFileListRequest.set(payloadFileListRequest, 36);

        for (let idy = 0; idy < testNumber; idy++) {
            Connection[idy].send(eventDataFileListRequest);    
        }

    }, testTimeout);
    
    test(`assert every FILE_LIST_RESPONSE.success to be True.`, 
    () => {
        fileListResponse.forEach( (item, index, array) => {
            expect(item.success).toBe(true);
        });        
    });

    test(`assert every FILE_LIST_RESPONSE.parent is None.`, 
    () => {
        fileListResponse.forEach( (item, index, array) => {
            expect(item.parent).toBe("");
        });
    });

    test(`assert every FILE_LIST_RESPONSE.directory is "${expectRootPath}".`, 
    () => {
        fileListResponse.forEach( (item, index, array) => {
            expect(item.directory).toBe(expectRootPath);
        });
    });

    test(`assert every "${testFileName}" in FILE_LIST_RESPONSE.files[].`, 
    () => {
        fileListResponse.forEach( (item, index, array) => {
            expect(item.files.find(f => f.name === testFileName)).toBeDefined();
        });
    });

    test(`assert every “${testSubdirectoryName}” in FILE_LIST_RESPONSE.subdirectories[].`, 
    () => {
        fileListResponse.forEach( (item, index, array) => {
            expect(item.subdirectories.find(f => f === testSubdirectoryName)).toBeDefined();
        });
    });

    test(`assert all FILE_LIST_RESPONSE.files[] are identical.`, 
    () => {
        // console.log(fileListResponse);
        expect(fileListResponse[0]).toBeDefined();
        expect(fileListResponse.every(f => JSON.stringify(f.files) === JSON.stringify(fileListResponse[0].files))).toBe(true);
    });

    test(`assert all FILE_LIST_RESPONSE.subdirectories[] are identical.`, 
    () => {
        expect(fileListResponse[0]).toBeDefined();
        expect(fileListResponse.every(f => JSON.stringify(f.subdirectories) === JSON.stringify(fileListResponse[0].subdirectories))).toBe(true);
    });

    afterAll( () => {
        Connection.forEach( (item, index, array) => {
            item.close();
        });
    });
    
});