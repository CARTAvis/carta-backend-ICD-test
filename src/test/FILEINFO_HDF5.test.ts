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
                computedEntries: [
                    { name: "Name", value: "M17_SWex.hdf5" },
                    { name: 'HDU', value: '0' },
                    { name: "Shape", value: "[640, 800, 25, 1]" },
                    {
                        name: "Number of channels",
                        value: "25",
                        entryType: 2,
                        numericValue: 25
                    },
                    {
                        name: "Number of polarizations",
                        value: "1",
                        entryType: 2,
                        numericValue: 1
                    },
                    { name: "Coordinate type", value: "Right Ascension, Declination" },
                    { name: "Projection", value: "SIN" },
                    { name: "Image reference pixels", value: "[321, 401]" },
                    { name: "Image reference coords", value: "[18:20:21.0000, -016.12.10.0000]" },
                    { name: "Image ref coords (deg)", value: "[275.088 deg, -16.2028 deg]" },
                    { name: "Celestial frame", value: "ICRS" },
                    { name: "Spectral frame", value: "LSRK" },
                    { name: "Velocity definition", value: "RADIO" },
                    { name: "Pixel unit", value: "Jy/beam" },
                    { name: "Pixel increment", value: "-0.4\", 0.4\"" },
                    { name: "Restoring beam", value: "2.06105\" X 1.49126\", -74.6267 deg" },
                    { name: 'Has mipmaps', value: 'T' }
                ],
                headerEntries: [
                    { name: 'SCHEMA_VERSION', value: '0.3' },
                    { name: 'HDF5_CONVERTER', value: 'hdf_convert' },
                    { name: 'HDF5_CONVERTER_VERSION', value: '0.1.10' },
                    { name: "SIMPLE", value: "T" },
                    { name: "BITPIX", value: "-32", entryType: 2, numericValue: -32 },
                    { name: "NAXIS", value: "4", entryType: 2, numericValue: 4 },
                    { name: "NAXIS1", value: "640", entryType: 2, numericValue: 640 },
                    { name: "NAXIS2", value: "800", entryType: 2, numericValue: 800 },
                    { name: "NAXIS3", value: "25", entryType: 2, numericValue: 25 },
                    { name: "NAXIS4", value: "1", entryType: 2, numericValue: 1 },
                    { name: 'EXTEND', value: 'T' },
                    {
                        name: "BSCALE",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    {
                        name: "BZERO",
                        value: "0.000000000000E+00",
                        entryType: 1,
                    },
                    {
                        name: "BMAJ",
                        value: "5.725136068132E-04",
                        entryType: 1,
                        numericValue: 0.0005725136068132
                    },
                    {
                        name: "BMIN",
                        value: "4.142385721207E-04",
                        entryType: 1,
                        numericValue: 0.0004142385721207
                    },
                    {
                        name: "BPA",
                        value: "-7.462673187256E+01",
                        entryType: 1,
                        numericValue: -74.62673187256
                    },
                    { name: "BTYPE", value: "Intensity" },
                    { name: "OBJECT", value: "M17SW" },
                    { name: "BUNIT", value: "Jy/beam" },
                    { name: "RADESYS", value: "ICRS" },
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
                        numericValue: -16.20277777779
                    },
                    {
                        name: "PC01_01",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "PC02_01", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC03_01", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC04_01", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC01_02", value: "0.000000000000E+00", entryType: 1 },
                    {
                        name: "PC02_02",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "PC03_02", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC04_02", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC01_03", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC02_03", value: "0.000000000000E+00", entryType: 1 },
                    {
                        name: "PC03_03",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "PC04_03", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC01_04", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC02_04", value: "0.000000000000E+00", entryType: 1 },
                    { name: "PC03_04", value: "0.000000000000E+00", entryType: 1 },
                    {
                        name: "PC04_04",
                        value: "1.000000000000E+00",
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: "CTYPE1", value: "RA---SIN" },
                    {
                        name: "CRVAL1",
                        value: "2.750875000001E+02",
                        entryType: 1,
                        numericValue: 275.0875000001
                    },
                    {
                        name: "CDELT1",
                        value: "-1.111111111111E-04",
                        entryType: 1,
                        numericValue: -0.0001111111111111
                    },
                    { name: "CRPIX1", value: "321.0000000000", entryType: 1, numericValue: 321 },
                    { name: "CUNIT1", value: "deg" },
                    { name: "CTYPE2", value: "DEC--SIN" },
                    {
                        name: "CRVAL2",
                        value: "-1.620277777779E+01",
                        entryType: 1,
                        numericValue: -16.20277777779
                    },
                    {
                        name: "CDELT2",
                        value: "1.111111111111E-04",
                        entryType: 1,
                        numericValue: 0.0001111111111111
                    },
                    { name: "CRPIX2", value: "401.0", entryType: 1, numericValue: 401 },
                    { name: "CUNIT2", value: "deg" },
                    { name: "CTYPE3", value: "FREQ" },
                    {
                        name: "CRVAL3",
                        value: "8.675139618840E+10",
                        entryType: 1,
                        numericValue: 86751396188.4
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
                        numericValue: 86754290000,
                        comment: 'Rest Frequency (Hz)'
                    },
                    { name: "SPECSYS", value: "LSRK" },
                    {
                        name: "ALTRVAL",
                        value: "9999.999914138",
                        entryType: 1,
                        numericValue: 9999.999914138
                    },
                    { name: "ALTRPIX", value: "1.0", entryType: 1, numericValue: 1 },
                    {
                        name: "VELREF",
                        value: "257",
                        entryType: 2,
                        numericValue: 257,
                        comment: '1 LSR, 2 HEL, 3 OBS, +256 Radio'
                    },
                    { name: "TELESCOP", value: "ALMA" },
                    { name: "OBSERVER", value: "sishii" },
                    { name: "DATE-OBS", value: "2016-04-03T13:02:58.800000" },
                    { name: "TIMESYS", value: "UTC" },
                    {
                        name: "OBSRA",
                        value: "2.750875000001E+02",
                        entryType: 1,
                        numericValue: 275.0875000001
                    },
                    {
                        name: "OBSDEC",
                        value: "-1.620277777779E+01",
                        entryType: 1,
                        numericValue: -16.202777777790004
                    },
                    {
                        name: "OBSGEO-X",
                        value: "2.225142180269E+06",
                        entryType: 1,
                        numericValue: 2225142.180269
                    },
                    {
                        name: "OBSGEO-Y",
                        value: "-5.440307370349E+06",
                        entryType: 1,
                        numericValue: 9999.999914138
                    },
                    {
                        name: "OBSGEO-Z",
                        value: "-2.481029851874E+06",
                        entryType: 1,
                        numericValue: -2481029.851874
                    },
                    { name: 'DATE', value: '2016-09-07T22:08:24.390000' },
                    { name: 'ORIGIN', value: 'CASA 4.5.2-REL (r36115)' }
                ],
            },
        },
    },
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

            test(`len(FILE_INFO_RESPONSE.file_info_extended.computed_entries)==${assertItem.fileInfoResponse.fileInfoExtended['0'].computedEntries.length}`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].computedEntries.length).toEqual(assertItem.fileInfoResponse.fileInfoExtended['0'].computedEntries.length);
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                assertItem.fileInfoResponse.fileInfoExtended['0'].computedEntries.map((entry: CARTA.IHeaderEntry, index) => {
                    if (isNaN(parseFloat(entry.value))){
                        expect(FileInfoResponse.fileInfoExtended['0'].computedEntries.find(f => f.name == entry.name).value).toEqual(entry.value);
                    } else {
                        expect(parseFloat(FileInfoResponse.fileInfoExtended['0'].computedEntries.find(f => f.name == entry.name).value)).toEqual(parseFloat(entry.value));
                    }
                });
            });

            test(`len(file_info_extended.header_entries)==${assertItem.fileInfoResponse.fileInfoExtended['0'].headerEntries.length}`, () => {
                expect(FileInfoResponse.fileInfoExtended['0'].headerEntries.length).toEqual(assertItem.fileInfoResponse.fileInfoExtended['0'].headerEntries.length);
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                assertItem.fileInfoResponse.fileInfoExtended['0'].headerEntries.map((entry: CARTA.IHeaderEntry, index) => {
                    if (isNaN(parseFloat(entry.value)) && entry.value != undefined){
                        expect(FileInfoResponse.fileInfoExtended['0'].headerEntries.find(f => f.name == entry.name).value).toEqual(entry.value);
                    } else {
                        expect(parseFloat(FileInfoResponse.fileInfoExtended['0'].headerEntries.find(f => f.name == entry.name).value)).toEqual(parseFloat(entry.value));
                    }
                });
            });
        });
    });
    afterAll(() => Connection.close());
});
