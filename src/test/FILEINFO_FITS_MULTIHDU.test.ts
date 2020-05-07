import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = 100;//config.timeout.openFile;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileInfoRequest: CARTA.IFileInfoRequest[];
    fileInfoResponse: CARTA.IFileInfoResponse[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileInfoRequest: [
        {
            directory: testSubdirectory,
            file: "spire500_ext.fits",
            hdu: "1 ExtName: image",
        },
    ],
    fileInfoResponse: [
        {
            success: true,
            message: "",
            fileInfo: {
                name: "spire500_ext.fits",
                type: CARTA.FileType.FITS,
                size: 17591040,
                HDUList: ["1 ExtName: image   ", "6 ExtName: error   ", "7 ExtName: coverage"],
            },
            fileInfoExtended: {
                dimensions: 2,
                width: 830,
                height: 870,
                depth: 1,
                stokes: 1,
                stokesVals: [],
                computedEntries: [
                    { name: "Name", value: "spire500_ext.fits" },
                    { name: "Shape", value: "[830, 870]" },
                    { name: "Coordinate type", value: "Right Ascension, Declination" },
                    { name: "Projection", value: "TAN" },
                    { name: "Image reference pixels", value: "[371, 421]" },
                    { name: "Image reference coords", value: "[07:09:13.1081, -010.36.38.5952]" },
                    { name: "Image ref coords (deg)", value: "[107.305 deg, -10.6107 deg]" },
                    { name: "Celestial frame", value: "FK5, J2000" },
                    { name: "Pixel unit", value: "MJy/sr" },
                    { name: "Pixel increment", value: "-14\", 14\"" },
                ],
                headerEntries: [
                    { name: "SIMPLE", value: "T / Standard FITS", entryType: 2, numericValue: 1 },
                    { name: "BITPIX", value: "-32 / Floating point (32 bit)", entryType: 2, numericValue: -32 },
                    { name: "NAXIS", value: "2", entryType: 2, numericValue: 2 },
                    { name: "NAXIS1", value: "830", entryType: 2, numericValue: 830 },
                    { name: "NAXIS2", value: "870", entryType: 2, numericValue: 870 },
                    {
                        name: "BSCALE",
                        value: "1.000000000000E+00 / PHYSICAL = PIXEL*BSCALE + BZERO",
                        entryType: 1,
                        numericValue: 1
                    },
                    {
                        name: "BZERO",
                        value: "0.000000000000E+00",
                        entryType: 1,
                    },
                    { name: "BTYPE", value: "Intensity" },
                    { name: "OBJECT" },
                    { name: "BUNIT", value: "MJy/sr / Brightness (pixel) unit" },
                    {
                        name: "EQUINOX",
                        value: "2000",
                        entryType: 1,
                        numericValue: 2000
                    },

                    { name: "RADESYS", value: "FK5" },
                    {
                        name: "LONPOLE",
                        value: "1.800000000000E+02",
                        entryType: 1,
                        numericValue: 180
                    },
                    {
                        name: "LATPOLE",
                        value: "-1.061072089652E+01",
                        entryType: 1,
                        numericValue: -10.610720896516849
                    },
                    {
                        name: "PC1_1",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "PC2_1", value: "-0.000000000000E+00", entryType: 1 },
                    { name: "PC1_2", value: "0.000000000000E+00", entryType: 1 },
                    {
                        name: "PC2_2",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "CTYPE1", value: "RA---TAN" },
                    {
                        name: "CRVAL1",
                        value: "1.073046172702E+02",
                        entryType: 1,
                        numericValue: 107.30461727023817
                    },
                    {
                        name: "CDELT1",
                        value: "-3.888888888889E-03",
                        entryType: 1,
                        numericValue: -0.003888888888889
                    },
                    { name: "CRPIX1", value: "371", entryType: 1, numericValue: 371 },
                    { name: "CUNIT1", value: "deg" },
                    { name: "CTYPE2", value: "DEC--TAN" },
                    {
                        name: "CRVAL2",
                        value: "-1.061072089652E+01",
                        entryType: 1,
                        numericValue: -10.610720896516849
                    },
                    {
                        name: "CDELT2",
                        value: "3.888888888889E-03",
                        entryType: 1,
                        numericValue: 0.003888888888889
                    },
                    { name: "CRPIX2", value: "421", entryType: 1, numericValue: 421 },
                    { name: "CUNIT2", value: "deg" },
                    { name: "LONGSTRN", value: "OGIP 1.0" },
                    { name: "EXTNAME", value: "image" },
                    { name: "CLASS___", value: "herschel.ia.dataset.ArrayDataset" },
                    { name: "INFO____", value: "Image" },
                    { name: "DATA____", value: "herschel.ia.numeric.Double2d" },
                    { name: "QTTY____", value: "MJy/sr" },
                    {
                        name: "META_0",
                        value: "2",
                        entryType: 2,
                        numericValue: 2
                    },
                    {
                        name: "META_1",
                        value: "830",
                        entryType: 2,
                        numericValue: 830
                    },
                    {
                        name: "META_2",
                        value: "870",
                        entryType: 2,
                        numericValue: 870
                    },
                    { name: "TIMESYS", value: "UTC / Time system for HDU" },
                ],
            },
        },
    ],
};

