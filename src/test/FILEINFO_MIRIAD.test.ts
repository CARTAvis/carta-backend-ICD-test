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
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    fileInfoRequest: {
        file: "M17_SWex.miriad",
        hdu: "",
    },
    fileInfoResponse: {
        success: true,
        message: "",
        fileInfo: {
            name: "M17_SWex.miriad",
            type: CARTA.FileType.MIRIAD,
            size: 52993642,
            HDUList: [""],
        },
        fileInfoExtended: {
            "": {
                dimensions: 4,
                width: 640,
                height: 800,
                depth: 25,
                stokes: 1,
                stokesVals: [],
                computedEntries: [
                    { name: "Name", value: "M17_SWex.miriad" },
                    { name: "Shape", value: "[640, 800, 25, 1]" },
                    {
                        name: "Number of channels",
                        value: "25",
                        entryType: 2,
                        numericValue: 25
                    },
                    {
                        name: "Number of stokes",
                        value: "1",
                        entryType: 2,
                        numericValue: 1
                    },
                    { name: "Coordinate type", value: "Right Ascension, Declination" },
                    { name: "Projection", value: "SIN" },
                    { name: "Image reference pixels", value: "[321.0, 401.0]" },
                    { name: "Image reference coords", value: "[18:20:21.0000, -016.12.10.0000]" },
                    { name: "Image ref coords (deg)", value: "[275.088 deg, -16.2028 deg]" },
                    { name: "Celestial frame", value: "FK5, J2000" },
                    { name: "Spectral frame", value: "BARY" },
                    { name: "Velocity definition", value: "RADIO" },
                    { name: "Pixel unit", value: "Jy/beam" },
                    { name: "Pixel increment", value: "-0.4\", 0.4\"" },
                    { name: "Restoring beam", value: "2.06105\" X 1.49126\", -74.6267 deg" }
                ],
                headerEntries: [
                    { name: "SIMPLE", value: "T", entryType: 2, numericValue: 1, comment: 'Standard FITS' },
                    { name: "BITPIX", value: "-32", entryType: 2, numericValue: -32, comment: 'Floating point (32 bit)' },
                    { name: "NAXIS", value: "4", entryType: 2, numericValue: 4 },
                    { name: "NAXIS1", value: "640", entryType: 2, numericValue: 640 },
                    { name: "NAXIS2", value: "800", entryType: 2, numericValue: 800 },
                    { name: "NAXIS3", value: "25", entryType: 2, numericValue: 25 },
                    { name: "NAXIS4", value: "1", entryType: 2, numericValue: 1 },
                    {
                        name: "BSCALE",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1,
                        comment: 'PHYSICAL = PIXEL*BSCALE + BZERO'
                    },
                    {
                        name: "BZERO",
                        value: "0.000000000000E+00",
                        entryType: 1,
                    },
                    {
                        name: "BMAJ",
                        value: "5.725135932445E-04",
                        entryType: 1,
                        numericValue: 0.0005725135932445429
                    },
                    {
                        name: "BMIN",
                        value: "4.142385813538E-04",
                        entryType: 1,
                        numericValue: 0.00041423858135383447
                    },
                    {
                        name: "BPA",
                        value: "-7.462673187256E+01",
                        entryType: 1,
                        numericValue: -74.6267318725586
                    },
                    { name: "BTYPE", value: "Intensity" },
                    { name: "OBJECT" },
                    { name: "BUNIT", value: "Jy/beam", comment: 'Brightness (pixel) unit' },
                    {
                        name: "EQUINOX",
                        value: "2000.0",
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
                        value: "-1.620277777779E+01",
                        entryType: 1,
                        numericValue: -16.202777777790004
                    },
                    {
                        name: "PC1_1",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "PC2_1", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC3_1", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC4_1", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC1_2", value: "0.000000000000E+00", entryType: 1 },
                    {
                        name: "PC2_2",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "PC3_2", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC4_2", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC1_3", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC2_3", value: "0.000000000000E+00", entryType: 1 },
                    {
                        name: "PC3_3",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "PC4_3", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC1_4", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC2_4", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC3_4", value: "0.000000000000E+00", entryType: 1 },
                    {
                        name: "PC4_4",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "CTYPE1", value: "RA---SIN" },
                    {
                        name: "CRVAL1",
                        value: "2.750875000001E+02",
                        entryType: 1,
                        numericValue: 275.08750000009996
                    },
                    {
                        name: "CDELT1",
                        value: "-1.111111111111E-04",
                        entryType: 1,
                        numericValue: -0.00011111111111110002
                    },
                    { name: "CRPIX1", value: "321.0", entryType: 1, numericValue: 321 },
                    { name: "CUNIT1", value: "deg" },
                    { name: "CTYPE2", value: "DEC--SIN" },
                    {
                        name: "CRVAL2",
                        value: "-1.620277777779E+01",
                        entryType: 1,
                        numericValue: -16.202777777790004
                    },
                    {
                        name: "CDELT2",
                        value: "1.111111111111E-04",
                        entryType: 1,
                        numericValue: 0.00011111111111110002
                    },
                    { name: "CRPIX2", value: "401.0", entryType: 1, numericValue: 401 },
                    { name: "CUNIT2", value: "deg" },
                    { name: "CTYPE3", value: "FREQ" },
                    {
                        name: "CRVAL3",
                        value: "8.675139618840E+10",
                        entryType: 1,
                        numericValue: 86751396188.40004
                    },
                    {
                        name: "CDELT3",
                        value: "-2.442377011414E+05",
                        entryType: 1,
                        numericValue: -244237.7011414
                    },
                    { name: "CRPIX3", value: "1.0", entryType: 1, numericValue: 1 },
                    { name: "CUNIT3", value: "Hz" },
                    { name: "CTYPE4", value: "STOKES" },
                    {
                        name: "CRVAL4",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    {
                        name: "CDELT4",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "CRPIX4", value: "1.0", entryType: 1, numericValue: 1 },
                    { name: "CUNIT4" },
                    { name: "PV2_1", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PV2_2", value: "0.000000000000E+00", entryType: 1 },
                    {
                        name: "RESTFRQ",
                        value: "8.675429000000E+10",
                        entryType: 1,
                        numericValue: 86754290000.00003,
                        comment: 'Rest Frequency (Hz)'
                    },
                    { name: "SPECSYS", value: "BARYCENT", comment: 'Spectral reference frame' },
                    {
                        name: "ALTRVAL",
                        value: "9.999999914138E+03",
                        entryType: 1,
                        numericValue: 9999.999914137677,
                        comment: 'Alternate frequency reference value'
                    },
                    {
                        name: "ALTRPIX",
                        value: "1.0",
                        entryType: 1, numericValue: 1,
                        comment: 'Alternate frequency reference pixel'
                    },
                    {
                        name: "VELREF",
                        value: "258",
                        entryType: 2,
                        numericValue: 258,
                        comment: '1 LSR, 2 HEL, 3 OBS, +256 Radio'
                    },
                    { name: "TELESCOP", value: "ALMA" },
                    { name: "DATE-OBS", value: "2016-04-03T13:02:58.799982" },
                    { name: "TIMESYS", value: "UTC" },
                    {
                        name: "OBSGEO-X",
                        value: "2.225142180269E+06",
                        entryType: 1,
                        numericValue: 2225142.180268967
                    },
                    {
                        name: "OBSGEO-Y",
                        value: "-5.440307370349E+06",
                        entryType: 1,
                        numericValue: -5440307.370348562
                    },
                    {
                        name: "OBSGEO-Z",
                        value: "-2.481029851874E+06",
                        entryType: 1,
                        numericValue: -2481029.851873547
                    },
                ],
            },
        },
    },
};

describe("FILEINFO_MIRIAD: Testing if info of an MIRIAD image file is correctly delivered by the backend", () => {

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

            test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType.FITS}`, () => {
                expect(FileInfoResponse.fileInfo.type).toBe(assertItem.fileInfoResponse.fileInfo.type);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${assertItem.fileInfoResponse.fileInfoExtended[''].dimensions}`, () => {
                expect(FileInfoResponse.fileInfoExtended[''].dimensions).toEqual(assertItem.fileInfoResponse.fileInfoExtended[''].dimensions);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.width = ${assertItem.fileInfoResponse.fileInfoExtended[''].width}`, () => {
                expect(FileInfoResponse.fileInfoExtended[''].width).toEqual(assertItem.fileInfoResponse.fileInfoExtended[''].width);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.height = ${assertItem.fileInfoResponse.fileInfoExtended[''].height}`, () => {
                expect(FileInfoResponse.fileInfoExtended[''].height).toEqual(assertItem.fileInfoResponse.fileInfoExtended[''].height);
            });

            if (assertItem.fileInfoResponse.fileInfoExtended[''].dimensions > 2) {
                test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${assertItem.fileInfoResponse.fileInfoExtended[''].depth}`, () => {
                    expect(FileInfoResponse.fileInfoExtended[''].depth).toEqual(assertItem.fileInfoResponse.fileInfoExtended[''].depth);
                });
            };

            if (assertItem.fileInfoResponse.fileInfoExtended[''].dimensions > 3) {
                test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${assertItem.fileInfoResponse.fileInfoExtended[''].stokes}`, () => {
                    expect(FileInfoResponse.fileInfoExtended[''].stokes).toEqual(assertItem.fileInfoResponse.fileInfoExtended[''].stokes);
                });
            };

            test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = [${assertItem.fileInfoResponse.fileInfoExtended[''].stokesVals}]`, () => {
                expect(FileInfoResponse.fileInfoExtended[''].stokesVals).toEqual(assertItem.fileInfoResponse.fileInfoExtended[''].stokesVals);
            });

            test(`len(FILE_INFO_RESPONSE.file_info_extended.computed_entries)==${assertItem.fileInfoResponse.fileInfoExtended[''].computedEntries.length}`, () => {
                expect(FileInfoResponse.fileInfoExtended[''].computedEntries.length).toEqual(assertItem.fileInfoResponse.fileInfoExtended[''].computedEntries.length);
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                assertItem.fileInfoResponse.fileInfoExtended[''].computedEntries.map((entry: CARTA.IHeaderEntry, index) => {
                    expect(parseFloat(FileInfoResponse.fileInfoExtended[''].computedEntries.find(f => f.name == entry.name).value)).toEqual(parseFloat(entry.value));
                });
            });

            test(`len(file_info_extended.header_entries)==${assertItem.fileInfoResponse.fileInfoExtended[''].headerEntries.length}`, () => {
                expect(FileInfoResponse.fileInfoExtended[''].headerEntries.length).toEqual(assertItem.fileInfoResponse.fileInfoExtended[''].headerEntries.length)
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                assertItem.fileInfoResponse.fileInfoExtended[''].headerEntries.map((entry: CARTA.IHeaderEntry, index) => {
                    expect(parseFloat(FileInfoResponse.fileInfoExtended[''].headerEntries.find(f => f.name == entry.name).value)).toEqual(parseFloat(entry.value));
                });
            });
        });
    });
    afterAll(() => Connection.close());
}); 