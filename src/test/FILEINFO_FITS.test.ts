import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;

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
            file: "M17_SWex.fits",
            hdu: "0",
        },
    ],
    fileInfoResponse: [
        {
            success: true,
            message: "",
            fileInfo: {
                name: "M17_SWex.fits",
                type: CARTA.FileType.FITS,
                size: 51393600,
                HDUList: ["0"],
            },
            fileInfoExtended: {
                dimensions: 4,
                width: 640,
                height: 800,
                depth: 25,
                stokes: 1,
                stokesVals: [],
                headerEntries: [
                    { name: "NAXIS", value: "4", entryType: 2, numericValue: 4 },
                    { name: "NAXIS1", value: "640", entryType: 2, numericValue: 640 },
                    { name: "NAXIS2", value: "800", entryType: 2, numericValue: 800 },
                    { name: "NAXIS3", value: "25", entryType: 2, numericValue: 25 },
                    { name: "NAXIS4", value: "1", entryType: 2, numericValue: 1 },
                    {
                        name: "BMAJ",
                        value: "0.000572514",
                        entryType: 1,
                        numericValue: 0.0005725136068132
                    },
                    {
                        name: "BMIN",
                        value: "0.000414239",
                        entryType: 1,
                        numericValue: 0.00041423857212070003
                    },
                    {
                        name: "BPA",
                        value: "-74.6267",
                        entryType: 1,
                        numericValue: -74.62673187256
                    },
                    { name: "BUNIT", value: "Jy/beam" },
                    { name: "LONPOLE", value: "180", entryType: 1, numericValue: 180 },
                    {
                        name: "LATPOLE",
                        value: "-16.2028",
                        entryType: 1,
                        numericValue: -16.20277777779
                    },
                    { name: "CTYPE3", value: "FREQ" },
                    {
                        name: "CRVAL3",
                        value: "8.67514e+10",
                        entryType: 1,
                        numericValue: 86751396188.4
                    },
                    {
                        name: "CDELT3",
                        value: "-244238",
                        entryType: 1,
                        numericValue: -244237.7011414
                    },
                    { name: "CRPIX3", value: "1", entryType: 1, numericValue: 1 },
                    { name: "CUNIT3", value: "Hz" },
                    { name: "CTYPE4", value: "STOKES" },
                    { name: "CRVAL4", value: "1", entryType: 1, numericValue: 1 },
                    { name: "CDELT4", value: "1", entryType: 1, numericValue: 1 },
                    { name: "CRPIX4", value: "1", entryType: 1, numericValue: 1 },
                    { name: "CUNIT4" },
                    {
                        name: "RESTFRQ",
                        value: "8.67543e+10",
                        entryType: 1,
                        numericValue: 86754290000
                    },
                    { name: "VELREF", value: "257", entryType: 2, numericValue: 257 },
                ],
                computedEntries: [
                    { name: "Name", value: "M17_SWex.fits" },
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
                    { name: "Image reference pixels", value: "[321, 401]" },
                    { name: "Image reference coords", value: "[18:20:21.0000, -016.12.10.0000]" },
                    { name: "Image ref coords (deg)", value: "[275.088 deg, -16.2028 deg]" },
                    { name: "Celestial frame", value: "ICRS" },
                    { name: "Spectral frame", value: "LSRK" },
                    { name: "Velocity definition", value: "RADIO" },
                    { name: "Pixel unit", value: "Jy/beam" },
                    { name: "Pixel increment", value: "-0.4\", 0.4\"" },
                    { name: "Restoring beam", value: "2.06105\" X 1.49126\", -74.6267 deg" }
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

    // test(`(Step 0) Connection Open?`, () => {
    //     expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    // });

    describe(`Go to "${testSubdirectory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.FileListRequest, assertItem.filelist);
            await Connection.receive(CARTA.FileListResponse);
        }, listFileTimeout);

        // test(`(Step 0) Connection Open?`, () => {
        //     expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        // });

        describe(`query the info of file : ${assertItem.fileInfoRequest[0].file}`, () => {
            let FileInfoResponseTemp: CARTA.FileInfoResponse;
            test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                await Connection.send(CARTA.FileInfoRequest, assertItem.fileInfoRequest[0]);
                FileInfoResponseTemp = await Connection.receive(CARTA.FileInfoResponse);
                // console.log(FileInfoResponseTemp.fileInfo.type);
            }, openFileTimeout);

            test("FILE_INFO_RESPONSE.success = true", () => {
                expect(FileInfoResponseTemp.success).toBe(true);
            });

            test(`FILE_INFO_RESPONSE.file_info.HDU_List = [${assertItem.fileInfoResponse[0].fileInfo.HDUList}]`, () => {
                expect(FileInfoResponseTemp.fileInfo.HDUList[0]).toBe(assertItem.fileInfoResponse[0].fileInfo.HDUList[0]);
            });

            test(`FILE_INFO_RESPONSE.file_info.name = "${assertItem.fileInfoResponse[0].fileInfo.name}"`, () => {
                expect(FileInfoResponseTemp.fileInfo.name).toEqual(assertItem.fileInfoResponse[0].fileInfo.name);
            });

            test(`FILE_INFO_RESPONSE.file_info.size = ${assertItem.fileInfoResponse[0].fileInfo.size}`, () => {
                expect(FileInfoResponseTemp.fileInfo.size.toString()).toEqual(assertItem.fileInfoResponse[0].fileInfo.size.toString());
            });

            test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType[assertItem.fileInfoResponse[0].fileInfo.type]}`, () => {
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

            test(`len(FILE_INFO_RESPONSE.file_info_extended.computed_entries)==15`, () => {
                expect(FileInfoResponseTemp.fileInfoExtended.computedEntries.length).toEqual(assertItem.fileInfoResponse[0].fileInfoExtended.computedEntries.length);
            });

            test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                assertItem.fileInfoResponse[0].fileInfoExtended.computedEntries.map((entry: CARTA.IHeaderEntry, index) => {
                    console.log(entry)
                    console.log(FileInfoResponseTemp.fileInfoExtended.computedEntries[index])
                    expect(FileInfoResponseTemp.fileInfoExtended.computedEntries).toContainEqual(entry);
                    // expect(FileInfoResponseTemp.fileInfoExtended.computedEntries).toContainEqual(entry);
                });

            });
        });
    });
    afterAll(() => Connection.close());
});