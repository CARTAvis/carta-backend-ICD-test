import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let fileListTimeout = config.timeout.listFile;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileListResponse: CARTA.IFileListResponse;
    filesNull: string[];
    foldersNull: string[];
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
    },
    filelist: { directory: testSubdirectory, },
    fileListResponse: {
        success: true,
        directory: testSubdirectory,
        parent: config.path.directory,
        files: [
            {
                name: "M17_SWex.image",
                type: CARTA.FileType.CASA,
                size: 53009869,
                HDUList: [""],
            },
            {
                name: "M17_SWex.fits",
                type: CARTA.FileType.FITS,
                size: 51393600,
                HDUList: ["0"],
            },
            {
                name: "M17_SWex.miriad",
                type: CARTA.FileType.MIRIAD,
                size: 52993642,
                HDUList: [""],
            },
            {
                name: "M17_SWex.hdf5",
                type: CARTA.FileType.HDF5,
                size: 112823720,
                HDUList: ["0"],
            },
            {
                name: "spire500_ext.fits",
                type: CARTA.FileType.FITS,
                size: 17591040,
                HDUList: ["1 ExtName: image", "6 ExtName: error", "7 ExtName: coverage"],
            },
        ],
    },
    filesNull: [
        "empty2.miriad",
        "empty2.fits",
        "empty2.image",
        "empty2.hdf5",
        "empty.txt",
        "empty.image",
        "empty.miriad",
        "empty.fits",
        "empty.hdf5",
    ],
    foldersNull: [
        "empty_folder",
        "empty.image",
        "empty.miriad",
        "empty.fits",
        "empty.hdf5",
    ],
}
describe("FILETYPE_PARSER test: Testing if all supported image types can be detected and displayed in the file list", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        let FileListResponseTemp: CARTA.FileListResponse;
        test(`should get "FILE_LIST_RESPONSE" within ${fileListTimeout} ms.`, async () => {
            await Connection.send(CARTA.FileListRequest, assertItem.filelist);
            FileListResponseTemp = await Connection.receive(CARTA.FileListResponse);
        }, fileListTimeout);

        test(`FILE_LIST_RESPONSE.success = ${assertItem.fileListResponse.success}`, () => {
            expect(FileListResponseTemp.success).toBe(assertItem.fileListResponse.success);
        });

        test(`FILE_LIST_RESPONSE.parent = "${assertItem.fileListResponse.parent}"`, () => {
            expect(FileListResponseTemp.parent).toEqual(assertItem.fileListResponse.parent);
        });

        test(`FILE_LIST_RESPONSE.directory = "${assertItem.fileListResponse.directory}"`, () => {
            expect(FileListResponseTemp.directory).toEqual(assertItem.fileListResponse.directory);
        });

        describe("Assert existent file", () => {
            assertItem.fileListResponse.files.map(file => {
                test(`${CARTA.FileType[file.type]} file "${file.name}" should exist, size=${file.size}, HDU=[${file.HDUList}].`, () => {
                    let _fileInfo = FileListResponseTemp.files.find(f => f.name === file.name);
                    expect(_fileInfo).toBeDefined();
                    expect(_fileInfo.type).toBe(file.type);
                    expect(_fileInfo.size.toNumber()).toEqual(file.size);
                    let _HDUList = _fileInfo.HDUList.map(f => f = f.trim());
                    file.HDUList.map(HDU => {
                        expect(_HDUList).toContainEqual(HDU.trim());
                    });
                });
            });
        });

        describe("Assert non-existent file", () => {
            assertItem.filesNull.map(file => {
                test(`the file "${file}" should not exist.`, () => {
                    expect(FileListResponseTemp.files).not.toContainEqual(file);
                });
            });
        });

        describe(`Assert the folder inside "${testSubdirectory}"`, () => {
            assertItem.foldersNull.map(folder => {
                test(`the folder "${folder}" should exist.`, () => {
                    expect(FileListResponseTemp.subdirectories).toContainEqual(folder);
                });
            });
        });
    });

    afterAll(async () => await Connection.close());
});
