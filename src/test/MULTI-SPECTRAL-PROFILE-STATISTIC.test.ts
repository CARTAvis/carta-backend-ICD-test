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
    setRegion: CARTA.ISetRegion;
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    ReturnSpectralProfileData: ISpectralProfileIndexValue[];
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
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 210, y: 220 }, { x: 100, y: 100 }],
            rotation: 0.0,
        }
    },
    setSpectralRequirements: [
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
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.RMS,
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
                        CARTA.StatsType.RMS,
                        CARTA.StatsType.Sigma,
                    ],
                }
            ],
        },
    ],
    ReturnSpectralProfileData: [
        {
            index: 0,
            value: -0.0007642408502170499,
        },
        {
            index: 100,
            value: 0.014224687421439227,
        },
        {
            index: 200,
            value: 0.0,
        },
        {
            index: 0,
            value: -0.00023187858529677354,
        },
        {
            index: 100,
            value: 0.056362498725418875,
        },
        {
            index: 200,
            value: 0.0,
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

    describe(`Plot multi statistics in one region in the spectral profiler:`,()=>{
        test(`Set one Regions in the images`, async()=>{
            await Connection.send(CARTA.SetRegion,assertItem.setRegion);
            let RegionResponse1 = await Connection.receive(CARTA.SetRegionAck);
            expect(RegionResponse1.regionId).toEqual(1);
        });

        test(`Plot two statistics in the spectral profiles and check the values`, async()=>{
            await Connection.send(CARTA.SetSpectralRequirements,assertItem.setSpectralRequirements[0]);
            let temp1 = await Connection.streamUntil((type, data) => type == CARTA.SpectralProfileData && data.progress == 1);
            let FirstStatisticsSpectralProfile = temp1.SpectralProfileData.slice(-1)[0];
            expect(FirstStatisticsSpectralProfile.regionId).toEqual(1);
            expect(FirstStatisticsSpectralProfile.progress).toEqual(1);
            expect(FirstStatisticsSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[0].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[0].value,assertItem.precisionDigits);
            expect(FirstStatisticsSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[1].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[1].value,assertItem.precisionDigits);
            expect(FirstStatisticsSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[2].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[2].value,assertItem.precisionDigits);

            await Connection.send(CARTA.SetSpectralRequirements,assertItem.setSpectralRequirements[1]);
            let temp2 = await Connection.streamUntil((type, data) => type == CARTA.SpectralProfileData && data.progress == 1);
            let SecondStatisticsSpectralProfile = temp2.SpectralProfileData.slice(-1)[0];
            // expect(FirstRegionSpectralProfile.regionId).toEqual(1);
            expect(SecondStatisticsSpectralProfile.progress).toEqual(1);
            // expect(FirstRegionSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[3].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[3].value,assertItem.precisionDigits);
            // expect(FirstRegionSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[4].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[4].value,assertItem.precisionDigits);
            // expect(FirstRegionSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[5].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[5].value,assertItem.precisionDigits);
        });
    });

    afterAll(() => Connection.close());
});