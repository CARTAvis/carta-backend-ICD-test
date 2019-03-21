import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectRootPath = config.path.root;
let connectionTimeout = config.timeout.connection;
let concurrentTimeout = config.timeout.concurrent;
let testNumber = config.repeat.concurrent;

let testFileName = "aJ.fits";
let Connection: WebSocket[] = new Array(testNumber);

describe("GET_FILELIST_ROOTPATH_CONCURRENT test: Testing generation of a file list at root path from multiple concurrent users.", () => {    

    test(`establish ${testNumber} connections to "${testServerUrl}".`,
    done => {
        let promiseConn: Promise<void>[] = new Array(testNumber);
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx] = new WebSocket(testServerUrl);
            Connection[idx].binaryType = "arraybuffer";
            promiseConn[idx] = new Promise( (resolved, reject) => {
                Connection[idx].onopen = async () => {
                    expect(Connection[idx].readyState).toBe(WebSocket.OPEN);
                    await Utility.setEvent(Connection[idx], "REGISTER_VIEWER", CARTA.RegisterViewer, 
                        {
                            sessionId: "", 
                            apiKey: "1234"
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection[idx], "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                            (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                                expect(RegisterViewerAck.success).toBe(true);
                                resolve();
                            }
                        );
                    });
                    resolved();
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
        
        for (let connection of Connection) {
            Utility.setEvent(connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath
                }
            );  
        }  
        
    }, concurrentTimeout);
    
    test(`assert every FILE_LIST_RESPONSE.success to be True.`, 
    () => {
        for (let response of fileListResponse) {
            expect(response.success).toBe(true);
        }       
    });

    test(`assert every FILE_LIST_RESPONSE.parent is None.`, 
    () => {
        for (let response of fileListResponse) {
            expect(response.parent).toBe("");
        }   
    });

    test(`assert every FILE_LIST_RESPONSE.directory is "${expectRootPath}".`, 
    () => {
        for (let response of fileListResponse) {
            expect(response.directory).toBe(expectRootPath);
        }
    });

    test.skip(`assert "${testFileName}" in every FILE_LIST_RESPONSE.files[].`, 
    () => {
        for (let response of fileListResponse) {
            // console.log(response);
            expect(response.files.find(f => f.name === testFileName)).toBeDefined();            
        }
    });

    test.skip(`assert “${testSubdirectoryName}” in every FILE_LIST_RESPONSE.subdirectories[].`, 
    () => {
        for (let response of fileListResponse) {
            expect(response.subdirectories.find(f => f === testSubdirectoryName)).toBeDefined();
        }
    });

    test(`assert all FILE_LIST_RESPONSE.files[] are identical.`, 
    () => {
        expect(fileListResponse[0]).toBeDefined();
        expect(fileListResponse.every(f => JSON.stringify(f.files) === JSON.stringify(fileListResponse[0].files))).toBe(true);
    });

    test(`assert all FILE_LIST_RESPONSE.subdirectories[] are identical.`, 
    () => {
        expect(fileListResponse[0]).toBeDefined();
        expect(fileListResponse.every(f => JSON.stringify(f.subdirectories) === JSON.stringify(fileListResponse[0].subdirectories))).toBe(true);
    });

    afterAll( () => {
        for (let connection of Connection) {
            connection.close();
        }
    });
    
});