import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;
interface ISpatialProfileDataExt extends CARTA.ISpatialProfileData {
    value?: number,
    profileLength?: { x: number, y: number },
    oddPoint?: {
        x: { one: { idx: number, value: number }, others?: number },
        y: { one: { idx: number, value: number }, others?: number },
    }
};
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    setCursor1: CARTA.ISetCursor[];
    setCursor2: CARTA.ISetCursor[];
    spatialProfileData: ISpatialProfileDataExt[];
    spatialProfileData2: ISpatialProfileDataExt[];
    errorPoint: CARTA.ISpatialProfileData[];
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        // file: "M17_SWex.fits",
        file: "qa_xyProfiler.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 51, y: 51 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x",mip:1}, {coordinate:"y",mip:1}],
    },
    setCursor1: [
        {
            fileId: 0,
            point: { x: 50.00, y: 50.00 },
        },
        {
            fileId: 0,
            point: { x: 49.50, y: 49.50 },
        },
        {
            fileId: 0,
            point: { x: 49.50, y: 50.49 },
        },
        {
            fileId: 0,
            point: { x: 50.49, y: 49.50 },
        },
        {
            fileId: 0,
            point: { x: 50.49, y: 50.49 },
        },
    ],
    setCursor2: [
        {
            fileId: 0,
            point: { x: 0.00, y: 0.00 },
        },
        {
            fileId: 0,
            point: { x: 0.00, y: 99.00 },
        },
        {
            fileId: 0,
            point: { x: 99.00, y: 0.00 },
        },
        {
            fileId: 0,
            point: { x: 99.00, y: 99.00 },
        },
    ],
    spatialProfileData: [
        {
            fileId: 0,
            regionId: 0,
            stokes: 0,
            x: 50.0,
            y: 50.0,
            profileLength: { x: 100, y: 100 },
            value: 1,
            oddPoint: {
                x: { one: { idx: 50, value: 1 }, others: 0 },
                y: { one: { idx: 50, value: 1 }, others: 0 },
            }
        },
    ],
    spatialProfileData2: [
        {
            fileId: 0,
            regionId: 0,
            stokes: 0,
            x: 0.0,
            y: 0.0,
            profileLength: { x: 100, y: 100 },
            value: 1,
            oddPoint: {
                x: { one: { idx: 0, value: 1 }, others: 0 },
                y: { one: { idx: 0, value: 1 }, others: 0 },
            }
        },
        {
            fileId: 0,
            regionId: 0,
            stokes: 0,
            x: 0.0,
            y: 99.0,
            profileLength: { x: 100, y: 100 },
            value: 0,
            oddPoint: {
                x: { one: { idx: 99, value: 1 }, others: 0 },
                y: { one: { idx: 0, value: 1 }, others: 0 },
            }
        },
        {
            fileId: 0,
            regionId: 0,
            stokes: 0,
            x: 99.0,
            y: 0.0,
            profileLength: { x: 100, y: 100 },
            value: 0,
            oddPoint: {
                x: { one: { idx: 0, value: 1 }, others: 0 },
                y: { one: { idx: 99, value: 1 }, others: 0 },
            }
        },
        {
            fileId: 0,
            regionId: 0,
            stokes: 0,
            x: 99.0,
            y: 99.0,
            profileLength: { x: 100, y: 100 },
            value: 1,
            oddPoint: {
                x: { one: { idx: 99, value: 1 }, others: 0 },
                y: { one: { idx: 99, value: 1 }, others: 0 },
            }
        },
    ],
    errorPoint:
        [
            {
                fileId: 0,
                x: 200.00,
                y: 200.00,
            },
        ],
};

