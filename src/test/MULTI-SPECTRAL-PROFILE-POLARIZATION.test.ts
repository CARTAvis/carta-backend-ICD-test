import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
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
        file: "HH211_IQU.fits",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
        
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [33558529,33558528, 33554433,33554432,33562625,33558530,33562624,33554434,33562626],
    },
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 520, y: 520 }, { x: 100, y: 100 }],
            rotation: 0.0,
        }
    },
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "Iz",
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
                    coordinate: "Iz",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                },
                {
                    coordinate: "Qz",
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
                    coordinate: "Qz",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                },
                {
                    coordinate: "Iz",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                },
                {
                    coordinate: "Uz",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                },
            ],
        },
    ],
    ReturnSpectralProfileData: [
        {
            index: 0,
            value: 0.0007088588552472904,
        },
        {
            index: 2,
            value: 0.0012602472319775562,
        },
        {
            index: 4,
            value: 0.0007855336842870678,
        },
        {
            index: 0,
            value: -0.00012210526080733863,
        },
        {
            index: 2,
            value: -0.000033854758947925195,
        },
        {
            index: 4,
            value: -0.000008830321254663674,
        },
        {
            index: 0,
            value: 0.000010325868837087967,
        },
        {
            index: 2,
            value: -0.0000024363279953331134,
        },
        {
            index: 4,
            value: 0.000031310824961024904,
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

    describe(`Plot multi polarizations in one region in the spectral profiler:`,()=>{
        test(`Set one Region in the images`, async()=>{
            await Connection.send(CARTA.SetRegion,assertItem.setRegion);
            let RegionResponse1 = await Connection.receive(CARTA.SetRegionAck);
            expect(RegionResponse1.regionId).toEqual(1);
        });

        test(`Plot two polarizations in the spectral profiles and check the values`, async()=>{
            await Connection.send(CARTA.SetSpectralRequirements,assertItem.setSpectralRequirements[0]);
            let temp1 = await Connection.streamUntil((type, data) => type == CARTA.SpectralProfileData && data.progress == 1);
            let FirstPolarizationSpectralProfile = temp1.SpectralProfileData.slice(-1)[0];
            expect(FirstPolarizationSpectralProfile.regionId).toEqual(1);
            expect(FirstPolarizationSpectralProfile.progress).toEqual(1);
            expect(FirstPolarizationSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[0].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[0].value,assertItem.precisionDigits);
            expect(FirstPolarizationSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[1].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[1].value,assertItem.precisionDigits);
            expect(FirstPolarizationSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[2].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[2].value,assertItem.precisionDigits);

            await Connection.send(CARTA.SetSpectralRequirements,assertItem.setSpectralRequirements[1]);
            let temp2 = await Connection.streamUntil((type, data) => type == CARTA.SpectralProfileData && data.progress == 1);
            let SecondPolarizationSpectralProfile = temp2.SpectralProfileData.slice(-1)[0];
            expect(SecondPolarizationSpectralProfile.regionId).toEqual(1);
            expect(SecondPolarizationSpectralProfile.progress).toEqual(1);
            expect(SecondPolarizationSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[3].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[3].value,assertItem.precisionDigits);
            expect(SecondPolarizationSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[4].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[4].value,assertItem.precisionDigits);
            expect(SecondPolarizationSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[5].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[5].value,assertItem.precisionDigits);
        });

        test(`Plot three polarizations in the spectral profiles within one SetSpectralRequirement request and check the values`,async()=>{
            await Connection.send(CARTA.SetSpectralRequirements,assertItem.setSpectralRequirements[2]);
            let temp3 = await Connection.streamUntil((type, data) => type == CARTA.SpectralProfileData && data.progress == 1);
            let ThirdPolarizationSpectralProfile = temp3.SpectralProfileData.slice(-1)[0];
            expect(ThirdPolarizationSpectralProfile.regionId).toEqual(1);
            expect(ThirdPolarizationSpectralProfile.progress).toEqual(1);
            expect(ThirdPolarizationSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[6].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[6].value,assertItem.precisionDigits);
            expect(ThirdPolarizationSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[7].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[7].value,assertItem.precisionDigits);
            expect(ThirdPolarizationSpectralProfile.profiles[0].values[assertItem.ReturnSpectralProfileData[8].index]).toBeCloseTo(assertItem.ReturnSpectralProfileData[8].value,assertItem.precisionDigits);
        
        });
    });

    afterAll(() => Connection.close());
});