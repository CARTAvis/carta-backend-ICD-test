import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.directory;
let expectBasePath = config.path.base;
let connectTimeout = config.timeout.connection;
let fileListTimeout = config.timeout.listFile;
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
        let Connection: Client;
        beforeAll( async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        assertItem.filelistGroup.map( (filelist, index) => {
            describe(`access folder "${filelist.directory}"`, () => {
                let FileListResponseTemp: CARTA.FileListResponse;
                test(`should get "FILE_LIST_RESPONSE" within ${fileListTimeout} ms.`, async () => {
                    await Connection.send(CARTA.FileListRequest, filelist);
                    FileListResponseTemp = await Connection.receive(CARTA.FileListResponse);
                }, fileListTimeout);
            
                test(`FILE_LIST_RESPONSE.success = ${assertItem.fileListResponseGroup[index].success}`, () => {
                    expect(FileListResponseTemp.success).toBe(assertItem.fileListResponseGroup[index].success);
                });

                test(`FILE_LIST_RESPONSE.parent is "${assertItem.fileListResponseGroup[index].parent}"`, () => {
                    expect(FileListResponseTemp.parent).toEqual(assertItem.fileListResponseGroup[index].parent);
                });

                test(`FILE_LIST_RESPONSE.directory = "${assertItem.fileListResponseGroup[index].directory}"`, () => {
                    expect(FileListResponseTemp.directory).toEqual(assertItem.fileListResponseGroup[index].directory);
                });

                if(assertItem.fileListResponseGroup[index].files !== undefined) {
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

        afterAll( async () => await Connection.close());
    });
    
});

describe("GET_FILELIST_UNKNOWN_PATH tests: Testing error handle of file list generation if the requested path does not exist", () => {    
    describe(`connect to CARTA "${testServerUrl}"`, () => {

        let Connection: Client;
    
        beforeAll( async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);
    
        describe(`access folder "/unknown/path"`, () => {
            let FileListResponseTemp: CARTA.FileListResponse;
            test(`should get "FILE_LIST_RESPONSE" within ${fileListTimeout} ms.`, async () => {
                await Connection.send(CARTA.FileListRequest, 
                    {
                        directory: "/unknown/path",
                    }
                );
                FileListResponseTemp = await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse;
            }, fileListTimeout);
        
            test("FILE_LIST_RESPONSE.success == False", () => {
                expect(FileListResponseTemp.success).toBe(false);
            });

            test("FILE_LIST_RESPONSE.message is not empty", () => {
                let _message = FileListResponseTemp.message;
                expect(_message).toBeDefined();
                expect(_message).not.toBe("");
                console.warn(`As access folder "/unknown/path", FILE_LIST_RESPONSE.message is "${_message}"`);
            });
        });
        
        afterAll( async () => await Connection.close());
    });    
    
});
