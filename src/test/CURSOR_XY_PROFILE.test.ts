/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testFileName = "qa_xyProfiler.fits";

describe("CURSOR_XY_PROFILE tests", () => {   
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
                            imageBounds: {xMin: 0, xMax: 100, yMin: 0, yMax: 100}, 
                            mip: 1, 
                            compressionType: CARTA.CompressionType.ZFP, 
                            compressionQuality: 21, 
                            numSubsets: 4
                        }
                    );
                    Utility.setEvent(Connection, "SET_SPATIAL_REQUIREMENTS", CARTA.SetSpatialRequirements, 
                        {
                            fileId: 0, 
                            regionId: 0, 
                            spatialProfiles: ["x", "y"]
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
        
        describe(`test the xy profiles at certain cursor position`, () => {
            [
             [0, {x: 50.00, y: 50.00}, {x: 50.00, y: 50.00}, {x: 100, y: 100}, 1],
             [0, {x: 49.50, y: 49.50}, {x: 50.00, y: 50.00}, {x: 100, y: 100}, 1],
             [0, {x: 49.50, y: 50.49}, {x: 50.00, y: 50.00}, {x: 100, y: 100}, 1],
             [0, {x: 50.49, y: 49.50}, {x: 50.00, y: 50.00}, {x: 100, y: 100}, 1],
             [0, {x: 50.49, y: 50.49}, {x: 50.00, y: 50.00}, {x: 100, y: 100}, 1],
             [0, {x:  0.00, y:  0.00}, {x:  0.00, y:  0.00}, {x: 100, y: 100}, 1],
             [0, {x:  0.00, y: 99.00}, {x:  0.00, y: 99.00}, {x: 100, y: 100}, 0],
             [0, {x: 99.00, y:  0.00}, {x: 99.00, y:  0.00}, {x: 100, y: 100}, 0],
             [0, {x: 99.00, y: 99.00}, {x: 99.00, y: 99.00}, {x: 100, y: 100}, 1],
            ].map(
                function([fileId, point, assertPoint, profileLen, value]: 
                        [number, {x: number, y: number}, {x: number, y: number}, {x: number, y: number}, number]) {
                    
                    test(`assert the fileID "${fileId}" returns: Value=${value}, Profile length={${profileLen.x}, ${profileLen.y}}, Point={${assertPoint.x}, ${assertPoint.y}} as {${point.x}, ${point.y}}.`, 
                    done => {                        
                        Utility.getEvent(Connection, "SPATIAL_PROFILE_DATA", CARTA.SpatialProfileData, 
                            SpatialProfileData => {
                                expect(SpatialProfileData.fileId).toEqual(fileId);
                                expect(SpatialProfileData.value).toEqual(value);
                                expect(SpatialProfileData.x).toEqual(assertPoint.x);
                                expect(SpatialProfileData.y).toEqual(assertPoint.y);

                                let spatialProfileDataMessageProfileX = SpatialProfileData.profiles.find(f => f.coordinate === "x").values;
                                expect(spatialProfileDataMessageProfileX.length).toEqual(profileLen.x);
                                let spatialProfileDataMessageProfileY = SpatialProfileData.profiles.find(f => f.coordinate === "y").values;
                                expect(spatialProfileDataMessageProfileY.length).toEqual(profileLen.y);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
                            }
                        );
                    }, connectionTimeout); // test

                } // function([ ])
            ); // map
        }); // describe

        describe(`test the xy profiles at certain cursor position`, () => {
            [[0, {x: 50.00, y: 50.00}, {idx: 50, value: 1, others: 0}, {idx: 50, value: 1, others: 0}],
             [0, {x:  0.00, y:  0.00}, {idx:  0, value: 1, others: 0}, {idx:  0, value: 1, others: 0}],
             [0, {x:  0.00, y: 99.00}, {idx: 99, value: 1, others: 0}, {idx:  0, value: 1, others: 0}],
             [0, {x: 99.00, y:  0.00}, {idx:  0, value: 1, others: 0}, {idx: 99, value: 1, others: 0}],
             [0, {x: 99.00, y: 99.00}, {idx: 99, value: 1, others: 0}, {idx: 99, value: 1, others: 0}],
            ].map(
                function([fileId, point, oddPointX, oddPointY]: 
                        [number, {x: number, y: number}, {idx: number, value: number, others: number}, {idx: number, value: number, others: number}]) {
                    test(`assert the profile in fileID "${fileId}" has: 
                    the #${oddPointX.idx + 1} value = ${oddPointX.value} with other values = ${oddPointX.others} on the profile_x & 
                    the #${oddPointY.idx + 1} value = ${oddPointY.value} with other values = ${oddPointY.others} on the profile_y as point {${point.x}, ${point.y}}.`, 
                    done => {                        
                        Utility.getEvent(Connection, "SPATIAL_PROFILE_DATA", CARTA.SpatialProfileData, 
                            SpatialProfileData => {
                                // Assert profile x
                                SpatialProfileData.profiles.find(f => f.coordinate === "x").values.forEach( 
                                    (value, index) => {
                                        if (index === oddPointX.idx) {
                                            expect(value).toEqual(oddPointX.value);
                                        } else {
                                            expect(value).toEqual(oddPointX.others);
                                        }
                                    }
                                );

                                // Assert profile y
                                SpatialProfileData.profiles.find(f => f.coordinate === "y").values.forEach( 
                                    (value, index) => {
                                        if (index === oddPointY.idx) {
                                            expect(value).toEqual(oddPointY.value);
                                        } else {
                                            expect(value).toEqual(oddPointY.others);
                                        }
                                    }
                                );
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