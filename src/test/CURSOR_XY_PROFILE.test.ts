import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let expectBasePath = config.path.base;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;

let testFileName = "qa_xyProfiler.fits";
let baseDirectory: string;

describe("CURSOR_XY_PROFILE tests", () => {   
    let Connection: WebSocket;    

    beforeEach( done => {
        Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEvent(this, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            await Utility.setEvent(this, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                        FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        baseDirectory = FileListResponseBase.directory;
                        resolve();
                    }
                );                
            });
            done();
        }
    }, connectionTimeout);

    describe(`open the file "${testFileName}" to`, 
    () => {
        beforeEach( async () => {
            await Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0", 
                    fileId: 0, 
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                    OpenFileAck => {
                        expect(OpenFileAck.success).toBe(true);
                        resolve();
                    }
                );                
            });
            await Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                {
                    fileId: 0, 
                    imageBounds: {
                        xMin: 0, xMax: 100, 
                        yMin: 0, yMax: 100,
                    }, 
                    mip: 1, 
                    compressionType: CARTA.CompressionType.ZFP, 
                    compressionQuality: 21, 
                    numSubsets: 4
                }
            );
            await Utility.setEvent(Connection, "SET_SPATIAL_REQUIREMENTS", CARTA.SetSpatialRequirements, 
                {
                    fileId: 0, 
                    regionId: 0, 
                    spatialProfiles: ["x", "y"]
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                    RasterImageData => {
                        expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                        resolve();
                    }
                );                
            });
        }, connectionTimeout);     
        
        describe(`set cursor to test xy profiles`, () => {
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
                    async () => {
                        await Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
                            }
                        );
                        await new Promise( resolve => {                        
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
                                    resolve();
                                }
                            );
                        });
                    }, connectionTimeout); // test

                } // function([ ])
            ); // map
        }); // describe

        describe(`set cursor to test xy profiles`, () => {
            [
                [0, {x: 50.00, y: 50.00}, {idx: 50, value: 1, others: 0}, {idx: 50, value: 1, others: 0}],
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
                    async () => {
                        await Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
                            }
                        ); 
                        await new Promise( resolve => {                        
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
                                    resolve();
                                }
                            );
                        });             
                    }, connectionTimeout);

                } // function([ ])
            ); // map
        }); // describe

    });

    afterEach( () => {
        Connection.close();
    });
});