import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
interface ISpectralProfileIndexValue {
    index: number;
    value: number;
}
interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setRegion: CARTA.ISetRegion[];
}
let assertItem: AssertItem = {
    precisionDigits: 7,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_CO_2_1.fits",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
        
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [16777216, 16781312, 16777217, 16781313],
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 210, y: 220 }, { x: 50, y: 50 }],
                rotation: 0.0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 150, y: 170 }, { x: 35, y: 35 }],
                rotation: 0.0,
            }
        },
    ]
};

describe("MATCH_SPATIAL: Test cursor value and spatial profile with spatially matched images", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Prepare the images`, () => {
        test(`Should open image ${assertItem.openFile.file}:`, async () => {
            await Connection.openFile(assertItem.openFile);
        }, openFileTimeout);

        let ack: AckStream;
        test(`return RASTER_TILE_DATA(Stream) and check total length `, async()=>{
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
            ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length);
            expect(ack.RasterTileSync.length).toEqual(2);
        })
    });

    describe(`Plot multi regions in the spectral profiler:`,()=>{
        test(`Set two Regions in the images`, async()=>{
            await Connection.send(CARTA.SetRegion,assertItem.setRegion[0]);
            let RegionResponse1 = await Connection.receive(CARTA.SetRegionAck);
            expect(RegionResponse1.regionId).toEqual(1);

            await Connection.send(CARTA.SetRegion,assertItem.setRegion[1]);
            let RegionResponse2 = await Connection.receive(CARTA.SetRegionAck);
            expect(RegionResponse2.regionId).toEqual(2);
        });

    });


    afterAll(() => Connection.close());
});