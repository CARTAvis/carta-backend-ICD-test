/// Manual
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let testSubdirectoryName = "set_QA";
let connectTimeout = 100;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let expectRootPath = "";
let testFileName = "aJ.fits";
let testNumber = 10;
let Connection: WebSocket[] = new Array(testNumber);

describe("GET_FILELIST_ROOTPATH_CONCURRENT test: Testing generation of a file list at root path from multiple concurrent users.", () => {    

    beforeAll( done => {
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx] = new WebSocket(testServerUrl);
            Connection[idx].binaryType = "arraybuffer";
        }
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx].onopen = () => {
                
                // Checkout if Websocket server is ready
                if (Connection[idx].readyState === WebSocket.OPEN) {
                    // Preapare the message on a eventData
                    let message = CARTA.RegisterViewer.create({sessionId: "", apiKey: "1234"});
                    let payload = CARTA.RegisterViewer.encode(message).finish();
                    let eventData = new Uint8Array(32 + 4 + payload.byteLength);

                    eventData.set(Utility.stringToUint8Array("REGISTER_VIEWER", 32));
                    eventData.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                    eventData.set(payload, 36);

                    Connection[idx].send(eventData);

                    Connection[idx].onmessage = (messageEvent: MessageEvent) => {
                        
                        done();
                    };
                } else {
                    console.log(`connection #${idx + 1} can not open. @${new Date()}`);
                }
                    
            }; 
        }
    });

    let fileListResponse: CARTA.FileListResponse[] = new Array(testNumber);
    for (let idx = 0; idx < testNumber; idx++) {

        test(`connection #${idx + 1}: send EventName: "FILE_LIST_REQUEST" to CARTA "${testServerUrl}".`, 
        done => {
            // Preapare the message on a eventData
            let message = CARTA.FileListRequest.create({directory: expectRootPath});
            let payload = CARTA.FileListRequest.encode(message).finish();
            let eventData = new Uint8Array(32 + 4 + payload.byteLength);

            eventData.set(Utility.stringToUint8Array("FILE_LIST_REQUEST", 32));
            eventData.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
            eventData.set(payload, 36);

            Connection[idx].send(eventData);

            Connection[idx].onmessage = (messageEvent: MessageEvent) => {
                expect(messageEvent.data.byteLength).toBeGreaterThan(40);
                let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                if (eventName === "FILE_LIST_RESPONSE") {
                    let messageEventData = new Uint8Array(messageEvent.data, 36);
                    fileListResponse[idx] = CARTA.FileListResponse.decode(messageEventData);
                    done();
                } // if
            };
        }, connectTimeout);

        test(`connection #${idx + 1}: assert FILE_LIST_RESPONSE.success to be True.`, 
        () => {
            expect(fileListResponse[idx].success).toBe(true);
        });

        test(`connection #${idx + 1}: assert FILE_LIST_RESPONSE.parent is None.`, 
        () => {
            expect(fileListResponse[idx].parent).toBe("");
        });

        test(`connection #${idx + 1}: assert FILE_LIST_RESPONSE.directory is "${expectRootPath}".`, 
        () => {
            expect(fileListResponse[idx].directory).toBe(expectRootPath);
        });

        test(`connection #${idx + 1}: assert "${testFileName}" in FILE_LIST_RESPONSE.files[].`, 
        () => {
            expect(fileListResponse[idx].files.find(f => f.name === testFileName)).toBeDefined();
        });

        test(`connection #${idx + 1}: assert “${testSubdirectoryName}” in FILE_LIST_RESPONSE.subdirectories[].`, 
        () => {
            expect(fileListResponse[idx].subdirectories.find(f => f === testSubdirectoryName)).toBeDefined();
        });

    }

    test(`assert all FILE_LIST_RESPONSE.files[] are identical.`, 
    () => {
        // console.log(fileListResponse);
        expect(fileListResponse.every(f => JSON.stringify(f.files) === JSON.stringify(fileListResponse[0].files))).toBe(true);
    });

    test(`assert all FILE_LIST_RESPONSE.subdirectories[] are identical.`, 
    () => {
        expect(fileListResponse.every(f => JSON.stringify(f.subdirectories) === JSON.stringify(fileListResponse[0].subdirectories))).toBe(true);
    });

    afterAll( () => {
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx].close();
        }
    }, connectTimeout);
    
});