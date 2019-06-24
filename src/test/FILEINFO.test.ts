import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileInfoGroup: CARTA.IFileInfoRequest[];
    fileInfoResGroup: CARTA.IFileInfoResponse[];
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
    },
    filelist: {directory: testSubdirectory},
    fileInfoGroup: [
        {
            directory: testSubdirectory,
            file: "M17_SWex.fits",
            hdu: "0",
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            hdu: "",
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            hdu: "0",
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.miriad",
            hdu: "",
        },
        {
            directory: testSubdirectory,
            file: "spire500_ext.fits",
            hdu: "0",
        },
    ],
    fileInfoResGroup: [
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
                stokesVals: [""],
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
                computedEntries: [ 
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
            },
        },
        {
            success: true,
            message: "",
            fileInfo: {
                name: "M17_SWex.image",
                type: CARTA.FileType.CASA,
                size: 53009869,
                HDUList: [""],
            },
            fileInfoExtended: {
                dimensions: 4,
                width: 640,
                height: 800,
                depth: 25,
                stokes: 1,
                stokesVals: [""],
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
                computedEntries: [ 
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
                    { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } 
                ],
            },
        },
        {
            success: true,
            message: "",
            fileInfo: {
                name: "M17_SWex.hdf5",
                type: CARTA.FileType.HDF5,
                size: 112823720,
                HDUList: ["0"],
            },
            fileInfoExtended: {
                dimensions: 4,
                width: 640,
                height: 800,
                depth: 25,
                stokes: 1,
                stokesVals: [""],
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
                computedEntries: [ 
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
                    { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } 
                ],
            },
        },
        {
            success: true,
            message: "",
            fileInfo: {
                name: "M17_SWex.miriad",
                type: CARTA.FileType.MIRIAD,
                size: 52993642,
                HDUList: [""],
            },
            fileInfoExtended: {
                dimensions: 4,
                width: 640,
                height: 800,
                depth: 25,
                stokes: 1,
                stokesVals: [""],
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
                        numericValue: 86754290000.00003 
                    },
                ],
                computedEntries: [ 
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
                    { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } 
                ],
            },
        },
        {
            success: true,
            message: "",
            fileInfo: {
                name: "spire500_ext.fits",
                type: CARTA.FileType.FITS,
                size: 17591040,
                HDUList: ["1 ExtName: image", "6 ExtName: error", "7 ExtName: coverage"],
            },
            fileInfoExtended: {
                dimensions: 2,
                width: 830,
                height: 870,
                depth: 1,
                stokes: 1,
                stokesVals: [""],
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
                computedEntries: [ 
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
                    { name: "Pixel increment", value: "-0.002 , 0.002 " }
                ],
            },
        },
    ],
}

