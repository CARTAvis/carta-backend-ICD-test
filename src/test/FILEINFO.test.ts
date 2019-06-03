import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;
interface ImageAssertItem {
    fileName: string;
    hdu: string;
    HDUList: string[];
    fileSize: number;
    fileType: CARTA.FileType;
    shape: number[];
    NAXIS: number;
    computerEntries: CARTA.IHeaderEntry[];
    headerEntries: CARTA.IHeaderEntry[];
}
let imageAssertItems: ImageAssertItem[] = [
    {
        fileName: "M17_SWex.fits", 
        hdu: "0", HDUList: ["0"], 
        fileSize: 51393600, 
        fileType: CARTA.FileType.FITS, 
        shape: [640, 800, 25, 1], NAXIS: 4, 
        computerEntries: [ 
            { name: "Name", value: "M17_SWex.fits" },
            { name: "Shape", value: "[640, 800, 25, 1]" },
            {
                name: "Number of channels",
                value: "25",
                entryType: 2,
                numericValue: 25 },
            {
                name: "Number of Stokes",
                value: "1",
                entryType: 2,
                numericValue: 1 },
            { name: "Coordinate type", value: "RA---SIN, DEC--SIN" },
            { name: "Image reference pixels", value: "[321, 401] " },
            {
                name: "Image reference coordinates",
                value: "[275.0875 deg, -16.2028 deg]" },
            {
                name: "Image ref coords (coord type)",
                value: "[18:20:21.0000, -016.12.10.0000]" },
            { name: "Celestial frame", value: "ICRS" },
            { name: "Spectral frame", value: "LSRK" },
            { name: "Pixel unit", value: "Jy/beam" },
            { name: "Pixel increment", value: "-0.40\", 0.40\"" },
            { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } 
        ],
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
                numericValue: 0.0005725136068132 },
            {
                name: "BMIN",
                value: "0.000414239",
                entryType: 1,
                numericValue: 0.00041423857212070003 },
            {
                name: "BPA",
                value: "-74.6267",
                entryType: 1,
                numericValue: -74.62673187256 },
            { name: "BUNIT", value: "Jy/beam" },
            { name: "LONPOLE", value: "180", entryType: 1, numericValue: 180 },
            {
                name: "LATPOLE",
                value: "-16.2028",
                entryType: 1,
                numericValue: -16.20277777779 },
            { name: "CTYPE3", value: "FREQ" },
            {
                name: "CRVAL3",
                value: "8.67514e+10",
                entryType: 1,
                numericValue: 86751396188.4 },
            {
                name: "CDELT3",
                value: "-244238",
                entryType: 1,
                numericValue: -244237.7011414 },
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
                numericValue: 86754290000 },
            { name: "VELREF", value: "257", entryType: 2, numericValue: 257 },
        ], 
    },
    {
        fileName: "M17_SWex.image", 
        hdu: "", HDUList: [""], 
        fileSize: 53009869, 
        fileType: CARTA.FileType.CASA, 
        shape: [640, 800, 25, 1], NAXIS: 4, 
        computerEntries: [ 
            { name: "Name", value: "M17_SWex.image" },
            { name: "Shape", value: "[640, 800, 25, 1]" },
            {
                name: "Number of channels",
                value: "25",
                entryType: 2,
                numericValue: 25 },
            {
                name: "Number of Stokes",
                value: "1",
                entryType: 2,
                numericValue: 1 },
            { name: "Coordinate type", value: "RA---SIN, DEC--SIN" },
            { name: "Image reference pixels", value: "[321, 401]" },
            {
                name: "Image reference coordinates",
                value: "[275.088 deg, -16.203 deg]" },
            {
                name: "Image ref coords (coord type)",
                value: "[18:20:21.0000 -016.12.10.0000]" },
            { name: "Celestial frame", value: "ICRS, 2000" },
            { name: "Spectral frame", value: "LSRK" },
            { name: "Pixel unit", value: "Jy/beam" },
            { name: "Pixel increment", value: "-0.40\", 0.40\"" },
            { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } ],
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
                numericValue: 0.0005725136068132 },
            {
                name: "BMIN",
                value: "0.000414239",
                entryType: 1,
                numericValue: 0.0004142385721207 },
            {
                name: "BPA",
                value: "-74.6267",
                entryType: 1,
                numericValue: -74.6267318725586 },
            { name: "BUNIT", value: "Jy/beam" },
            { name: "CTYPE3", value: "Frequency" },
            {
                name: "CRVAL3",
                value: "8.67514e+10",
                entryType: 1,
                numericValue: 86751396188.4 },
            {
                name: "CDELT3",
                value: "-244238",
                entryType: 1,
                numericValue: -244237.7011414 },
            { name: "CRPIX3", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT3", value: "Hz" },
            { name: "CTYPE4", value: "Stokes" },
            { name: "CRVAL4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CDELT4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CRPIX4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT4" },
            {
                name: "RESTFRQ",
                value: "8.67543e+10 Hz\n",
                entryType: 1,
                numericValue: 86754290000 },
        ], 
    },
    {
        fileName: "M17_SWex.hdf5", 
        hdu: "0", HDUList: ["0"], 
        fileSize: 112823720, 
        fileType: CARTA.FileType.HDF5, 
        shape: [640, 800, 25, 1], NAXIS: 4, 
        computerEntries: [ 
            { name: "Name", value: "M17_SWex.hdf5" },
            { name: "Shape", value: "[640, 800, 25, 1]" },
            {
                name: "Number of channels",
                value: "25",
                entryType: 2,
                numericValue: 25 },
            {
                name: "Number of Stokes",
                value: "1",
                entryType: 2,
                numericValue: 1 },
            { name: "Coordinate type", value: "RA---SIN, DEC--SIN" },
            {
                name: "Image reference pixels",
                value: "[3.210000000000E+02, 4.010000000000E+02] " },
            {
                name: "Image reference coordinates",
                value: "[275.0875 deg, -16.2028 deg]" },
            {
                name: "Image ref coords (coord type)",
                value: "[18:20:21.0000, -016.12.10.0000]" },
            { name: "Celestial frame", value: "ICRS" },
            { name: "Spectral frame", value: "LSRK" },
            { name: "Pixel unit", value: "Jy/beam" },
            { name: "Pixel increment", value: "-0.40\", 0.40\"" },
            { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } ],
        headerEntries: [
            { name: "NAXIS", value: "4" },
            { name: "NAXIS1", value: "640" },
            { name: "NAXIS2", value: "800" },
            { name: "NAXIS3", value: "25" },
            { name: "NAXIS4", value: "1" },
            { name: "BMAJ", value: "5.725136068132E-04" },
            { name: "BMIN", value: "4.142385721207E-04" },
            { name: "BPA", value: "-7.462673187256E+01" },
            { name: "BUNIT", value: "Jy/beam" },
            { name: "LONPOLE", value: "1.800000000000E+02" },
            { name: "LATPOLE", value: "-1.620277777779E+01" },
            { name: "CTYPE3", value: "FREQ" },
            { name: "CRVAL3", value: "8.675139618840E+10" },
            { name: "CDELT3", value: "-2.442377011414E+05" },
            { name: "CRPIX3", value: "1.000000000000E+00" },
            { name: "CUNIT3", value: "Hz" },
            { name: "CTYPE4", value: "STOKES" },
            { name: "CRVAL4", value: "1.000000000000E+00" },
            { name: "CDELT4", value: "1.000000000000E+00" },
            { name: "CRPIX4", value: "1.000000000000E+00" },
            { name: "CUNIT4" },
            { name: "RESTFRQ", value: "8.675429000000E+10" },,
            { name: "VELREF", value: "257" },
        ], 
    },
    {
        fileName: "M17_SWex.miriad", 
        hdu: "", HDUList: [""], 
        fileSize: 52993642, 
        fileType: CARTA.FileType.MIRIAD, 
        shape: [640, 800, 25, 1], NAXIS: 4, 
        computerEntries: [ 
            { name: "Name", value: "M17_SWex.miriad" },
            { name: "Shape", value: "[640, 800, 25, 1]" },
            {
                name: "Number of channels",
                value: "25",
                entryType: 2,
                numericValue: 25 },
            {
                name: "Number of Stokes",
                value: "1",
                entryType: 2,
                numericValue: 1 },
            { name: "Coordinate type", value: "RA---SIN, DEC--SIN" },
            { name: "Image reference pixels", value: "[321, 401]" },
            {
                name: "Image reference coordinates",
                value: "[275.088 deg, -16.203 deg]" },
            {
                name: "Image ref coords (coord type)",
                value: "[18:20:21.0000 -016.12.10.0000]" },
            { name: "Celestial frame", value: "FK5, J2000" },
            { name: "Spectral frame", value: "BARYCENT" },
            { name: "Pixel unit", value: "Jy/beam" },
            { name: "Pixel increment", value: "-0.40\", 0.40\"" },
            { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } ],
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
                numericValue: 0.0005725135932445429 },
            {
                name: "BMIN",
                value: "0.000414239",
                entryType: 1,
                numericValue: 0.00041423858135383447 },
            {
                name: "BPA",
                value: "-74.6267",
                entryType: 1,
                numericValue: -74.6267318725586 },
            { name: "BUNIT", value: "Jy/beam" },
            { name: "CTYPE3", value: "Frequency" },
            {
                name: "CRVAL3",
                value: "8.67514e+10",
                entryType: 1,
                numericValue: 86751396188.40004 },
            {
                name: "CDELT3",
                value: "-244238",
                entryType: 1,
                numericValue: -244237.7011414 },
            { name: "CRPIX3", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT3", value: "Hz" },
            { name: "CTYPE4", value: "Stokes" },
            { name: "CRVAL4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CDELT4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CRPIX4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT4" },
            {
                name: "RESTFRQ",
                value: "8.67543e+10 Hz\n",
                entryType: 1,
                numericValue: 86754290000.00003 },
        ], 
    },
    {
        fileName: "spire500_ext.fits", 
        hdu: "0", HDUList: ["0", "1", "2", "3", "4", "5", "6", "7"], 
        fileSize: 17591040, 
        fileType: CARTA.FileType.FITS, 
        shape: [830, 870, 1, 1], NAXIS: 2, 
        computerEntries: [ 
            { name: "Name", value: "spire500_ext.fits" },
            { name: "Shape", value: "[830, 870]" },
            { name: "Coordinate type", value: "RA---TAN, DEC--TAN" },
            { name: "Image reference pixels", value: "[861, 976] " },
            {
                name: "Image reference coordinates",
                value: "[107.3046 , -10.6107 ]" },
            {
                name: "Image ref coords (coord type)",
                value: "[107.305 , -10.6107 ]" },
            { name: "Celestial frame", value: "ICRS, 2000" },
            { name: "Pixel increment", value: "-0.002 , 0.002 " } ],
        headerEntries: [ 
            { name: "NAXIS", value: "2", entryType: 2, numericValue: 2 },
            { name: "NAXIS1", value: "830", entryType: 2, numericValue: 830 },
            { name: "NAXIS2", value: "870", entryType: 2, numericValue: 870 },
            { name: "CRPIX1", value: "861", entryType: 1, numericValue: 861 },
            { name: "CRPIX2", value: "976", entryType: 1, numericValue: 976 },
            {
                name: "CDELT1",
                value: "-0.00166667",
                entryType: 1,
                numericValue: -0.001666666666667 },
            {
                name: "CDELT2",
                value: "0.00166667",
                entryType: 1,
                numericValue: 0.001666666666667 },
            { name: "CTYPE1", value: "RA---TAN" },
            { name: "CTYPE2", value: "DEC--TAN" },
            {
                name: "EQUINOX",
                value: "2000",
                entryType: 1,
                numericValue: 2000 },
            { name: "CROTA2", value: "0", entryType: 1 },
            {
                name: "CRVAL1",
                value: "107.305",
                entryType: 1,
                numericValue: 107.30461727023817 },
            {
                name: "CRVAL2",
                value: "-10.6107",
                entryType: 1,
                numericValue: -10.610720896516849 },
            { name: "RADESYS", value: "ICRS" },
        ], 
    },

];

