import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;
interface AssertItem {
    fileName: string;
    hdu: string;
    fileId: number;
    renderMode: CARTA.RenderMode;
    imageBounds: {xMin: number, xMax: number, yMin: number, yMax: number};
    mip: number;
    compressionType: CARTA.CompressionType;
    compressionQuality: number;
    numSubsets: number;
    regionId: number;
    spatialProfiles: string[];
    assertProfile: {
        point: {x: number, y: number}, 
        assertPoint: {x: number, y: number}, 
        profileLen: {x: number, y: number}, 
        value: number, 
        oddPoint: {
            x: {idx: number, value: number, others: number}, 
            y: {idx: number, value: number, others: number},
        }
    }[];
    errorPoint: {point: {x: number, y: number}}[];
}
let assertItem: AssertItem = {
    fileName: "qa_xyProfiler.fits",
    hdu: "0",
    fileId: 0,
    renderMode: CARTA.RenderMode.RASTER,
    imageBounds: {xMin: 0, xMax: 100, yMin: 0, yMax: 100},
    mip: 1,
    compressionType: CARTA.CompressionType.ZFP,
    compressionQuality: 21,
    numSubsets: 4,
    regionId: 0,
    spatialProfiles: ["x", "y"],
    assertProfile: [
        {point: {x: 50.00, y: 50.00}, assertPoint: {x: 50.00, y: 50.00}, profileLen: {x: 100, y: 100}, value: 1, oddPoint: {x: {idx: 50, value: 1, others: 0}, y: {idx: 50, value: 1, others: 0}}},
        {point: {x: 49.50, y: 49.50}, assertPoint: {x: 50.00, y: 50.00}, profileLen: {x: 100, y: 100}, value: 1, oddPoint: {x: {idx: 50, value: 1, others: 0}, y: {idx: 50, value: 1, others: 0}}},
        {point: {x: 49.50, y: 50.49}, assertPoint: {x: 50.00, y: 50.00}, profileLen: {x: 100, y: 100}, value: 1, oddPoint: {x: {idx: 50, value: 1, others: 0}, y: {idx: 50, value: 1, others: 0}}},
        {point: {x: 50.49, y: 49.50}, assertPoint: {x: 50.00, y: 50.00}, profileLen: {x: 100, y: 100}, value: 1, oddPoint: {x: {idx: 50, value: 1, others: 0}, y: {idx: 50, value: 1, others: 0}}},
        {point: {x: 50.49, y: 50.49}, assertPoint: {x: 50.00, y: 50.00}, profileLen: {x: 100, y: 100}, value: 1, oddPoint: {x: {idx: 50, value: 1, others: 0}, y: {idx: 50, value: 1, others: 0}}},
        {point: {x:  0.00, y:  0.00}, assertPoint: {x:  0.00, y:  0.00}, profileLen: {x: 100, y: 100}, value: 1, oddPoint: {x: {idx:  0, value: 1, others: 0}, y: {idx:  0, value: 1, others: 0}}},
        {point: {x:  0.00, y: 99.00}, assertPoint: {x:  0.00, y: 99.00}, profileLen: {x: 100, y: 100}, value: 0, oddPoint: {x: {idx: 99, value: 1, others: 0}, y: {idx:  0, value: 1, others: 0}}},
        {point: {x: 99.00, y:  0.00}, assertPoint: {x: 99.00, y:  0.00}, profileLen: {x: 100, y: 100}, value: 0, oddPoint: {x: {idx:  0, value: 1, others: 0}, y: {idx: 99, value: 1, others: 0}}},
        {point: {x: 99.00, y: 99.00}, assertPoint: {x: 99.00, y: 99.00}, profileLen: {x: 100, y: 100}, value: 1, oddPoint: {x: {idx: 99, value: 1, others: 0}, y: {idx: 99, value: 1, others: 0}}},
    ],
    errorPoint: [
        {point: {x: 200.00, y: 200.00}},
    ],
}

