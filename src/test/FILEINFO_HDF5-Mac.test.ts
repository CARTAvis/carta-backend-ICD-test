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
        directory: testSubdirectory,
        file: "M17_SWex.hdf5",
        hdu: "",
    },
    fileInfoResponse: {
        success: true,
        message: "",
        fileInfo: {
            name: "M17_SWex.hdf5",
            type: CARTA.FileType.HDF5,
            size: 112823720,
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
                    { name: 'Name', value: 'M17_SWex.hdf5' },
                    { name: 'HDU', value: '0' },
                    { name: 'Shape', value: '[640, 800, 25, 1]' },
                    {
                        name: 'Number of channels',
                        value: '25',
                        entryType: 2,
                        numericValue: 25
                    },
                    {
                        name: 'Number of stokes',
                        value: '1',
                        entryType: 2,
                        numericValue: 1
                    },
                    {
                        name: 'Coordinate type',
                        value: 'Right Ascension, Declination'
                    },
                    { name: 'Projection', value: 'SIN' },
                    { name: 'Image reference pixels', value: '[0, 0]' },
                    {
                        name: 'Image reference coords',
                        value: '[00:00:00.0000, +000.00.00.0000]'
                    },
                    { name: 'Image ref coords (deg)', value: '[0 deg, 0 deg]' },
                    { name: 'Pixel increment', value: '3600", 3600"' },
                    { name: 'Celestial frame', value: 'ICRS' },
                    { name: 'Spectral frame', value: 'LSRK' },
                    { name: 'Velocity definition', value: 'RADIO' },
                    { name: 'Pixel unit', value: 'Jy/beam' }],
                headerEntries: [
                    {
                        name: 'SIMPLE',
                        value: 'T',
                        entryType: 2,
                        numericValue: 1,
                        comment: 'Standard FITS'
                    },
                    { name: 'BITPIX', value: '-32', entryType: 2, numericValue: -32 },
                    { name: 'NAXIS', value: '4', entryType: 2, numericValue: 4 },
                    { name: 'NAXIS1', value: '640', entryType: 2, numericValue: 640 },
                    { name: 'NAXIS2', value: '800', entryType: 2, numericValue: 800 },
                    { name: 'NAXIS3', value: '25', entryType: 2, numericValue: 25 },
                    { name: 'NAXIS4', value: '1', entryType: 2, numericValue: 1 },
                    {
                        name: 'BSCALE',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'BZERO', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'BTYPE', value: 'Intensity' },
                    { name: 'OBJECT', value: 'M17SW' },
                    {
                        name: 'BUNIT',
                        value: 'Jy/beam',
                        comment: 'Brightness (pixel) unit'
                    },
                    { name: 'RADESYS', value: 'ICRS' },
                    {
                        name: 'LONPOLE',
                        value: '1.800000000000E+02',
                        entryType: 1,
                        numericValue: 180
                    },
                    { name: 'LATPOLE', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC1_1',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC2_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC3_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC4_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_2', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC2_2',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC3_2', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC4_2', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_3', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC2_3', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC3_3',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC4_3', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_4', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC2_4', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC3_4', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC4_4',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CTYPE1', value: 'RA---SIN' },
                    { name: 'CRVAL1', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'CDELT1',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CRPIX1', value: '0', entryType: 1 },
                    { name: 'CUNIT1', value: 'deg' },
                    { name: 'CTYPE2', value: 'DEC--SIN' },
                    { name: 'CRVAL2', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'CDELT2',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CRPIX2', value: '0', entryType: 1 },
                    { name: 'CUNIT2', value: 'deg' },
                    { name: 'CTYPE3', value: 'FREQ' },
                    { name: 'CRVAL3', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'CDELT3',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CRPIX3', value: '0', entryType: 1 },
                    { name: 'CUNIT3', value: 'Hz' },
                    { name: 'CTYPE4', value: 'STOKES' },
                    {
                        name: 'CRVAL4',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    {
                        name: 'CDELT4',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CRPIX4', value: '1', entryType: 1, numericValue: 1 },
                    { name: 'CUNIT4' },
                    { name: 'PV2_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PV2_2', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'TELESCOP', value: 'ALMA' },
                    { name: 'OBSERVER', value: 'sishii' },
                    { name: 'DATE-OBS', value: '2016-04-03T13:02:58.800000' },
                    { name: 'TIMESYS', value: 'UTC' },
                    {
                        name: 'OBSGEO-X',
                        value: '2.225142180269E+06',
                        entryType: 1,
                        numericValue: 2225142.1802689666
                    },
                    {
                        name: 'OBSGEO-Y',
                        value: '-5.440307370349E+06',
                        entryType: 1,
                        numericValue: -5440307.370348562
                    },
                    {
                        name: 'OBSGEO-Z',
                        value: '-2.481029851874E+06',
                        entryType: 1,
                        numericValue: -2481029.8518735464
                    },
                    { value: 'T' },
                    { name: 'ALTRVAL', value: '9.999999914138E+03' },
                    { name: 'ALTRPIX', value: '1.000000000000E+00' },
                    { name: 'SCHEMA_VERSION', value: '0.1' },
                    { name: 'HDF5_CONVERTER', value: 'hdf_convert' },
                    { name: 'HDF5_CONVERTER_VERSION', value: '0.1.2' },
                    { name: 'HDF5_DATE', value: '2016-09-07T22:08:24.390001' }],
            },
        },
    },
};

describe("FILEINFO test: Testing if info of an image file is correctly delivered by the backend", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        beforeAll(async () => { }, listFileTimeout);

        describe(`query the info of file : ${assertItem.fileInfoRequest.file}`, () => {
            let FileInfoResponse: CARTA.FileInfoResponse;
            test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                await Connection.send(CARTA.FileInfoRequest, assertItem.fileInfoRequest);
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

            test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${assertItem.fileInfoResponse.fileInfoExtended["0"].dimensions}`, () => {
                expect(FileInfoResponse.fileInfoExtended["0"].dimensions).toEqual(assertItem.fileInfoResponse.fileInfoExtended["0"].dimensions);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.width = ${assertItem.fileInfoResponse.fileInfoExtended["0"].width}`, () => {
                expect(FileInfoResponse.fileInfoExtended["0"].width).toEqual(assertItem.fileInfoResponse.fileInfoExtended["0"].width);
            });

            test(`FILE_INFO_RESPONSE.file_info_extended.height = ${assertItem.fileInfoResponse.fileInfoExtended["0"].height}`, () => {
                expect(FileInfoResponse.fileInfoExtended["0"].height).toEqual(assertItem.fileInfoResponse.fileInfoExtended["0"].height);
            });

            if (assertItem.fileInfoResponse.fileInfoExtended["0"].dimensions > 2) {
                test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${assertItem.fileInfoResponse.fileInfoExtended["0"].depth}`, () => {
                    expect(FileInfoResponse.fileInfoExtended["0"].depth).toEqual(assertItem.fileInfoResponse.fileInfoExtended["0"].depth);
                });
            };

            if (assertItem.fileInfoResponse.fileInfoExtended["0"].dimensions > 3) {
                test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${assertItem.fileInfoResponse.fileInfoExtended["0"].stokes}`, () => {
                    expect(FileInfoResponse.fileInfoExtended["0"].stokes).toEqual(assertItem.fileInfoResponse.fileInfoExtended["0"].stokes);
                });
            };

            test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = [${assertItem.fileInfoResponse.fileInfoExtended["0"].stokesVals}]`, () => {
                expect(FileInfoResponse.fileInfoExtended["0"].stokesVals).toEqual(assertItem.fileInfoResponse.fileInfoExtended["0"].stokesVals);
            });

            test(`len(FILE_INFO_RESPONSE.file_info_extended.computed_entries)==${assertItem.fileInfoResponse.fileInfoExtended["0"].computedEntries.length}`, () => {
                expect(FileInfoResponse.fileInfoExtended["0"].computedEntries.length).toEqual(assertItem.fileInfoResponse.fileInfoExtended["0"].computedEntries.length);
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                assertItem.fileInfoResponse.fileInfoExtended["0"].computedEntries.map((entry: CARTA.IHeaderEntry, index) => {
                    expect(FileInfoResponse.fileInfoExtended["0"].computedEntries).toContainEqual(entry);
                });
            });

            test(`len(file_info_extended.header_entries)==${assertItem.fileInfoResponse.fileInfoExtended["0"].headerEntries.length}`, () => {
                expect(FileInfoResponse.fileInfoExtended["0"].headerEntries.length).toEqual(assertItem.fileInfoResponse.fileInfoExtended["0"].headerEntries.length)
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                assertItem.fileInfoResponse.fileInfoExtended["0"].headerEntries.map((entry: CARTA.IHeaderEntry, index) => {
                    expect(FileInfoResponse.fileInfoExtended["0"].headerEntries).toContainEqual(entry);
                });
            });
        });
    });
    afterAll(() => Connection.close());
});
