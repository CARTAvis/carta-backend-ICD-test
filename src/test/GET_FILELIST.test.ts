import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.directory;
let expectBasePath = config.path.base;
let connectTimeout = config.timeout.connection;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelistGroup: CARTA.IFileListRequest[];
    fileListResponseGroup: CARTA.IFileListResponse[];
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
    },
    filelistGroup: [
        {directory: expectBasePath,},
        {directory: testSubdirectory,},
    ],
    fileListResponseGroup: [
        {
            success: true,
            directory: ".",
            parent: "",
            subdirectories: ["public"],
        },
        {
            success: true,
            directory: testSubdirectory,
            parent: ".",
            files: [
                {name: "aJ.fits"},
            ],
            subdirectories: ["set_QA"],
        },
    ],
}
describe("GET_FILELIST_DEFAULT_PATH tests: Testing generation of a file list at default path ($BASE)", () => {
    describe(`connect to CARTA "${testServerUrl}"`, () => {
        let Connection: WebSocket;
        beforeAll( done => {
            Connection = new WebSocket(testServerUrl);
            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;
            async function OnOpen (this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
                await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
                done();
            }
        }, connectTimeout);

        assertItem.filelistGroup.map( (filelist, index) => {
            describe(`access folder "${filelist.directory}"`, () => {
                let FileListResponseTemp: CARTA.FileListResponse;
                test(`should get "FILE_LIST_RESPONSE" within ${connectTimeout} ms.`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.FileListRequest, filelist);
                    await Utility.getEventAsync(Connection, CARTA.FileListResponse, 
                        (FileListResponse: CARTA.FileListResponse) => {
                            FileListResponseTemp = FileListResponse;
                        }
                    );
                }, connectTimeout);
            
                test(`FILE_LIST_RESPONSE.success = ${assertItem.fileListResponseGroup[index].success}`, () => {
                    expect(FileListResponseTemp.success).toBe(assertItem.fileListResponseGroup[index].success);
                });

                test(`FILE_LIST_RESPONSE.parent is "${assertItem.fileListResponseGroup[index].parent}"`, () => {
                    expect(FileListResponseTemp.parent).toEqual(assertItem.fileListResponseGroup[index].parent);
                });

                test(`FILE_LIST_RESPONSE.directory = "${assertItem.fileListResponseGroup[index].directory}"`, () => {
                    expect(FileListResponseTemp.directory).toEqual(assertItem.fileListResponseGroup[index].directory);
                });

                if(typeof assertItem.fileListResponseGroup[index].files !== "undefined") {
                    test(`FILE_LIST_RESPONSE.files[] should contain ${JSON.stringify(assertItem.fileListResponseGroup[index].files.map(f => f.name))}`, () => {
                        assertItem.fileListResponseGroup[index].files.map( file => {
                            expect(FileListResponseTemp.files.find(f => f.name === file.name)).toBeDefined();
                        });
                    });
                }

                test(`FILE_LIST_RESPONSE.subdirectories should contain "${assertItem.fileListResponseGroup[index].subdirectories}"`, () => {
                    assertItem.fileListResponseGroup[index].subdirectories.map( dir => {
                        expect(FileListResponseTemp.subdirectories).toContainEqual(dir);
                    });
                });
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
                await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
                await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
                done();
            }
        }, connectTimeout);
    
        describe(`access folder "/unknown/path"`, () => {
            let FileListResponseTemp: CARTA.FileListResponse;
            test(`should get "FILE_LIST_RESPONSE" within ${connectTimeout} ms.`, async () => {
                await Utility.setEventAsync(Connection, CARTA.FileListRequest, 
                    {
                        directory: "/unknown/path",
                    }
                );
                await Utility.getEventAsync(Connection, CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        FileListResponseTemp = FileListResponse;
                    }
                );
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
