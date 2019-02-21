/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let expectRootPath = config.path.root;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

describe("FILEINFO test: Testing if info of a image file is correctly delivered by the backend", () => {   
    let Connection: WebSocket;

    beforeEach( done => {
        // Establish a websocket connection in the binary form: arraybuffer 
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        // While open a Websocket
        Connection.onopen = () => {
            // Checkout if Websocket server is ready
            if (Connection.readyState === WebSocket.OPEN) {
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(true);
                        done();
                    }
                );
                Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234"
                    }
                );
            } else {
                console.log(`Can not open a connection. @${new Date()}`);
            }
            done();
        };
    }, connectionTimeout);
    
    describe(`access directory`, () => {
        [[expectRootPath], [testSubdirectoryName], ["$BASE"]
        ].map(
            ([dir]) => {
                test(`assert the directory "${dir}" opens.`, 
                done => {                    
                    Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                        (FileListResponse: CARTA.FileListResponse) => {
                            expect(FileListResponse.success).toBe(true);
                            done();
                        }
                    );
                    Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                        {
                            directory: dir
                        }
                    );
                }, connectionTimeout);
            }
        );
    });

    describe(`access the folder ${testSubdirectoryName} and ...`, 
    () => {
        beforeEach( 
            done => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.success).toBe(true);
                        done();
                    }
                );
                Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                    {
                        directory: testSubdirectoryName
                    }
                );
            }, connectionTimeout);           
        
        describe(`test an existent file`, () => {
            [
             ["S255_IR_sci.spw25.cube.I.pbcor.fits",    "0",    7048405440,     CARTA.FileType.FITS,    [1920, 1920, 478, 1],   4],
             ["SDC335.579-0.292.spw0.line.image",        "",    1864975311,     CARTA.FileType.CASA,    [336, 350, 3840, 1],    4],
             ["G34mm1_lsb_all.uv.part1.line.natwt.sml",  "",      34521240,   CARTA.FileType.MIRIAD,    [129, 129, 512, 1],     4],
             ["orion_12co_hera.hdf5",                   "0",     118888712,     CARTA.FileType.HDF5,    [688, 575, 35],         3],
             ["spire500_ext.fits",                      "1",      17591040,     CARTA.FileType.FITS,    [830, 870],             2],
            ].map(
                function([fileName, hdu,    fileSize,   fileType,       shape,      NAXIS]: 
                         [string,   string, number,     CARTA.FileType, number[],   number]) {
                    test(`assert the ${CARTA.FileType[fileType]} file "${fileName}".`, 
                    done => {
                        Utility.getEvent(Connection, "FILE_INFO_RESPONSE", CARTA.FileInfoResponse, 
                            (FileInfoResponse: CARTA.FileInfoResponse) => {
                                expect(FileInfoResponse.success).toBe(true);
                                expect(FileInfoResponse.fileInfo.HDUList.find( f => f === hdu)).toEqual(hdu);
                                expect(FileInfoResponse.fileInfo.name).toBe(fileName);
                                expect(FileInfoResponse.fileInfo.size.toString()).toEqual(fileSize.toString());
                                expect(FileInfoResponse.fileInfo.type).toBe(fileType);

                                expect(FileInfoResponse.fileInfoExtended.dimensions).toEqual(NAXIS);
                                expect(FileInfoResponse.fileInfoExtended.width).toEqual(shape[0]);
                                expect(FileInfoResponse.fileInfoExtended.height).toEqual(shape[1]);
                                if (NAXIS > 2) {
                                    expect(FileInfoResponse.fileInfoExtended.depth).toEqual(shape[2]);
                                }
                                if (NAXIS > 3) {
                                    expect(FileInfoResponse.fileInfoExtended.stokes).toEqual(shape[3]);
                                }
                                expect(FileInfoResponse.fileInfoExtended.stokesVals[0]).toEqual("");
                                
                                const fileInfoExtComputedShape = 
                                    FileInfoResponse.fileInfoExtended.computedEntries.find( f => f.name === "Shape").value;
                                expect(
                                    fileInfoExtComputedShape.replace("[", "").replace("]", "").split(",").map(Number)
                                    ).toEqual(shape);

                                const fileInfoExtHeaderNAXIS = 
                                    FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS").value;
                                expect(parseInt(fileInfoExtHeaderNAXIS)).toEqual(NAXIS);
                                const fileInfoExtHeaderNAXIS1 = 
                                    FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS1").value;
                                expect(parseInt(fileInfoExtHeaderNAXIS1)).toEqual(shape[0]);
                                const fileInfoExtHeaderNAXIS2 = 
                                    FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS2").value;
                                expect(parseInt(fileInfoExtHeaderNAXIS2)).toEqual(shape[1]);
                                if (NAXIS > 2) {
                                    const fileInfoExtHeaderNAXIS3 = 
                                        FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS3").value;
                                    expect(parseInt(fileInfoExtHeaderNAXIS3)).toEqual(shape[2]);
                                }
                                if (NAXIS > 3) {
                                const fileInfoExtHeaderNAXIS4 = 
                                    FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS4").value;
                                expect(parseInt(fileInfoExtHeaderNAXIS4)).toEqual(shape[3]);
                                }
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "FILE_INFO_REQUEST", CARTA.FileInfoRequest, 
                            {
                                directory: testSubdirectoryName, 
                                file: fileName, 
                                hdu
                            }
                        );
                                                 
                    } // done
                    , connectionTimeout); // test
                } // function([ ])
            ); // map
        }); // describe

    });

    afterEach( done => {
        Connection.close();
        done();
    });
});

describe("FILEINFO_EXCEPTIONS test: Testing error handle of file info generation", () => {   
    let Connection: WebSocket;

    beforeEach( done => {
        // Establish a websocket connection in the binary form: arraybuffer 
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        // While open a Websocket
        Connection.onopen = () => {
            // Checkout if Websocket server is ready
            if (Connection.readyState === WebSocket.OPEN) {
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(true);
                        done();
                    }
                );
                Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234"
                    }
                );
            } else {
                console.log(`Can not open a connection. @${new Date()}`);
            }
            done();
        };
    }, connectionTimeout);

    describe(`access the folder "${testSubdirectoryName}" and ...`, 
    () => {    
        beforeEach( 
            done => {
                Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.success).toBe(true);
                        done();
                    }
                );
                Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                    {
                        directory: testSubdirectoryName
                    }
                );
            }, connectionTimeout);           
        
        describe(`test an non-existent file`, () => {
            [
                ["no_such_file.image"],
                ["broken_header.miriad"],
            ].map(
                function([fileName]: [string]) {
                    test(`assert the file "${fileName}" is non-existent.`, 
                    done => {                        
                        Utility.getEvent(Connection, "FILE_INFO_RESPONSE", CARTA.FileInfoResponse, 
                            (FileInfoResponse: CARTA.FileInfoResponse) => {
                                expect(FileInfoResponse.success).toBe(false);
                                expect(FileInfoResponse.message).toBeDefined();
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "FILE_INFO_REQUEST", CARTA.FileInfoRequest, 
                            {
                                directory: testSubdirectoryName, 
                                file: fileName, 
                                hdu: ""
                            }
                        );                      
                    } // done
                    , connectionTimeout); // test
                } // function([ ])
            ); // map
        }); // describe

    });

    afterEach( done => {
        Connection.close();
        done();
    }, connectionTimeout);
});