describe("FILEINFO test: Testing if info of an image file is correctly delivered by the backend", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.FileListRequest, assertItem.filelist);
            await Connection.receive(CARTA.FileListResponse);
        }, listFileTimeout);

        describe(`query the info of file : ${assertItem.fileInfoRequest[0].file}`, () => {
            let FileInfoResponseTemp: CARTA.FileInfoResponse;
            test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                await Connection.send(CARTA.FileInfoRequest, assertItem.fileInfoRequest[0]);
                FileInfoResponseTemp = await Connection.receive(CARTA.FileInfoResponse);
            }, openFileTimeout);

            test("FILE_INFO_RESPONSE.success = true", () => {
                expect(FileInfoResponseTemp.success).toBe(true);
            });

            test(`FILE_INFO_RESPONSE.file_info.HDU_List = [${assertItem.fileInfoResponse[0].fileInfo.HDUList}]`, () => {
                assertItem.fileInfoResponse[0].fileInfo.HDUList.map((entry, index) => {
                    expect(FileInfoResponseTemp.fileInfo.HDUList).toContainEqual(entry);
                });
            });

            test(`FILE_INFO_RESPONSE.file_info.name = "${assertItem.fileInfoResponse[0].fileInfo.name}"`, () => {
                expect(FileInfoResponseTemp.fileInfo.name).toEqual(assertItem.fileInfoResponse[0].fileInfo.name);
            });

            test(`FILE_INFO_RESPONSE.file_info.size = ${assertItem.fileInfoResponse[0].fileInfo.size}`, () => {
                expect(FileInfoResponseTemp.fileInfo.size.toString()).toEqual(assertItem.fileInfoResponse[0].fileInfo.size.toString());
            });

            test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType.FITS}`, () => {
                expect(FileInfoResponseTemp.fileInfo.type).toBe(assertItem.fileInfoResponse[0].fileInfo.type);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${assertItem.fileInfoResponse[0].fileInfoExtended.dimensions}`, () => {
                expect(FileInfoResponseTemp.fileInfoExtended.dimensions).toEqual(assertItem.fileInfoResponse[0].fileInfoExtended.dimensions);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.width = ${assertItem.fileInfoResponse[0].fileInfoExtended.width}`, () => {
                expect(FileInfoResponseTemp.fileInfoExtended.width).toEqual(assertItem.fileInfoResponse[0].fileInfoExtended.width);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.height = ${assertItem.fileInfoResponse[0].fileInfoExtended.height}`, () => {
                expect(FileInfoResponseTemp.fileInfoExtended.height).toEqual(assertItem.fileInfoResponse[0].fileInfoExtended.height);
            });

            if (assertItem.fileInfoResponse[0].fileInfoExtended.dimensions > 2) {
                test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${assertItem.fileInfoResponse[0].fileInfoExtended.depth}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.depth).toEqual(assertItem.fileInfoResponse[0].fileInfoExtended.depth);
                });
            };

            if (assertItem.fileInfoResponse[0].fileInfoExtended.dimensions > 3) {
                test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${assertItem.fileInfoResponse[0].fileInfoExtended.stokes}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.stokes).toEqual(assertItem.fileInfoResponse[0].fileInfoExtended.stokes);
                });
            };

            test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = [${assertItem.fileInfoResponse[0].fileInfoExtended.stokesVals}]`, () => {
                expect(FileInfoResponseTemp.fileInfoExtended.stokesVals).toEqual(assertItem.fileInfoResponse[0].fileInfoExtended.stokesVals);
            });

            test(`len(FILE_INFO_RESPONSE.file_info_extended.computed_entries)==${assertItem.fileInfoResponse[0].fileInfoExtended.computedEntries.length}`, () => {
                expect(FileInfoResponseTemp.fileInfoExtended.computedEntries.length).toEqual(assertItem.fileInfoResponse[0].fileInfoExtended.computedEntries.length);
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                assertItem.fileInfoResponse[0].fileInfoExtended.computedEntries.map((entry: CARTA.IHeaderEntry, index) => {
                    expect(FileInfoResponseTemp.fileInfoExtended.computedEntries).toContainEqual(entry);
                });
            });

            test(`len(file_info_extended.header_entries)==${assertItem.fileInfoResponse[0].fileInfoExtended.headerEntries.length}`, () => {
                expect(FileInfoResponseTemp.fileInfoExtended.headerEntries.length).toEqual(assertItem.fileInfoResponse[0].fileInfoExtended.headerEntries.length)
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                assertItem.fileInfoResponse[0].fileInfoExtended.headerEntries.map((entry: CARTA.IHeaderEntry, index) => {
                    expect(FileInfoResponseTemp.fileInfoExtended.headerEntries).toContainEqual(entry);
                });
            });
        });
    });
    afterAll(() => Connection.close());
});