import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;
let returnTimeout = config.timeout.messageEvent;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck[];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    addRequiredTiles: {
        tiles: [0],
        fileId: 0,
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 11,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 197.0, y: 489.0 }, { x: 10.0, y: 10.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 306.0, y: 670.0 }, { x: 20.0, y: 48.0 }],
            rotation: 27.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{ x: 551.0, y: 330.0 }, { x: 30.0, y: 15.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 580.0, y: 240.0 }, { x: 35.0, y: 35.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 552.0, y: 184.0 }, { x: 350.0, y: 18.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 635.0, y: 128.0 }, { x: 25.0, y: 48.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 694.0, y: 80.0 }, { x: 25.0, y: 33.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 84.0, y: 491.0 }, { x: 10.0, y: 10.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 43.0, y: 491.0 }, { x: 10.0, y: 10.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: -1.0, y: 491.0 }, { x: 10.0, y: 10.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: -14.0, y: 491.0 }, { x: 10.0, y: 10.0 }],
            rotation: 0.0,
            regionName: "",
        },
        {
            fileId: 0,
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 197.0, y: 489.0 }, { x: 10.0, y: 10.0 }],
            rotation: 0.0,
            regionName: "",
        },
    ],
    regionAck: [
        { regionId: 1 },
        { regionId: 2 },
        { regionId: 3 },
        { regionId: 4 },
        { regionId: 5 },
        { regionId: 6 },
        { regionId: 7 },
        { regionId: 1 },
        { regionId: 1 },
        { regionId: 1 },
        { regionId: 1 },
        { regionId: 1 },
    ],
    precisionDigits: 4,
}

describe("REGION_REGISTER: Testing region creation and modification", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.fileOpen.file}" to set image view`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
            await Connection.receiveAny();
            await Connection.receiveAny(); // OpenFileAck | RegionHistogramData

            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            // RASTER_TILE_SYNC SPATIAL_PROFILE_DATA RASTER_TILE_DATA RASTER_TILE_SYNC
            await Connection.stream(4) as AckStream;
        });

        assertItem.setRegion.map((region, index) => {

            describe(`${region.regionId < 0 ? "Creating" : "Modify"} ${CARTA.RegionType[region.regionType]} region #${assertItem.regionAck[index].regionId} on ${JSON.stringify(region.controlPoints)}`, () => {
                let SetRegionAckTemp: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetRegion, region);
                    SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck) as CARTA.SetRegionAck;
                }, regionTimeout);

                test("SET_REGION_ACK.success = True", () => {
                    expect(SetRegionAckTemp.success).toBe(true);
                });

                test(`SET_REGION_ACK.region_id = ${assertItem.regionAck[index].regionId}`, () => {
                    expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAck[index].regionId);
                });

            });

        });

        describe("Remove region #3", () => {

            beforeAll(async () => {
                await Connection.send(CARTA.RemoveRegion, { regionId: 3 });
            });

            test(`should not return within ${returnTimeout} ms`, async () => {
                await Connection.receive(CARTA.RasterTileData, returnTimeout, false);
            });

            describe("Modify region #3", () => {
                let SetRegionAckTemp: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetRegion,
                        {
                            fileId: 0,
                            regionId: 3,
                            regionName: "",
                            regionType: CARTA.RegionType.ELLIPSE,
                            controlPoint: [{ x: 551.0, y: 330.0 }, { x: 30.0, y: 15.0 }],
                            rotation: 30.0,
                        }
                    );
                    SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck) as CARTA.SetRegionAck;
                }, regionTimeout);

                test("SET_REGION_ACK.success = false", () => {
                    expect(SetRegionAckTemp.success).toBe(false);
                });

            });
        });
    });

    afterAll(() => Connection.close());
});