describe("FILEINFO test: Testing if info of an image file is correctly delivered by the backend", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, 
    () => {
        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.FileListRequest, assertItem.filelist);
            await Utility.getEventAsync(Connection, CARTA.FileListResponse);
        }, listFileTimeout);
        
        assertItem.fileInfoResGroup.map( (fileInfoRes: CARTA.IFileInfoResponse, index: number) => {
            describe(`query the info of file : ${assertItem.fileInfoGroup[index].file}`, () => {
                let FileInfoResponseTemp: CARTA.FileInfoResponse;
                test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.FileInfoRequest, assertItem.fileInfoGroup[index]);
                    await Utility.getEventAsync(Connection, CARTA.FileInfoResponse,  
                        (FileInfoResponse: CARTA.FileInfoResponse, resolve) => {
                            FileInfoResponseTemp = FileInfoResponse;
                            resolve();
                        });                                         
                }, openFileTimeout);

                test("FILE_INFO_RESPONSE.success = true", () => {
                    expect(FileInfoResponseTemp.success).toBe(true);
                });

                test(`FILE_INFO_RESPONSE.file_info.HDU_List = [${fileInfoRes.fileInfo.HDUList}]`, () => {
                    expect(FileInfoResponseTemp.fileInfo.HDUList.map(f => f = f.trim())).toEqual(fileInfoRes.fileInfo.HDUList.map(f => f = f.trim()));
                });

                test(`FILE_INFO_RESPONSE.file_info.name = "${fileInfoRes.fileInfo.name}"`, () => {
                    expect(FileInfoResponseTemp.fileInfo.name).toEqual(fileInfoRes.fileInfo.name);
                });

                test(`FILE_INFO_RESPONSE.file_info.size = ${fileInfoRes.fileInfo.size}`, () => {
                    expect(FileInfoResponseTemp.fileInfo.size.toString()).toEqual(fileInfoRes.fileInfo.size.toString());
                });

                test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType[fileInfoRes.fileInfo.type]}`, () => {
                    expect(FileInfoResponseTemp.fileInfo.type).toBe(fileInfoRes.fileInfo.type);
                });

                test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${fileInfoRes.fileInfoExtended.dimensions}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.dimensions).toEqual(fileInfoRes.fileInfoExtended.dimensions);
                });

                test(`FILE_INFO_RESPONSE.file_info_extended.width = ${fileInfoRes.fileInfoExtended.width}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.width).toEqual(fileInfoRes.fileInfoExtended.width);
                });

                test(`FILE_INFO_RESPONSE.file_info_extended.height = ${fileInfoRes.fileInfoExtended.height}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.height).toEqual(fileInfoRes.fileInfoExtended.height);
                });

                if (fileInfoRes.fileInfoExtended.dimensions > 2) {
                    test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${fileInfoRes.fileInfoExtended.depth}`, () => {
                        expect(FileInfoResponseTemp.fileInfoExtended.depth).toEqual(fileInfoRes.fileInfoExtended.depth);
                    });
                }

                if (fileInfoRes.fileInfoExtended.dimensions > 3) {
                    test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${fileInfoRes.fileInfoExtended.stokes}`, () => {
                        expect(FileInfoResponseTemp.fileInfoExtended.stokes).toEqual(fileInfoRes.fileInfoExtended.stokes);
                    });
                }

                test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = ${fileInfoRes.fileInfoExtended.stokesVals}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.stokesVals).toEqual(fileInfoRes.fileInfoExtended.stokesVals);
                });

                test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                    fileInfoRes.fileInfoExtended.computedEntries.map( (entry: CARTA.IHeaderEntry) => {
                        expect(FileInfoResponseTemp.fileInfoExtended.computedEntries).toContainEqual(entry);
                    });
                });
                
                test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                    fileInfoRes.fileInfoExtended.headerEntries.map( (entry: CARTA.IHeaderEntry) => {
                        expect(FileInfoResponseTemp.fileInfoExtended.headerEntries).toContainEqual(entry);
                    });
                });

            }); 
        });

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
            await Utility.setEventAsync(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "",
                }
            );
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.FileListRequest, 
                {
                    directory: testSubdirectory,
                }
            );
            await Utility.getEventAsync(Connection, CARTA.FileListResponse);
        }, listFileTimeout);
        
        [ "no_such_file.image", "broken_header.miriad"].map( (fileName: string) => {
            describe(`query the info of file : ${fileName}`, () => {
                let FileInfoResponseTemp: CARTA.FileInfoResponse;
                test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                    await Utility.setEvent(Connection, CARTA.FileInfoRequest, 
                        {
                            directory: testSubdirectory, 
                            file: fileName, 
                            hdu: "",
                        }
                    );
                    await Utility.getEventAsync(Connection, CARTA.FileInfoResponse,  
                        (FileInfoResponse: CARTA.FileInfoResponse, resolve) => {
                            FileInfoResponseTemp = FileInfoResponse;
                            resolve();
                        }
                    );                                         
                }, openFileTimeout);

                test("FILE_INFO_RESPONSE.success = false", () => {
                    expect(FileInfoResponseTemp.success).toBe(false);
                });

                test("FILE_INFO_RESPONSE.message is not None", () => {
                    expect(FileInfoResponseTemp.message).toBeDefined();
                    expect(FileInfoResponseTemp.message).not.toBe("");
                    console.log(`Error message from reading "${fileName}": ${FileInfoResponseTemp.message}`);
                });
            });
        });
    });

    afterAll( () => {
        Connection.close();
    });
});
