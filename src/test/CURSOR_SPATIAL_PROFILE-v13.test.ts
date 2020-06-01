import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;
let sleepTimeout: number = config.timeout.sleep
interface ISpatialProfileDataExt extends CARTA.ISpatialProfileData {
    value?: number,
    profileLength?: { x: number, y: number },
    oddPoint?: {
        x: { one: { idx: number, value: number }, others?: number },
        y: { one: { idx: number, value: number }, others?: number },
    }
};
interface AssertItem {
    register: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    setCursor: CARTA.ISetCursor[];
    spatialProfileData: ISpatialProfileDataExt[];
    // errorPoint: CARTA.ISpatialProfileData[];
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    fileOpen:
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
        spatialProfiles: ["x", "y"],
    },
    setCursor: [
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
};

describe("CURSOR_SPATIAL_PROFILE test with: if full resolution cursor spatial profiles are delivered correctly", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms)).then(() => { console.log('sleep!') });
    };

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`read the file "${assertItem.fileOpen.file}" on folder "${testSubdirectory}"`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        });

        test(`OpenFileAck? | `, async () => {
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
            let temp1 = await Connection.receive(CARTA.OpenFileAck)
            // console.log(temp1)
        }, openFileTimeout);

        test(`RegionHistogramData (would pass over if trying several times)? | `, async () => {
            let temp2 = await Connection.receive(CARTA.RegionHistogramData);
            console.log(temp2)
        }, openFileTimeout);

        let ack: AckStream;
        test(`RasterTileData * 1 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)?`, async () => {
            await Connection.send(CARTA.AddRequiredTiles, assertItem.initTilesReq);
            await Connection.send(CARTA.SetCursor, assertItem.initSetCursor);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.initSpatialRequirements);
            ack = await Connection.stream(4) as AckStream;
            // console.log(ack);
        }, readFileTimeout);

        assertItem.spatialProfileData.map((profileData, index) => {
            describe(`set cursor on {${assertItem.setCursor[index].point.x}, ${assertItem.setCursor[index].point.y}}`, () => {
                let SpatialProfileDataTemp: any;
                test(`SPATIAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor[index]);
                    SpatialProfileDataTemp = await Connection.receive(CARTA.SpatialProfileData);
                    console.log(SpatialProfileDataTemp)
                }, cursorTimeout);

                test(`SPATIAL_PROFILE_DATA.value = ${profileData.value}`, () => {
                    expect(SpatialProfileDataTemp.value).toEqual(profileData.value);
                });

                test(`SPATIAL_PROFILE_DATA.x = ${profileData.x} and SPATIAL_PROFILE_DATA.y = ${profileData.y}`, () => {
                    expect(SpatialProfileDataTemp.x).toEqual(profileData.x);
                    expect(SpatialProfileDataTemp.y).toEqual(profileData.y);
                });

                test(`Length of profile_x = ${profileData.profileLength.x} and length of profile_y = ${profileData.profileLength.y}`, () => {
                    expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.length).toEqual(profileData.profileLength.x);
                    expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values.length).toEqual(profileData.profileLength.y);
                });

                test(`The decoded_profile_x[${profileData.oddPoint.x.one.idx}] value = ${profileData.oddPoint.x.one.value} and other values = ${profileData.oddPoint.x.others} on the profile_x`, () => {
                    SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.map((value, index) => {
                        if (index === profileData.oddPoint.x.one.idx) {
                            expect(value).toEqual(profileData.oddPoint.x.one.value);
                        } else {
                            expect(value).toEqual(profileData.oddPoint.x.others);
                        }
                    });
                });

                test(`The decoded_profile_y[${profileData.oddPoint.y.one.idx}] value = ${profileData.oddPoint.y.one.value} and other values = ${profileData.oddPoint.y.others} on the profile_y`, () => {
                    SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values.map((value, index) => {
                        if (index === profileData.oddPoint.y.one.idx) {
                            expect(value).toEqual(profileData.oddPoint.y.one.value);
                        } else {
                            expect(value).toEqual(profileData.oddPoint.y.others);
                        }
                    });
                });

            });
        });

        afterAll(() => Connection.close());
    });
});
