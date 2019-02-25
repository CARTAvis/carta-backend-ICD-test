/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testFileName = "S255_IR_sci.spw25.cube.I.pbcor.fits";

describe("CURSOR_Z_PROFILE tests", () => {   
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
                    RegisterViewerAck => {
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
                done();
            }            
        };
    }, connectionTimeout);

    describe(`open the file "${testFileName} and ...`, 
    () => {
        beforeEach( 
        done => {            
            Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                OpenFileAck => {
                    expect(OpenFileAck.success).toBe(true);
                    Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                        RasterImageData => {
                            expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                            done();
                        }
                    );
                    Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                        {
                            fileId: 0, 
                            imageBounds: {
                                xMin: 0, xMax: OpenFileAck.fileInfoExtended.width, 
                                yMin: 0, yMax: OpenFileAck.fileInfoExtended.height
                            }, 
                            mip: 6, 
                            compressionType: CARTA.CompressionType.ZFP, 
                            compressionQuality: 11, 
                            numSubsets: 4
                        }
                    );
                    Utility.setEvent(Connection, "SET_SPECTRAL_REQUIREMENTS", CARTA.SetSpectralRequirements, 
                        {
                            fileId: 0, 
                            regionId: 0, 
                            spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.None]}]
                        }
                    );
                }
            );
            Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                {
                    directory: testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0", fileId: 0, 
                    renderMode: CARTA.RenderMode.RASTER
                }
            );    
        }, connectionTimeout);       
        
        describe(`get the z profiles at a cursor position`, () => {
            [[0, {x: 989, y: 1274}, 0, 0, 1, "z", 478, {idx: 300, value: -2.301968207024e-03}],
            ].map(
                function([fileId, point, regionID, stokes, progress, coordinate, profileLen, assertPoint]: 
                        [number, {x: number, y: number}, number, number, number, string, number, {idx: number, value: number}]) {
                    
                    test(`assert the fileId "${fileId}" returns within ${connectionTimeout}ms, as point {${point.x}, ${point.y}}.`, 
                    done => {
                        Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
                            SpectralProfileData => {
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
                            }
                        );                      
                    } // done
                    , connectionTimeout); // test

                    test(`assert the fileId "${fileId}" returns: fileId = ${fileId}, as point {${point.x}, ${point.y}}.`, 
                    done => {
                        Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
                            SpectralProfileData => {
                                expect(SpectralProfileData.fileId).toEqual(fileId);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
                            }
                        );                              
                    } // done
                    , connectionTimeout); // test

                    test(`assert the fileId "${fileId}" returns: regionId = ${regionID},  as point {${point.x}, ${point.y}}.`, 
                    done => {                        
                        Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
                            SpectralProfileData => {
                                expect(SpectralProfileData.regionId).toEqual(regionID);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
                            }
                        );                             
                    } // done
                    , connectionTimeout); // test

                    test(`assert the fileId "${fileId}" returns: stokes = ${stokes}, as point {${point.x}, ${point.y}}.`, 
                    done => {
                        Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
                            SpectralProfileData => {
                                expect(SpectralProfileData.stokes).toEqual(stokes);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
                            }
                        );        
                    } // done
                    , connectionTimeout); // test

                    test(`assert the fileId "${fileId}" returns: progress = ${progress},  as point {${point.x}, ${point.y}}.`, 
                    done => {
                        Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
                            SpectralProfileData => {
                                expect(SpectralProfileData.progress).toEqual(progress);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
                            }
                        );               
                    } // done
                    , connectionTimeout); // test

                    test(`assert the fileId "${fileId}" returns: 
                        coordinate = "${coordinate}", length = "${profileLen}", 
                        vals[${assertPoint.idx}] = "${assertPoint.value}" as point {${point.x}, ${point.y}}.`, 
                    done => {                        
                        Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
                            SpectralProfileData => {
                                let spectralProfileDataMessageProfile = 
                                    SpectralProfileData.profiles.find(f => f.coordinate === coordinate).vals;
                                expect(spectralProfileDataMessageProfile.length).toEqual(profileLen);
                                expect(spectralProfileDataMessageProfile[assertPoint.idx]).toBeCloseTo(assertPoint.value, 8);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
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