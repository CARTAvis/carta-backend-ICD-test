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
    fileInfoExtendedString: string[];
    fileInfoResponse: CARTA.IFileInfoResponse;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    fileInfoRequest: {
        file: "spire500_ext.fits",
        hdu: "",
    },
    fileInfoExtendedString: ['1', '6', '7'],
    fileInfoResponse: {
        success: true,
        message: "",
        fileInfo: {
            name: "spire500_ext.fits",
            type: CARTA.FileType.FITS,
            size: 17591040,
            HDUList: [""],
        },
        fileInfoExtended: {
            '1': {
                dimensions: 2,
                width: 830,
                height: 870,
                depth: 1,
                stokes: 1,
                stokesVals: [],
            },
            '6': {
                dimensions: 2,
                width: 830,
                height: 870,
                depth: 1,
                stokes: 1,
                stokesVals: [],
            },
            '7': {
                dimensions: 2,
                width: 830,
                height: 870,
                depth: 1,
                stokes: 1,
                stokesVals: [],
            },
        },
    },
};

describe("FILEINFO_FITS_MULTIHDU: Testing if info of an FITS image file is correctly delivered by the backend", () => {

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
                assertItem.fileInfoResponse.fileInfo.HDUList.map((entry, index) => {
                    expect(FileInfoResponse.fileInfo.HDUList).toContainEqual(entry);
                });
            });

            test(`FILE_INFO_RESPONSE.file_info.name = "${assertItem.fileInfoResponse.fileInfo.name}"`, () => {
                expect(FileInfoResponse.fileInfo.name).toEqual(assertItem.fileInfoResponse.fileInfo.name);
            });

            test(`FILE_INFO_RESPONSE.file_info.size = ${assertItem.fileInfoResponse.fileInfo.size}`, () => {
                expect(FileInfoResponse.fileInfo.size.toString()).toEqual(assertItem.fileInfoResponse.fileInfo.size.toString());
            });

            test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType.FITS}`, () => {
                expect(FileInfoResponse.fileInfo.type).toBe(assertItem.fileInfoResponse.fileInfo.type);
            });

            assertItem.fileInfoExtendedString.map((input, index) => {
                describe(`FileInfoExtended of '${input}':`, () => {
                    test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${assertItem.fileInfoResponse.fileInfoExtended[input].dimensions}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].dimensions).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].dimensions);
                    });

                    test(`FILE_INFO_RESPONSE.file_info_extended.width = ${assertItem.fileInfoResponse.fileInfoExtended[input].width}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].width).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].width);
                    });

                    test(`FILE_INFO_RESPONSE.file_info_extended.height = ${assertItem.fileInfoResponse.fileInfoExtended[input].height}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].height).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].height);
                    });

                    if (assertItem.fileInfoResponse.fileInfoExtended[input].dimensions >= 2) {
                        test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${assertItem.fileInfoResponse.fileInfoExtended[input].depth}`, () => {
                            expect(FileInfoResponse.fileInfoExtended[input].depth).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].depth);
                        });
                    };

                    if (assertItem.fileInfoResponse.fileInfoExtended[input].dimensions >= 2) {
                        test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${assertItem.fileInfoResponse.fileInfoExtended[input].stokes}`, () => {
                            expect(FileInfoResponse.fileInfoExtended[input].stokes).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].stokes);
                        });
                    };

                    test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = [${assertItem.fileInfoResponse.fileInfoExtended[input].stokesVals}]`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].stokesVals).toEqual(assertItem.fileInfoResponse.fileInfoExtended[input].stokesVals);
                    });

                    test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].computedEntries).toMatchSnapshot();
                    });

                    test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                        expect(FileInfoResponse.fileInfoExtended[input].headerEntries).toMatchSnapshot();
                    });
                });
            })
        });
    });
    afterAll(() => Connection.close());
});