describe("CURSOR_SPATIAL_PROFILE: if full resolution cursor spatial profiles are delivered correctly", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`read the file "${assertItem.openFile.file}" on folder "${testSubdirectory}"`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        });

        test(`OpenFileAck? | `, async () => {
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            await Connection.openFile(assertItem.openFile);
        }, openFileTimeout);

        test(`RasterTileData * 1 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)?`, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.initSetCursor);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.initSpatialRequirements);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.initTilesReq);
            await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        }, readFileTimeout);

        assertItem.setCursor1.map((setCursor, index) => {
            describe(`set cursor on {${assertItem.setCursor1[index].point.x}, ${assertItem.setCursor1[index].point.y}}`, () => {
                let SpatialProfileDataTemp: any;
                test(`SPATIAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetCursor, setCursor);
                    SpatialProfileDataTemp = await Connection.receive(CARTA.SpatialProfileData);
                }, cursorTimeout);

                test(`SPATIAL_PROFILE_DATA.value = ${assertItem.spatialProfileData[0].value}`, () => {
                    expect(SpatialProfileDataTemp.value).toEqual(assertItem.spatialProfileData[0].value);
                });

                test(`SPATIAL_PROFILE_DATA.x = ${assertItem.spatialProfileData[0].x} and SPATIAL_PROFILE_DATA.y = ${assertItem.spatialProfileData[0].y}`, () => {
                    expect(SpatialProfileDataTemp.x).toEqual(assertItem.spatialProfileData[0].x);
                    expect(SpatialProfileDataTemp.y).toEqual(assertItem.spatialProfileData[0].y);
                });

                test(`Length of profile_x = ${assertItem.spatialProfileData[0].profileLength.x} and length of profile_y = ${assertItem.spatialProfileData[0].profileLength.y}`, () => {
                    expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.length).toEqual(assertItem.spatialProfileData[0].profileLength.x);
                    expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values.length).toEqual(assertItem.spatialProfileData[0].profileLength.y);
                });

                test(`The decoded_profile_x[${assertItem.spatialProfileData[0].oddPoint.x.one.idx}] value = ${assertItem.spatialProfileData[0].oddPoint.x.one.value} and other values = ${assertItem.spatialProfileData[0].oddPoint.x.others} on the profile_x`, () => {
                    SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.map((value, index) => {
                        if (index === assertItem.spatialProfileData[0].oddPoint.x.one.idx) {
                            expect(value).toEqual(assertItem.spatialProfileData[0].oddPoint.x.one.value);
                        } else {
                            expect(value).toEqual(assertItem.spatialProfileData[0].oddPoint.x.others);
                        }
                    });
                });

                test(`The decoded_profile_y[${assertItem.spatialProfileData[0].oddPoint.y.one.idx}] value = ${assertItem.spatialProfileData[0].oddPoint.y.one.value} and other values = ${assertItem.spatialProfileData[0].oddPoint.y.others} on the profile_y`, () => {
                    SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values.map((value, index) => {
                        if (index === assertItem.spatialProfileData[0].oddPoint.y.one.idx) {
                            expect(value).toEqual(assertItem.spatialProfileData[0].oddPoint.y.one.value);
                        } else {
                            expect(value).toEqual(assertItem.spatialProfileData[0].oddPoint.y.others);
                        }
                    });
                });

            });
        });

        assertItem.setCursor2.map((setCursor, index) => {
            describe(`set cursor on {${assertItem.setCursor2[index].point.x}, ${assertItem.setCursor2[index].point.y}}`, () => {
                let SpatialProfileDataTemp: any;
                test(`SPATIAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetCursor, setCursor);
                    SpatialProfileDataTemp = await Connection.receive(CARTA.SpatialProfileData);
                }, cursorTimeout);

                test(`SPATIAL_PROFILE_DATA.value = ${assertItem.spatialProfileData2[index].value}`, () => {
                    expect(SpatialProfileDataTemp.value).toEqual(assertItem.spatialProfileData2[index].value);
                });

                test(`The decoded_profile_x[${assertItem.spatialProfileData2[index].oddPoint.x.one.idx}] value = ${assertItem.spatialProfileData2[index].oddPoint.x.one.value} and other values = ${assertItem.spatialProfileData2[index].oddPoint.x.others} on the profile_x`, () => {
                    SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.map((value, index2) => {
                        if (index2 === assertItem.spatialProfileData2[index].oddPoint.x.one.idx) {
                            expect(value).toEqual(assertItem.spatialProfileData2[index].oddPoint.x.one.value);
                        } else {
                            expect(value).toEqual(assertItem.spatialProfileData2[index].oddPoint.x.others);
                        }
                    });
                });

                test(`The decoded_profile_y[${assertItem.spatialProfileData2[index].oddPoint.y.one.idx}] value = ${assertItem.spatialProfileData2[index].oddPoint.y.one.value} and other values = ${assertItem.spatialProfileData2[index].oddPoint.y.others} on the profile_y`, () => {
                    SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values.map((value, index2) => {
                        if (index2 === assertItem.spatialProfileData2[index].oddPoint.y.one.idx) {
                            expect(value).toEqual(assertItem.spatialProfileData2[index].oddPoint.y.one.value);
                        } else {
                            expect(value).toEqual(assertItem.spatialProfileData2[index].oddPoint.y.others);
                        }
                    });
                });

            });
        });

        assertItem.errorPoint.map((item, index) => {
            describe(`set cursor on {${item.x}, ${item.y}}`, () => {
                test(`SPATIAL_PROFILE_DATA should not have any x or y`, async () => {
                    await Connection.send(CARTA.SetCursor, item);
                    let temp = await Connection.receive(CARTA.SpatialProfileData);
                    let tempProfileCoordinateEnd = temp.profiles.map(a => a.end)
                    if (item.x > tempProfileCoordinateEnd[0] && item.y > tempProfileCoordinateEnd[1]) {
                        expect(item.x).toBeGreaterThan(tempProfileCoordinateEnd[0]);
                        expect(item.y).toBeGreaterThan(tempProfileCoordinateEnd[1]);
                        // console.warn("Returned SpatialProfileData was filtered through jest/frontend");
                    }
                }, cursorTimeout + connectTimeout);

                test("Backend is not crashed", () => {
                    expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
                });

            });
        });

        afterAll(() => Connection.close());
    });
});
