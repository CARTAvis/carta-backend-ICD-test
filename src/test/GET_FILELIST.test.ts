import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
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
        { directory: expectBasePath, },
        { directory: testSubdirectory, },
        { directory: testSubdirectory + "/empty_folder", },
    ],
    fileListResponseGroup: [
        {
            success: true,
            directory: ".",
            parent: "",
            files: [
                { name: "aJ.fits" },
            ],
            subdirectories: ["set_QA"],
        },
        {
            success: true,
            directory: testSubdirectory,
            parent: ".",
            files: [
                { name: "M17_SWex.fits" },
            ],
            subdirectories: [
                "empty_folder",
            ],
        },
        {
            success: true,
            directory: testSubdirectory + "/empty_folder",
            parent: testSubdirectory,
        },
    ],
}
describe("GET_FILELIST_DEFAULT_PATH tests: Testing generation of a file list at default path ($BASE)", () => {
    describe(`connect to CARTA "${testServerUrl}"`, () => {
        let Connection: Client;
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        assertItem.filelistGroup.map((filelist, index) => {
            describe(`access folder "${filelist.directory}"`, () => {
                let FileListResponseTemp: CARTA.FileListResponse;
                test(`should get "FILE_LIST_RESPONSE" within ${fileListTimeout} ms.`, async () => {
                    await Connection.send(CARTA.FileListRequest, filelist);
                    FileListResponseTemp = await Connection.receive(CARTA.FileListResponse);
                }, fileListTimeout);

                test(`FILE_LIST_RESPONSE.success = ${assertItem.fileListResponseGroup[index].success}`, () => {
                    expect(FileListResponseTemp.success).toBe(assertItem.fileListResponseGroup[index].success);
                });

                if (assertItem.fileListResponseGroup[index].parent !== undefined) {
                    test(`FILE_LIST_RESPONSE.parent is "${assertItem.fileListResponseGroup[index].parent}"`, () => {
                        expect(FileListResponseTemp.parent).toEqual(assertItem.fileListResponseGroup[index].parent)
                    });
                };

                test(`FILE_LIST_RESPONSE.directory = "${assertItem.fileListResponseGroup[index].directory}"`, () => {
                    expect(FileListResponseTemp.directory).toEqual(assertItem.fileListResponseGroup[index].directory);
                });

                if (assertItem.fileListResponseGroup[index].files !== undefined) {
                    assertItem.fileListResponseGroup[index].files.map((file) => {
                        test(`check FILE_LIST_RESPONSE.files[] should contain ${JSON.stringify(file)}`, () => {
                            let FileListResponseTempFilename = FileListResponseTemp.files.map(f => f.name)
                            expect(FileListResponseTempFilename).toEqual(expect.arrayContaining([file.name]));
                        })
                    })
                } else {
                    test("len(files) = 0", () => {
                        expect(FileListResponseTemp.files.length).toEqual(0);
                    })
                };

                if (assertItem.fileListResponseGroup[index].subdirectories !== undefined) {
                    assertItem.fileListResponseGroup[index].subdirectories.map((subdir) => {
                        test(`check FILE_LIST_RESPONSE.subdirectories[] should contain ${JSON.stringify(subdir)}`, () => {
                            // let FileListResponseTempSubdirectories = FileListResponseTemp.subdirectories.map(function (f, index) {
                            //     return f;
                            // })
                            let FileListResponseTempSubdirectories = FileListResponseTemp.subdirectories.map(f => f.name);
                            expect(FileListResponseTempSubdirectories).toEqual(expect.arrayContaining([subdir]));
                        })
                    })
                } else {
                    test("len(subdirectories) = 0", () => {
                        expect(FileListResponseTemp.subdirectories.length).toEqual(0);
                    })
                };
            });
        });

        afterAll(async () => await Connection.close());
    });

});

describe("GET_FILELIST_UNKNOWN_PATH tests: Testing error handle of file list generation if the requested path does not exist", () => {
    describe(`connect to CARTA "${testServerUrl}"`, () => {

        let Connection: Client;

        beforeAll(async () => {
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

        afterAll(async () => await Connection.close());
    });

});