describe("FILEINFO test: Testing if info of an image file is correctly delivered by the backend", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "",
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectoryName}" folder`, 
    () => {
        beforeAll( async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: testSubdirectoryName,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        resolve();
                    }
                );                
            });
        }, listFileTimeout);
        
        imageAssertItems.map( function(item: ImageAssertItem) {

            describe(`query the info of file : ${item.fileName}`, () => {
                let FileInfoResponseTemp: CARTA.FileInfoResponse;
                test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                    await Utility.setEvent(Connection, CARTA.FileInfoRequest, 
                        {
                            directory: testSubdirectoryName, 
                            file: item.fileName, 
                            hdu: item.hdu,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.FileInfoResponse, 
                            (FileInfoResponse: CARTA.FileInfoResponse) => {
                                FileInfoResponseTemp = FileInfoResponse;
                                resolve();
                            }
                        );                
                    });                                                 
                }, openFileTimeout);

                test("FILE_INFO_RESPONSE.success = true", () => {
                    expect(FileInfoResponseTemp.success).toBe(true);
                });

                test(`FILE_INFO_RESPONSE.file_info.HDU_List = [${item.HDUList}]`, () => {
                    expect(FileInfoResponseTemp.fileInfo.HDUList).toEqual(item.HDUList);
                });

                test(`FILE_INFO_RESPONSE.file_info.name = "${item.fileName}"`, () => {
                    expect(FileInfoResponseTemp.fileInfo.name).toBe(item.fileName);
                });

                test(`FILE_INFO_RESPONSE.file_info.size = ${item.fileSize}`, () => {
                    expect(FileInfoResponseTemp.fileInfo.size.toString()).toEqual(item.fileSize.toString());
                });

                test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType[item.fileType]}`, () => {
                    expect(FileInfoResponseTemp.fileInfo.type).toBe(item.fileType);
                });

                test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${item.NAXIS}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.dimensions).toEqual(item.NAXIS);
                });

                test(`FILE_INFO_RESPONSE.file_info_extended.width = ${item.shape[0]}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.width).toEqual(item.shape[0]);
                });

                test(`FILE_INFO_RESPONSE.file_info_extended.height = ${item.shape[1]}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.height).toEqual(item.shape[1]);
                });

                if (item.NAXIS > 2) {
                    test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${item.shape[2]}`, () => {
                        expect(FileInfoResponseTemp.fileInfoExtended.depth).toEqual(item.shape[2]);
                    });
                }

                if (item.NAXIS > 3) {
                    test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${item.shape[3]}`, () => {
                        expect(FileInfoResponseTemp.fileInfoExtended.stokes).toEqual(item.shape[3]);
                    });
                }

                test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = [""]`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.stokesVals).toEqual([""]);
                });

                test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                    // console.log(FileInfoResponseTemp.fileInfoExtended.computedEntries);
                    item.computerEntries.map( (entry) => {
                        expect(FileInfoResponseTemp.fileInfoExtended.computedEntries).toContainEqual(entry);
                    });
                });
                
                test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                    // console.log(FileInfoResponseTemp.fileInfoExtended.headerEntries);
                    item.headerEntries.map( (entry) => {
                        expect(FileInfoResponseTemp.fileInfoExtended.headerEntries).toContainEqual(entry);
                    });
                });

            }); // describe
        }); // map

    });

    afterAll( () => {
        Connection.close();
    });
});

