import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
import { isNull } from "util";
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
            x: {one: {idx: number, value: number}[], others: number|null}, 
            y: {one: {idx: number, value: number}[], others: number|null},
        }
    }[];
    errorPoint: {point: {x: number, y: number}}[];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    fileName: "M17_SWex.fits",
    hdu: "0",
    fileId: 0,
    renderMode: CARTA.RenderMode.RASTER,
    imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 480},
    mip: 2,
    compressionType: CARTA.CompressionType.ZFP,
    compressionQuality: 11,
    numSubsets: 4,
    regionId: 0,
    spatialProfiles: ["x", "y"],
    assertProfile: [
        {
            point: {x: 314.00, y: 393.00}, 
            assertPoint: {x: 314.00, y: 393.00}, 
            profileLen: {x: 640, y: 800}, 
            value: -0.004026404581964016, 
            oddPoint: {
                x: {one: [{idx: 0, value: NaN}, {idx: 200, value: -0.0018224817467853427}], others: null}, 
                y: {one: [{idx: 799, value: NaN}, {idx: 400, value: 0.0019619895610958338}], others: null},
            }
        },
        {
            point: {x: 596.00, y: 292.00}, 
            assertPoint: {x: 596.00, y: 292.00}, 
            profileLen: {x: 640, y: 800}, 
            value: NaN, 
            oddPoint: {
                x: {one: [], others: NaN}, 
                y: {one: [], others: NaN},
            }
        },
    ],
    errorPoint: [],
    precisionDigits: 4,
}

describe("CURSOR_SPATIAL_PROFILE_NaN test: Testing if full resolution cursor spatial profiles with NaN data are delivered correctly", () => {   
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
                    clientFeatureFlags: 5,
                }
            );
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            await done();
        }
    }, connectTimeout);

    describe(`read the file "${assertItem.fileName}" on folder "${testSubdirectoryName}"`, () => {
        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, 
                {
                    directory: testSubdirectoryName, 
                    file: assertItem.fileName, 
                    hdu: assertItem.hdu, 
                    fileId: assertItem.fileId, 
                    renderMode: assertItem.renderMode,
                    tileSize: 256,
                }
            );
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            await Utility.setEventAsync(Connection, CARTA.SetImageChannels, 
                {
                    fileId: assertItem.fileId,
                    channel: 0,
                    stokes: 0,
                    requiredTiles: {
                        fileId: assertItem.fileId,
                        tiles: [0],
                        compressionType: CARTA.CompressionType.ZFP,
                        compressionQuality: 11,
                    },
                },
            );
            await Utility.setEventAsync(Connection, CARTA.SetSpatialRequirements, 
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
                    await Utility.setEventAsync(Connection, CARTA.SetCursor, 
                        {
                            fileId: assertItem.fileId, 
                            point: item.point,
                        }
                    );
                    SpatialProfileDataTemp = <CARTA.SpatialProfileData>await Utility.getEventAsync(Connection, CARTA.SpatialProfileData);
                }, cursorTimeout);

                test(`SPATIAL_PROFILE_DATA.value = ${item.value}`, () => {
                    if (isNaN(item.value)) {
                        expect(SpatialProfileDataTemp.value).toEqual(NaN);
                    } else {
                        expect(SpatialProfileDataTemp.value).toBeCloseTo(item.value, assertItem.precisionDigits);
                    }
                });

                test(`SPATIAL_PROFILE_DATA.x = ${item.assertPoint.x} and SPATIAL_PROFILE_DATA.y = ${item.assertPoint.y}`, () => {
                    expect(SpatialProfileDataTemp.x).toEqual(item.assertPoint.x);
                    expect(SpatialProfileDataTemp.y).toEqual(item.assertPoint.y);
                });

                test(`Assert value of profile_x : ${item.oddPoint.x.one.map( f => ` #${f.idx} = ${f.value.toPrecision(assertItem.precisionDigits)}`)} ${isNaN(item.oddPoint.x.others)?"other values = NaN":isNull(item.oddPoint.x.others)?"":"other values = " + item.oddPoint.x.others}`, () => {
                    item.oddPoint.x.one.map( f => {
                        if (isNaN(f.value)) {
                            expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values[f.idx]).toEqual(NaN);
                        } else {                            
                            expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values[f.idx]).toBeCloseTo(f.value, assertItem.precisionDigits);
                        }
                    });
                    if (item.oddPoint.x.others !== null) {
                        SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.map( (value, index) => {
                            if (item.oddPoint.x.one.findIndex(f => f.idx === index) !== -1) {
                                expect(value).toEqual(item.oddPoint.x.others);
                            }                          
                        });
                    }
                });

                test(`Assert value of profile_y : ${item.oddPoint.y.one.map( f => ` #${f.idx} = ${f.value.toPrecision(assertItem.precisionDigits)}`)} ${isNaN(item.oddPoint.x.others)?"other values = NaN":isNull(item.oddPoint.x.others)?"":"other values = " + item.oddPoint.x.others}`, () => {
                    item.oddPoint.y.one.map( f => {
                        if (isNaN(f.value)) {
                            expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values[f.idx]).toEqual(NaN);
                        } else {                            
                            expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values[f.idx]).toBeCloseTo(f.value, assertItem.precisionDigits);
                        }
                    });
                    if (item.oddPoint.y.others !== null) {
                        SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values.map( (value, index) => {
                            if (item.oddPoint.y.one.findIndex(f => f.idx === index) !== -1) {
                                expect(value).toEqual(item.oddPoint.y.others);
                            }                          
                        });
                    }
                });

            });
        });


    });

    afterAll( () => {
        Connection.close();
    });
});