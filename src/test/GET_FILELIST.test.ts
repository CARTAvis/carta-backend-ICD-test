import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = "./public";
let expectBasePath = config.path.base;
let connectTimeout = config.timeout.connection;

describe("GET_FILELIST_DEFAULT_PATH tests: Testing generation of a file list at default path ($BASE)", () => {
    describe(`connect to CARTA "${testServerUrl}"`, () => {
        let Connection: WebSocket;
        beforeAll( done => {
            Connection = new WebSocket(testServerUrl);
            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;
            async function OnOpen (this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                await Utility.setEvent(this, CARTA.RegisterViewer, 
                    {
                        sessionId: 0, 
                        apiKey: "",
                    }
                );
                await new Promise( resolve => { 
                    Utility.getEvent(this, CARTA.RegisterViewerAck, 
                        RegisterViewerAck => {
                            expect(RegisterViewerAck.success).toBe(true);
                            resolve();           
                        }
                    );
                });
                done();
            }
        }, connectTimeout);

        describe(`access folder "${expectBasePath}"`, () => {
            let FileListResponseTemp: CARTA.FileListResponse;
            test(`should get "FILE_LIST_RESPONSE" within ${connectTimeout} ms.`, async () => {
                await Utility.setEvent(Connection, CARTA.FileListRequest, 
                    {
                        directory: expectBasePath,
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, CARTA.FileListResponse, 
                        (FileListResponse: CARTA.FileListResponse) => {
                            FileListResponseTemp = FileListResponse;
                            resolve();
                        }
                    );                
                });
            }, connectTimeout);
        
            test("FILE_LIST_RESPONSE.success == True", () => {
                expect(FileListResponseTemp.success).toBe(true);
            });

            test(`FILE_LIST_RESPONSE.parent is ""`, () => {
                expect(FileListResponseTemp.parent).toEqual("");
            });

            test(`FILE_LIST_RESPONSE.directory == "."`, () => {
                console.log(`$Base = "${FileListResponseTemp.directory}"`);
                expect(FileListResponseTemp.directory).toEqual(".");
            });

            test(`FILE_LIST_RESPONSE.subdirectories == ["public"]`, () => {
                expect(FileListResponseTemp.subdirectories).toEqual(["public"]);
            });
        });

        describe(`access folder "${testSubdirectoryName}"`, () => {
            let FileListResponseTemp: CARTA.FileListResponse;
            test(`should get "FILE_LIST_RESPONSE" within ${connectTimeout} ms.`, async () => {
                await Utility.setEvent(Connection, CARTA.FileListRequest, 
                    {
                        directory: testSubdirectoryName,
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, CARTA.FileListResponse, 
                        (FileListResponse: CARTA.FileListResponse) => {
                            FileListResponseTemp = FileListResponse;
                            resolve();
                        }
                    );                
                });
            }, connectTimeout);
        
            test("FILE_LIST_RESPONSE.success == True", () => {
                expect(FileListResponseTemp.success).toBe(true);
            });

            test(`FILE_LIST_RESPONSE.parent is "."`, () => {
                expect(FileListResponseTemp.parent).toEqual(".");
            });

            test(`FILE_LIST_RESPONSE.directory == "public"`, () => {
                expect(FileListResponseTemp.directory).toEqual("public");
            });

            test(`"aJ.fits" should be in FILE_LIST_RESPONSE.files[]"`, () => {
                expect(FileListResponseTemp.files.find(f => f.name === "aJ.fits")).toBeDefined();
            });
            
            test(`FILE_LIST_RESPONSE.subdirectories should have "set_QA"`, () => {
                expect(FileListResponseTemp.subdirectories.find(f => f === "set_QA")).toBeDefined();
            });
        });

        afterAll( () => {
            Connection.close();
        });
    });
    
});

describe("GET_FILELIST_UNKNOWN_PATH tests: Testing error handle of file list generation if the requested path does not exist", () => {    
    describe(`connect to CARTA "${testServerUrl}"`, () => {

        let Connection: WebSocket;
    
        beforeAll( done => {
            Connection = new WebSocket(testServerUrl);
            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;
            async function OnOpen (this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                await Utility.setEvent(this, CARTA.RegisterViewer, 
                    {
                        sessionId: 0, 
                        apiKey: "",
                    }
                );
                await new Promise( resolve => { 
                    Utility.getEvent(this, CARTA.RegisterViewerAck, 
                        RegisterViewerAck => {
                            expect(RegisterViewerAck.success).toBe(true);
                            resolve();           
                        }
                    );
                });
                done();
            }
        }, connectTimeout);
    
        describe(`access folder "/unknown/path"`, () => {
            let FileListResponseTemp: CARTA.FileListResponse;
            test(`should get "FILE_LIST_RESPONSE" within ${connectTimeout} ms.`, async () => {
                await Utility.setEvent(Connection, CARTA.FileListRequest, 
                    {
                        directory: "/unknown/path",
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, CARTA.FileListResponse, 
                        (FileListResponse: CARTA.FileListResponse) => {
                            FileListResponseTemp = FileListResponse;
                            resolve();
                        }
                    );                
                });
            }, connectTimeout);
        
            test("FILE_LIST_RESPONSE.success == False", () => {
                expect(FileListResponseTemp.success).toBe(false);
            });

            test("FILE_LIST_RESPONSE.message is not empty", () => {
                let _message = FileListResponseTemp.message;
                expect(_message).toBeDefined();
                expect(_message).not.toBe("");
                console.log(`As access folder "/unknown/path", FILE_LIST_RESPONSE.message is "${_message}"`);
            });
        });
        
        afterAll( () => {
            Connection.close();
        });
    });    
    
});
