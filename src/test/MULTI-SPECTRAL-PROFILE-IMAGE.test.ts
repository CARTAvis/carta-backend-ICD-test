import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    SpatialProfileData: CARTA.ISpectralProfileData[];
    setImageChannel: CARTA.ISetImageChannels[];
    setRegion: CARTA.ISetRegion;
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: [
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.fits",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_13CO_2-1.fits",
            fileId: 1,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [16777216, 16781312, 16777217, 16781313],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [16777216, 16781312, 16777217, 16781313],
        },
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ], 
    setCursor: [
        {
            fileId: 0,
            point: { x: 216, y: 216 },
    
        }, 
        {
            fileId: 1,
            point: { x: 216, y: 216 },
    
        }, 
    ],
    SpatialProfileData:[
        {
            profiles:[],
            x: 216,
            y: 216,
            value: 0.004661305341869593,
        },
        {
            profiles:[],
            x: 216,
            y: 216,
            value: 0.0016310831997543573,
        }
    ],
    setImageChannel:[
        {
            fileId: 1,
            channel: 109,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 149.20297029702965, y: 283.93564356435644 }, { x: 128.31683168316835, y: 132.59405940594058 }],
            rotation: 0.0,
        }
    },
    setSpectralRequirements: [
        {
            fileId: 1,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
    ],
};

describe("MATCH_SPATIAL: Test cursor value and spatial profile with spatially matched images", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Prepare the first images`, () => {
        test(`Should open image ${assertItem.openFile[0].file}:`, async () => {
            await Connection.openFile(assertItem.openFile[0]);
        }, openFileTimeout);

        let ack: AckStream;
        test(`return RASTER_TILE_DATA(Stream) and check total length `, async()=>{
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
            ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq[0].tiles.length);
            expect(ack.RasterTileSync.length).toEqual(2);
        })
    });

    describe(`Prepare the second images`, () => {
        test(`Should open image ${assertItem.openFile[1].file}:`, async () => {
            await Connection.openFile(assertItem.openFile[1]);
        }, openFileTimeout);

        let ack2: AckStream;
        test(`return RASTER_TILE_DATA(Stream) and check total length `, async()=>{
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
            ack2 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            expect(ack2.RasterTileData.length).toEqual(assertItem.addTilesReq[1].tiles.length);
            expect(ack2.RasterTileSync.length).toEqual(2);
            expect(ack2.RasterTileData[0].fileId).toEqual(1);
        })
    });

    describe(`Plot multi image in the spectral profiler:`,()=>{
        let ack3: AckStream;
        let ack4: AckStream;
        test(`Set two images in tile=[0]`,async()=>{
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[2]);
            ack3 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            expect(ack3.RasterTileData.length).toEqual(assertItem.addTilesReq[2].tiles.length);
            expect(ack3.RasterTileSync.length).toEqual(2);

            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[3]);
            ack4 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            expect(ack4.RasterTileData.length).toEqual(assertItem.addTilesReq[3].tiles.length);
            expect(ack4.RasterTileSync.length).toEqual(2);
            expect(ack4.RasterTileData[0].fileId).toEqual(1);
        });

        let ack5: AckStream;
        test(`Match spatial and spectral of two images`, async()=>{
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);

            let spectralProfileDataResponse = await Connection.stream(2);
            expect(spectralProfileDataResponse.SpatialProfileData[0].value).toEqual(assertItem.SpatialProfileData[0].value);
            expect(spectralProfileDataResponse.SpatialProfileData[1].value).toEqual(assertItem.SpatialProfileData[1].value);

            await Connection.send(CARTA.SetImageChannels,assertItem.setImageChannel[0]);
            ack5 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            let ack5Count = ack5.RegionHistogramData.length + ack5.SpatialProfileData.length + ack5.RasterTileSync.length + ack5.RasterTileData.length;
            expect(ack5Count).toEqual(5);
        });

        test(`Set a Region in one of the images`, async()=>{
            await Connection.send(CARTA.SetRegion,assertItem.setRegion);
            let RegionResponse = await Connection.receive(CARTA.SetRegionAck);
        });

        test(`Plot two images' spectral profiles`, async()=>{
            await Connection.send(CARTA.SetSpectralRequirements,assertItem.setSpectralRequirements[0]);
            let tt1 = await Connection.receive(CARTA.SpectralProfileData);
            console.log(tt1);

            await Connection.send(CARTA.SetSpectralRequirements,assertItem.setSpectralRequirements[1]);
            let tt2 = await Connection.receive(CARTA.SpectralProfileData);
            console.log(tt2);
        });
    });

    afterAll(() => Connection.close());
});