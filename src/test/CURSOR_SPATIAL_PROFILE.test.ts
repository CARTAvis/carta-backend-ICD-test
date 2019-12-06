import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;
interface ISpatialProfileDataExt extends CARTA.ISpatialProfileData {
    value?: number,
    profileLength?: { x: number, y: number },
    oddPoint?: {
        x: { one: { idx: number, value: number }, others?: number },
        y: { one: { idx: number, value: number }, others?: number },
    }
}
interface AssertItem {
    precisionDigits: number;
    register: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile;
    setImageChannel: CARTA.ISetImageChannels;
    setSpatialRequirements: CARTA.ISetSpatialRequirements;
    setCursor: CARTA.ISetCursor[];
    spatialProfileData: ISpatialProfileDataExt[];
    errorPoint: CARTA.ISpatialProfileData[];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    fileOpen:
    {
        directory: testSubdirectory,
        file: "qa_xyProfiler.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
        tileSize: 256,
    },
    setImageChannel:
    {
        fileId: 0,
        channel: 0,
        stokes: 0,
        requiredTiles: {
            fileId: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
    },
    setSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"],
    },
    setCursor:
        [
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
    spatialProfileData:
        [
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
}

describe("CURSOR_SPATIAL_PROFILE test: Testing if full resolution cursor spatial profiles are delivered correctly", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`read the file "${assertItem.fileOpen.file}" on folder "${testSubdirectory}"`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
            await Connection.receiveAny();
            await Connection.receiveAny(); // OpenFileAck | RegionHistogramData
            await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialRequirements);
            await Connection.receive(CARTA.RasterTileData);
        }, readFileTimeout);

        assertItem.spatialProfileData.map((profileData, index) => {
            describe(`set cursor on {${assertItem.setCursor[index].point.x}, ${assertItem.setCursor[index].point.y}}`, () => {
                let SpatialProfileDataTemp: any;
                test(`SPATIAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor[index]);
                    SpatialProfileDataTemp = await Connection.receive(CARTA.SpatialProfileData);
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

                test(`The #${profileData.oddPoint.x.one.idx + 1} value = ${profileData.oddPoint.x.one.value} and other values = ${profileData.oddPoint.x.others} on the profile_x`, () => {
                    SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.map((value, index) => {
                        if (index === profileData.oddPoint.x.one.idx) {
                            expect(value).toEqual(profileData.oddPoint.x.one.value);
                        } else {
                            expect(value).toEqual(profileData.oddPoint.x.others);
                        }
                    });
                });

                test(`The #${profileData.oddPoint.y.one.idx + 1} value = ${profileData.oddPoint.y.one.value} and other values = ${profileData.oddPoint.y.others} on the profile_y`, () => {
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

        assertItem.errorPoint.map((item, index) => {
            describe(`set cursor on {${item.x}, ${item.y}}`, () => {
                test(`SPATIAL_PROFILE_DATA should not arrive within ${cursorTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetCursor, item);
                    await Connection.receive(CARTA.SpatialProfileData, cursorTimeout);
                }, cursorTimeout + connectTimeout);

                test("Backend is not crashed", () => {
                    expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
                });

            });
        });

    });

    afterAll(() => Connection.close());
});