import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectRootPath = config.path.root;
let expectBasePath = config.path.base;
let connectTimeout = config.timeout.connection;

let testFileName = "aJ.fits";
let baseDirectory: string; 

describe("GET_FILELIST_ROOTPATH tests: Testing generation of a file list at root path", () => {    

    describe(`connect to CARTA "${testServerUrl}" and access directory: "${expectRootPath}"`, 
    () => {

        let Connection: WebSocket;
    
        beforeEach( done => {
            Connection = new WebSocket(testServerUrl);
            expect(Connection.readyState).toBe(WebSocket.CONNECTING);
            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;
            async function OnOpen (this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                await Utility.setEvent(this, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234",
                    }
                );
                await new Promise( resolve => { 
                    Utility.getEvent(this, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                        RegisterViewerAck => {
                            expect(RegisterViewerAck.success).toBe(true);
                            resolve();           
                        }
                    );
                });
                done();
            }
        }, connectTimeout);
    
        test(`assert the "FILE_LIST_RESPONSE" within ${connectTimeout} ms.`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    FileListResponse => {
                        resolve();
                    }
                );                
            });
        }, connectTimeout);
    
        test(`assert the "FILE_LIST_RESPONSE.success" is true.`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.success).toBe(true);
                        resolve();
                    }
                );                
            });
        }, connectTimeout);  

        test(`assert the "FILE_LIST_RESPONSE.parent" is "" .`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.parent).toBe("");
                        resolve();
                    }
                );                
            });
        }, connectTimeout);

        test(`assert the "FILE_LIST_RESPONSE.directory" is root path "${expectRootPath}".`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.directory).toBe(expectRootPath);
                        resolve();
                    }
                );                
            });
        }, connectTimeout);

        test(`assert the base path.`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        baseDirectory = FileListResponseBase.directory;
                        resolve();
                    }
                );                
            });
        }, connectTimeout);

        test(`assert the file "${testFileName}" exists.`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: baseDirectory,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    FileListResponse => {
                        let fileInfo = FileListResponse.files.find(f => f.name === testFileName);
                        expect(fileInfo).toBeDefined();
                        expect(fileInfo.type).toBe(CARTA.FileType.FITS);
                        resolve();
                    }
                );                
            });
        }, connectTimeout);
    
        test(`assert the subdirectory "${testSubdirectoryName}" exists.`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: baseDirectory,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    FileListResponse => {
                        let folderInfo = FileListResponse.subdirectories.find(f => f === testSubdirectoryName);
                        expect(folderInfo).toBeDefined();
                        resolve();
                    }
                );                
            });
        }, connectTimeout);
        
        afterEach( () => {
            Connection.close();
        });
    });
    
});

describe("GET_FILELIST_UNKNOWNPATH tests: Testing error handle of file list generation if the requested path does not exist", () => {    
    describe(`connect to CARTA "${testServerUrl}" and access directory: "/unknown/path"`, 
    () => {

        let Connection: WebSocket;
    
        beforeEach( done => {
            Connection = new WebSocket(testServerUrl);
            expect(Connection.readyState).toBe(WebSocket.CONNECTING);
            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;
            async function OnOpen (this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                await Utility.setEvent(this, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234",
                    }
                );
                await new Promise( resolve => { 
                    Utility.getEvent(this, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                        RegisterViewerAck => {
                            expect(RegisterViewerAck.success).toBe(true);
                            resolve();           
                        }
                    );
                });
                done();
            }
        }, connectTimeout);
    
        test(`assert the "FILE_LIST_RESPONSE" within ${connectTimeout} ms.`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: "/unknown/path",
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    FileListResponse => {
                        resolve();
                    }
                );                
            });
        }, connectTimeout);
    
        test(`assert the "FILE_LIST_RESPONSE.success" is false.`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: "/unknown/path",
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.success).toBe(false);
                        resolve();
                    }
                );                
            });
        }, connectTimeout);  

        test(`assert the "FILE_LIST_RESPONSE.message" is not empty.`, 
        async () => {
            await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: "/unknown/path",
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.message).toBeDefined();
                        expect(FileListResponse.message).not.toEqual("");
                        if ( FileListResponse.message !== "" ) {
                            console.log(`As given an unknown path, returning message: "${FileListResponse.message}" @${new Date()}`);
                        }
                        resolve();
                    }
                );                
            });
        }, connectTimeout);
        
        afterEach( () => {
            Connection.close();
        });
    });    
    
});
