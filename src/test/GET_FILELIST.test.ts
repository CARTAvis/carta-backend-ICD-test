/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectRootPath = config.path.root;
let expectBasePath = config.path.base;
let connectTimeout = config.timeout.connection;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testFileName = "aJ.fits";
let fileType = CARTA.FileType.FITS;
let testReturnName = "FILE_LIST_RESPONSE";

describe("GET_FILELIST_ROOTPATH tests: Testing generation of a file list at root path", () => {    

    describe(`connect to CARTA "${testServerUrl}" as request directory: "${expectRootPath}"`, 
    () => {

        let Connection: WebSocket;
    
        beforeEach( done => {
            // Construct a Websocket
            Connection = new WebSocket(testServerUrl);
            Connection.binaryType = "arraybuffer";
    
            // While open a Websocket
            Connection.onopen = () => {
                // Checkout if Websocket server is ready
                if (Connection.readyState === WebSocket.OPEN) {
                    Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                        RegisterViewerAck => {
                            expect(RegisterViewerAck.success).toBe(true);
                            done();
                        }
                    );
                    Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                        {
                            sessionId: "", 
                            apiKey: "1234"
                        }
                    );
                } else {
                    console.log(`Can not open a connection. @${new Date()}`);
                }
            };

        }, connectTimeout);
    
        test(`assert the "${testReturnName}" within ${connectTimeout} ms.`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath
                }
            );
        }, connectTimeout);
    
        test(`assert the "FILE_LIST_RESPONSE.success" is true.`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    expect(FileListResponse.success).toBe(true);

                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath
                }
            );
        }, connectTimeout);  

        test(`assert the "FILE_LIST_RESPONSE.parent" is "" .`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    expect(FileListResponse.parent).toBe("");

                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath
                }
            );
        }, connectTimeout);

        test(`assert the "FILE_LIST_RESPONSE.directory" is root path "${expectRootPath}".`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    expect(FileListResponse.directory).toBe(expectRootPath);

                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectRootPath
                }
            );
        }, connectTimeout);

        let baseDirectory: string;
        test(`assert the base path.`, 
        done => {
            
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponseBase => {                
                    baseDirectory = FileListResponseBase.directory;    
                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
        }, connectTimeout);

        test(`assert the file "${testFileName}" exists.`, 
        done => {    
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    let fileInfo = FileListResponse.files.find(f => f.name === testFileName);
                    expect(fileInfo).toBeDefined();
                    expect(fileInfo.type).toBe(fileType);

                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: baseDirectory
                }
            );
        }, connectTimeout);
    
        test(`assert the subdirectory "${testSubdirectoryName}" exists.`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    let folderInfo = FileListResponse.subdirectories.find(f => f === testSubdirectoryName);
                    expect(folderInfo).toBeDefined();

                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: baseDirectory
                }
            );
        }, connectTimeout);
        
        afterEach( done => {
            Connection.close();
            done();
        });
    });
    
});

describe("GET_FILELIST_UNKNOWNPATH tests: Testing error handle of file list generation if the requested path does not exist", () => {    
    describe(`connect to CARTA "${testServerUrl}" as request directory: "/unknown/path"`, 
    () => {

        let Connection: WebSocket;
    
        beforeEach( done => {
            // Construct a Websocket
            Connection = new WebSocket(testServerUrl);
            Connection.binaryType = "arraybuffer";
    
            // While open a Websocket
            Connection.onopen = () => {
                // Checkout if Websocket server is ready
                if (Connection.readyState === WebSocket.OPEN) {
                    Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                        RegisterViewerAck => {
                            expect(RegisterViewerAck.success).toBe(true);
                            done();
                        }
                    );
                    Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                        {
                            sessionId: "", 
                            apiKey: "1234"
                        }
                    );
                } else {
                    console.log(`Can not open a connection. @${new Date()}`);
                }
            };

        }, connectTimeout);
    
        test(`assert the "${testReturnName}" within ${connectTimeout} ms.`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: "/unknown/path"
                }
            );
        }, connectTimeout);
    
        test(`assert the "FILE_LIST_RESPONSE.success" is false.`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    expect(FileListResponse.success).toBe(false);

                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: "/unknown/path"
                }
            );
        }, connectTimeout);  

        test(`assert the "FILE_LIST_RESPONSE.message" is not empty.`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    expect(FileListResponse.message).toBeDefined();
                    expect(FileListResponse.message).not.toEqual("");
                    if ( FileListResponse.message !== "" ) {
                        console.log(`As given an unknown path, returning message: "${FileListResponse.message}" @${new Date()}`);
                    }
                        
                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: "/unknown/path"
                }
            );
        }, connectTimeout);
        
        afterEach( done => {
            Connection.close();
            done();
        });
    });    
    
});
