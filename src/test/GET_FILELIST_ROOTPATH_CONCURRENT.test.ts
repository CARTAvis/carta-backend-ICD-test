/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;
let concurrentTimeout = config.timeout.concurrent;

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
                        Utility.getEvent(Connection[idx], "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                            RegisterViewerAck => {
                                expect(RegisterViewerAck.success).toBe(true);
                                resolve();
                            }
                        );
                        Utility.setEvent(Connection[idx], "REGISTER_VIEWER", CARTA.RegisterViewer, 
                            {
                                sessionId: "", 
                                apiKey: "1234"
                            }
                        );
                    } else {
                        console.log(`connection #${idx + 1} can not open. @${new Date()}`);
                        reject();
                    }
                        
                };
            });
        }
        
        Promise.all(promiseConn).then( () => done() );
    }, concurrentTimeout);

    let fileListResponse: CARTA.FileListResponse[] = new Array(testNumber);
    
    test(`${testNumber} connections send EventName: "FILE_LIST_REQUEST" to CARTA "${testServerUrl}".`, 
    done => {
        let promiseConnection: Promise<void>[] = new Array(testNumber);
        for (let idx = 0; idx < testNumber; idx++) {
            promiseConnection[idx] = new Promise( (resolve, reject) => {
                Utility.getEvent(Connection[idx], "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    FileListResponse => {
                        expect(FileListResponse.success).toBe(true);
                        fileListResponse[idx] = FileListResponse;
                        resolve();
                    }
                );
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectionTimeout);
            });
        }
        Promise.all(promiseConnection).then( () => done() );
        
        Connection.forEach( (value, index, array) => {
            Utility.setEvent(value, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath
                }
            );  
        });  
        
    }, concurrentTimeout);
    
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