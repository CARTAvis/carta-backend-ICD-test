import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
import { isNull } from "util";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;

interface ISpatialProfileDataExt extends CARTA.ISpatialProfileData {
    value?: number,
    profileLength?: { x: number, y: number },
    oddPoint?: {
        x: { one: { idx: number, value: number }[], others?: number },
        y: { one: { idx: number, value: number }[], others?: number },
    }
}
interface AssertItem {
    precisionDigits: number;
    register: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    setCursor: CARTA.ISetCursor[];
    spatialProfileData: ISpatialProfileDataExt[];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    fileOpen:
    {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
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
        point: { x: 321, y: 401 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"],
    },
    setCursor:
        [
            {
                fileId: 0,
                point: { x: 314.00, y: 393.00 },
            },
            {
                fileId: 0,
                point: { x: 596.00, y: 292.00 },
            },
        ],
    spatialProfileData:
        [
            {
                fileId: 0,
                regionId: 0,
                stokes: 0,
                x: 314.0,
                y: 393.0,
                profileLength: { x: 640, y: 800 },
                value: -0.004026404581964016,
                oddPoint: {
                    x: { one: [{ idx: 0, value: NaN }, { idx: 200, value: -0.0018224817467853427 }], others: null },
                    y: { one: [{ idx: 799, value: NaN }, { idx: 400, value: 0.0019619895610958338 }], others: null },
                }
            },
            {
                fileId: 0,
                regionId: 0,
                stokes: 0,
                x: 596.0,
                y: 292.0,
                profileLength: { x: 640, y: 800 },
                value: NaN,
                oddPoint: {
                    x: { one: [], others: NaN },
                    y: { one: [], others: NaN },
                }
            },
        ],
}

describe("CURSOR_SPATIAL_PROFILE_NaN test: Testing if full resolution cursor spatial profiles with NaN data are delivered correctly", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`read the file "${assertItem.fileOpen.file}" on folder "${testSubdirectory}"`, () => {
        let ack: AckStream;
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
            await Connection.receiveAny();
            await Connection.receiveAny(); // OpenFileAck | RegionHistogramData
            await Connection.send(CARTA.AddRequiredTiles, assertItem.initTilesReq);
            await Connection.send(CARTA.SetCursor, assertItem.initSetCursor);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.initSpatialRequirements);
            ack = await Connection.stream(4) as AckStream;
            // console.log(ack);
        }, readFileTimeout);

        test(`(Step 0) Connection open? | `, () => {
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        });

        assertItem.spatialProfileData.map((profileData, index) => {
            describe(`set cursor on {${assertItem.setCursor[index].point.x}, ${assertItem.setCursor[index].point.y}}`, () => {
                let SpatialProfileDataTemp: any;
                test(`SPATIAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor[index]);
                    SpatialProfileDataTemp = await Connection.receive(CARTA.SpatialProfileData);
                    console.log(SpatialProfileDataTemp)
                }, cursorTimeout);

                test(`SPATIAL_PROFILE_DATA.value = ${profileData.value}`, () => {
                    if (isNaN(profileData.value)) {
                        expect(SpatialProfileDataTemp.value).toEqual(NaN);
                    } else {
                        expect(SpatialProfileDataTemp.value).toBeCloseTo(profileData.value, assertItem.precisionDigits);
                    }
                });

                test(`SPATIAL_PROFILE_DATA.x = ${profileData.x} and SPATIAL_PROFILE_DATA.y = ${profileData.y}`, () => {
                    expect(SpatialProfileDataTemp.x).toEqual(profileData.x);
                    expect(SpatialProfileDataTemp.y).toEqual(profileData.y);
                });

                test(`Assert value of profile_x : ${profileData.oddPoint.x.one.map(f => ` #${f.idx} = ${f.value.toPrecision(assertItem.precisionDigits)}`)} ${isNaN(profileData.oddPoint.x.others) ? "other values = NaN" : isNull(profileData.oddPoint.x.others) ? "" : "other values = " + profileData.oddPoint.x.others}`, () => {
                    profileData.oddPoint.x.one.map(f => {
                        if (isNaN(f.value)) {
                            expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values[f.idx]).toEqual(NaN);
                        } else {
                            expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values[f.idx]).toBeCloseTo(f.value, assertItem.precisionDigits);
                        }
                    });
                    if (profileData.oddPoint.x.others !== null) {
                        SpatialProfileDataTemp.profiles.find(f => f.coordinate === "x").values.map((value, index) => {
                            if (profileData.oddPoint.x.one.findIndex(f => f.idx === index) !== -1) {
                                expect(value).toEqual(profileData.oddPoint.x.others);
                            }
                        });
                    }
                });

                test(`Assert value of profile_y : ${profileData.oddPoint.y.one.map(f => ` #${f.idx} = ${f.value.toPrecision(assertItem.precisionDigits)}`)} ${isNaN(profileData.oddPoint.x.others) ? "other values = NaN" : isNull(profileData.oddPoint.x.others) ? "" : "other values = " + profileData.oddPoint.x.others}`, () => {
                    profileData.oddPoint.y.one.map(f => {
                        if (isNaN(f.value)) {
                            expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values[f.idx]).toEqual(NaN);
                        } else {
                            expect(SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values[f.idx]).toBeCloseTo(f.value, assertItem.precisionDigits);
                        }
                    });
                    if (profileData.oddPoint.y.others !== null) {
                        SpatialProfileDataTemp.profiles.find(f => f.coordinate === "y").values.map((value, index) => {
                            if (profileData.oddPoint.y.one.findIndex(f => f.idx === index) !== -1) {
                                expect(value).toEqual(profileData.oddPoint.y.others);
                            }
                        });
                    }
                });

            });
        });

    });

    afterAll(() => Connection.close());
});