describe("FILEINFO_EXCEPTIONS test: Testing error handle of file info generation", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "",
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectoryName}" folder`, 
    () => {
        beforeAll( async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: testSubdirectoryName,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        resolve();
                    }
                );                
            });
        }, listFileTimeout);
        
        [
            ["no_such_file.image"],
            ["broken_header.miriad"],
        ].map( function([fileName]: [string]) {

            describe(`query the info of file : ${fileName}`, () => {
                let FileInfoResponseTemp: CARTA.FileInfoResponse;
                test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                    await Utility.setEvent(Connection, CARTA.FileInfoRequest, 
                        {
                            directory: testSubdirectoryName, 
                            file: fileName, 
                            hdu: "",
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.FileInfoResponse, 
                            (FileInfoResponse: CARTA.FileInfoResponse) => {
                                FileInfoResponseTemp = FileInfoResponse;
                                resolve();
                            }
                        );                
                    });                                                 
                }, openFileTimeout);

                test("FILE_INFO_RESPONSE.success = false", () => {
                    expect(FileInfoResponseTemp.success).toBe(false);
                });

                test("FILE_INFO_RESPONSE.message is not None", () => {
                    expect(FileInfoResponseTemp.message).toBeDefined();
                    expect(FileInfoResponseTemp.message).not.toBe("");
                    console.log(`Error message from reading "${fileName}": ${FileInfoResponseTemp.message}`);
                });
            }); // describe

        }); // map
    });

    afterAll( () => {
        Connection.close();
    });
});
