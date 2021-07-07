import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    fileInfoRequest: CARTA.IFileInfoRequest;
    fileInfoResponse: CARTA.IFileInfoResponse;
    lenComputedEntries: number;
    lenHeaderEntries: number;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    fileInfoRequest: {
        file: "M17_SWex.hdf5",
        hdu: "",
    },
    fileInfoResponse: {
        success: true,
        message: "",
        fileInfo: {
            name: "M17_SWex.hdf5",
            type: CARTA.FileType.HDF5,
            size: 185333128,
            HDUList: ["0"],
        },
        fileInfoExtended: {
            '0': {
                dimensions: 4,
                width: 640,
                height: 800,
                depth: 25,
                stokes: 1,
                stokesVals: [],
            },
        },
    },
    lenComputedEntries: 17,
    lenHeaderEntries: 76,
};

describe("FILEINFO_HDF5: Testing if info of an HDF5 image file is correctly delivered by the backend", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        let basePath: string;
        beforeAll(async () => {
            await Connection.send(CARTA.FileListRequest, { directory: "$BASE" });
            basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
        }, listFileTimeout);

        describe(`query the info of file : ${assertItem.fileInfoRequest.file}`, () => {
            let FileInfoResponse: CARTA.FileInfoResponse;
            test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                await Connection.send(CARTA.FileInfoRequest, {
                    directory: `${basePath}/` + testSubdirectory,
                    ...assertItem.fileInfoRequest,
                });
                FileInfoResponse = await Connection.receive(CARTA.FileInfoResponse);
            }, openFileTimeout);

            test("FILE_INFO_RESPONSE.success = true", () => {
                expect(FileInfoResponse.success).toBe(true);
            });

            test(`FILE_INFO_RESPONSE.file_info.HDU_List = [${assertItem.fileInfoResponse.fileInfo.HDUList}]`, () => {
                expect(FileInfoResponse.fileInfo.HDUList[0]).toBe(assertItem.fileInfoResponse.fileInfo.HDUList[0]);
            });

            test(`FILE_INFO_RESPONSE.file_info.name = "${assertItem.fileInfoResponse.fileInfo.name}"`, () => {
                expect(FileInfoResponse.fileInfo.name).toEqual(assertItem.fileInfoResponse.fileInfo.name);
            });

            test(`FILE_INFO_RESPONSE.file_info.size = ${assertItem.fileInfoResponse.fileInfo.size}`, () => {
                expect(FileInfoResponse.fileInfo.size.toString()).toEqual(assertItem.fileInfoResponse.fileInfo.size.toString());
            });

            test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType.HDF5}`, () => {
                expect(FileInfoResponse.fileInfo.type).toBe(assertItem.fileInfoResponse.fileInfo.type);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${assertItem.fileInfoResponse.fileInfoExtended['0'].dimensions}`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].dimensions).toEqual(assertItem.fileInfoResponse.fileInfoExtended['0'].dimensions);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.width = ${assertItem.fileInfoResponse.fileInfoExtended['0'].width}`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].width).toEqual(assertItem.fileInfoResponse.fileInfoExtended['0'].width);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.height = ${assertItem.fileInfoResponse.fileInfoExtended['0'].height}`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].height).toEqual(assertItem.fileInfoResponse.fileInfoExtended['0'].height);
            });

            if (assertItem.fileInfoResponse.fileInfoExtended['0'].dimensions > 2) {
                test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${assertItem.fileInfoResponse.fileInfoExtended['0'].depth}`, () => {
                    expect(FileInfoResponse.fileInfoExtended['0'].depth).toEqual(assertItem.fileInfoResponse.fileInfoExtended['0'].depth);
                });
            };

            if (assertItem.fileInfoResponse.fileInfoExtended['0'].dimensions > 3) {
                test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${assertItem.fileInfoResponse.fileInfoExtended['0'].stokes}`, () => {
                    expect(FileInfoResponse.fileInfoExtended['0'].stokes).toEqual(assertItem.fileInfoResponse.fileInfoExtended['0'].stokes);
                });
            };

            test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = [${assertItem.fileInfoResponse.fileInfoExtended['0'].stokesVals}]`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].stokesVals).toEqual(assertItem.fileInfoResponse.fileInfoExtended['0'].stokesVals);
            });

            test(`len(FILE_INFO_RESPONSE.file_info_extended.computed_entries)==${assertItem.lenComputedEntries}`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].computedEntries.length).toEqual(assertItem.lenComputedEntries);
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].computedEntries).toMatchSnapshot();
            });

            test(`len(file_info_extended.header_entries)==${assertItem.lenHeaderEntries}`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].headerEntries.length).toEqual(assertItem.lenHeaderEntries);
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].headerEntries).toMatchSnapshot();
            });
        });
    });
    afterAll(() => Connection.close());
});