describe("CURSOR_SPATIAL_PROFILE test: Testing if full resolution cursor spatial profiles are delivered correctly", () => {   
    let Connection: WebSocket;    

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: ""
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
            await done();
        }
    }, connectTimeout);

    describe(`read the file "${assertItem.fileName}" on folder "${testSubdirectoryName}"`, () => {
        beforeAll( async () => {
            await Utility.setEvent(Connection, CARTA.CloseFile, 
                {
                    fileId: -1,
                }
            );
            await Utility.setEvent(Connection, CARTA.OpenFile, 
                {
                    directory: testSubdirectoryName, 
                    file: assertItem.fileName, 
                    hdu: assertItem.hdu, 
                    fileId: assertItem.fileId, 
                    renderMode: assertItem.renderMode,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.OpenFileAck, 
                    OpenFileAck => {
                        expect(OpenFileAck.success).toBe(true);
                        resolve();
                    }
                );                
            });
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            await Utility.setEventAsync(Connection, CARTA.SetImageChannels, 
                {
                    fileId: assertItem.fileId,
                    channel: 0,
                    requiredTiles: {
                        fileId: assertItem.fileId,
                        tiles: [0],
                        compressionType: CARTA.CompressionType.NONE,
                    },
                },
            );
            await Utility.setEvent(Connection, CARTA.SetSpatialRequirements, 
                {
                    fileId: assertItem.fileId, 
                    regionId: assertItem.regionId, 
                    spatialProfiles: assertItem.spatialProfiles,
                }
            );
            await Utility.getEventAsync(Connection, CARTA.RasterTileData);
        }, readFileTimeout);     
        
        assertItem.assertProfile.map( function(item) {
            describe(`set cursor on {${item.point.x}, ${item.point.y}}`, () => {
                    let SpatialProfileDataTemp: CARTA.SpatialProfileData;
                    test(`SPATIAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                        await Utility.setEvent(Connection, CARTA.SetCursor, 
                            {
                                fileId: assertItem.fileId, 
                                point: item.point,
                            }
                        );
                        await new Promise( resolve => {                        
                            Utility.getEvent(Connection, CARTA.SpatialProfileData, 
                                (SpatialProfileData: CARTA.SpatialProfileData) => {
                                    SpatialProfileDataTemp = SpatialProfileData;
                                    resolve();
                                }
                            );
                        });
                    }, cursorTimeout);

                    test(`SPATIAL_PROFILE_DATA.value = ${item.value}`, () => {
                        expect(SpatialProfileDataTemp.value).toEqual(item.value);
                    });

                    test(`SPATIAL_PROFILE_DATA.x = ${item.assertPoint.x} and SPATIAL_PROFILE_DATA.y = ${item.assertPoint.y}`, () => {
                        expect(SpatialProfileDataTemp.x).toEqual(item.assertPoint.x);
                        expect(SpatialProfileDataTemp.y).toEqual(item.assertPoint.y);
                    });

                    test(`Length of profile_x = ${item.profileLen.x} and length of profile_y = ${item.profileLen.y}`, () => {
                        expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.length).toEqual(item.profileLen.x);
                        expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values.length).toEqual(item.profileLen.y);
                    });

                    test(`The #${item.oddPoint.x.idx + 1} value = ${item.oddPoint.x.value} and other values = ${item.oddPoint.x.others} on the profile_x`, () => {
                        SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.map( (value, index) => {
                            if (index === item.oddPoint.x.idx) {
                                expect(value).toEqual(item.oddPoint.x.value);
                            } else {
                                expect(value).toEqual(item.oddPoint.x.others);
                            }                            
                        });
                    });

                    test(`The #${item.oddPoint.y.idx + 1} value = ${item.oddPoint.y.value} and other values = ${item.oddPoint.y.others} on the profile_y`, () => {
                        SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values.map( (value, index) => {
                            if (index === item.oddPoint.y.idx) {
                                expect(value).toEqual(item.oddPoint.y.value);
                            } else {
                                expect(value).toEqual(item.oddPoint.y.others);
                            }                            
                        });
                    });

            });
        });

        assertItem.errorPoint.map( function(item) {
            describe(`set cursor on {${item.point.x}, ${item.point.y}}`, () => {
                test(`SPATIAL_PROFILE_DATA should not arrive within ${cursorTimeout} ms`, async () => {
                    await Utility.setEvent(Connection, CARTA.SetCursor, 
                        {
                            fileId: assertItem.fileId, 
                            point: item.point,
                        }
                    );
                    await new Promise( (resolve, reject) => {                        
                        Utility.getEvent(Connection, CARTA.SpatialProfileData, 
                            (SpatialProfileData: CARTA.SpatialProfileData) => {
                                reject();
                            }
                        );
                        let failTimer = setTimeout(() => {
                            clearTimeout(failTimer);
                            resolve();
                        }, cursorTimeout);
                    });
                }, cursorTimeout + connectTimeout);

                test("Backend is not crashed", () => {
                    expect(Connection.readyState).toBe(WebSocket.OPEN);
                });
                
            });
        });

    });

    afterAll( () => {
        Connection.close();
    });
});