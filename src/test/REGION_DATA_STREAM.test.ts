import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;
interface AssertItem {
    precisionDigits: number;
    register: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    setImageChannels: CARTA.ISetImageChannels;
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    spectralProfileData: CARTA.ISpectralProfileData;
    setStatsRequirements: CARTA.ISetStatsRequirements;
    regionStatsData: CARTA.IRegionStatsData;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: CARTA.IRegionHistogramData;
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    register:
    {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
        tileSize: 256,
    },
    setImageChannels:
    {
        fileId: 0,
        channel: 0,
        requiredTiles: {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 302, y: 370 }, { x: 10, y: 10 }],
            rotation: 0.0,
        },
        {
            fileId: 0,
            regionId: 1,
            regionName: "",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 302, y: 370 }, { x: 10, y: 10 }],
            rotation: 30.0,
        },
    ],
    regionAck:
    {
        success: true,
        regionId: 1,
    },
    setSpectralRequirements:
    {
        fileId: 0,
        regionId: 1,
        spectralProfiles: [
            {
                coordinate: "z",
                statsTypes: [CARTA.StatsType.Mean],
            }
        ],
    },
    spectralProfileData:
    {
        regionId: 1,
        progress: 1,
    },
    setStatsRequirements:
    {
        fileId: 0,
        regionId: 1,
        stats: [
            CARTA.StatsType.NumPixels,
            CARTA.StatsType.Sum,
            CARTA.StatsType.Mean,
            CARTA.StatsType.RMS,
            CARTA.StatsType.Sigma,
            CARTA.StatsType.SumSq,
            CARTA.StatsType.Min,
            CARTA.StatsType.Max
        ],
    },
    regionStatsData:
    {
        regionId: 1,
    },
    setHistogramRequirements:
    {
        fileId: 0,
        regionId: 1,
        histograms: [{ channel: -1, numBins: -1 }],
    },
    regionHistogramData:
    {
        regionId: 1,
        progress: 1,
    },
}

describe("REGION_DATA_STREAM test: Testing data streaming with regions", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}" to set region`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.OpenFile, assertItem.openFile);
            await Connection.receive(CARTA.OpenFileAck);
            await Connection.receive(CARTA.RegionHistogramData);
            await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannels);
            await Connection.receive(CARTA.RasterTileData);
            await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
            await Connection.receive(CARTA.SetRegionAck);
        });

        describe(`SET SPECTRAL REQUIREMENTS`, () => {
            test(`SPECTRAL_PROFILE_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                await Connection.receive(CARTA.SpectralProfileData);
            }, regionTimeout);

        });

        describe("SET STATS REQUIREMENTS", () => {
            test(`REGION_STATS_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetStatsRequirements, assertItem.setStatsRequirements);
                await Connection.receive(CARTA.RegionStatsData);
            }, regionTimeout);

        });

        describe(`SET HISTOGRAM REQUIREMENTS`, () => {
            test(`REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                await Connection.receive(CARTA.RegionHistogramData);
            }, regionTimeout);

        });

        describe("SET REGION", () => {
            let SetRegionAckTemp: CARTA.SetRegionAck;
            let Ack;
            test(`SET_REGION_ACK, SPECTRAL_PROFILE_DATA, REGION_HISTOGRAM_DATA & REGION_STATS_DATA should arrive within ${readFileTimeout} ms`, async () => {
                await Connection.send(CARTA.SetRegion, assertItem.setRegion[1]);
                SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck) as CARTA.SetRegionAck;
                Ack = await Connection.stream(3);

            }, readFileTimeout);

            test("SET_REGION_ACK.success = true", () => {
                expect(SetRegionAckTemp.success).toBe(true);
            });

            test(`SET_REGION_ACK.region_id = ${assertItem.regionAck.regionId}`, () => {
                expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAck.regionId);
            });

            test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData.regionId}`, () => {
                expect(Ack.SpectralProfileData[0].regionId).toEqual(assertItem.spectralProfileData.regionId);
            });

            test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData.progress}`, () => {
                expect(Ack.SpectralProfileData[0].regionId).toEqual(assertItem.spectralProfileData.progress);
            });

            test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
                expect(Ack.RegionHistogramData[0].regionId).toEqual(assertItem.regionHistogramData.regionId);
            });

            test(`REGION_HISTOGRAM_DATA.progress = ${assertItem.regionHistogramData.progress}`, () => {
                expect(Ack.RegionHistogramData[0].regionId).toEqual(assertItem.regionHistogramData.progress);
            });

            test(`REGION_STATS_DATA.region_id = ${assertItem.regionStatsData.regionId}`, () => {
                expect(Ack.RegionStatsData[0].regionId).toEqual(assertItem.regionStatsData.regionId);
            });

        });

    });

    afterAll(() => Connection.close());
});