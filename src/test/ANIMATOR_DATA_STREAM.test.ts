import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let changeChannelTimeout = config.timeout.changeChannel;
let regionTimeout = config.timeout.region;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    cursor: CARTA.ISetCursor;
    spatial: CARTA.ISetSpatialRequirements;
    stats: CARTA.ISetStatsRequirements;
    histogram: CARTA.ISetHistogramRequirements;
    imageChannels: CARTA.ISetImageChannels[];
}
let assertItem: AssertItem = {
    registerViewer:
    {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    precisionDigits: 4,
    cursor: {
        fileId: 0,
        point: { x: 319, y: 378 },
    },
    spatial: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
    },
    stats: {
        fileId: 0,
        regionId: -1,
        statsConfigs:[
            {coordinate:"z", statsTypes:[
                CARTA.StatsType.NumPixels,
                CARTA.StatsType.Sum,
                CARTA.StatsType.FluxDensity,
                CARTA.StatsType.Mean,
                CARTA.StatsType.RMS,
                CARTA.StatsType.Sigma,
                CARTA.StatsType.SumSq,
                CARTA.StatsType.Min,
                CARTA.StatsType.Max,
                CARTA.StatsType.Extrema
            ]}
        ],
    },
    histogram: {
        fileId: 0,
        regionId: -1,
        histograms: [{ channel: -1, numBins: -1 }],
    },
    imageChannels: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 0,
            channel: 12,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
}

describe("ANIMATOR_DATA_STREAM: Testing data streaming with animator", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}" to set region`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            await Connection.openFile(assertItem.openFile);
            await Connection.send(CARTA.SetImageChannels, assertItem.imageChannels[0]);
            await Connection.send(CARTA.SetCursor, assertItem.cursor);
            await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        });

        describe(`SET SPATIAL REQUIREMENTS`, () => {
            test(`SPATIAL_PROFILE_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetSpatialRequirements, assertItem.spatial);
                await Connection.receive(CARTA.SpatialProfileData);
            }, regionTimeout);
        });

        describe("SET STATS REQUIREMENTS", () => {
            test(`REGION_STATS_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetStatsRequirements, assertItem.stats);
                await Connection.receive(CARTA.RegionStatsData);
            }, regionTimeout);
        });

        describe(`SET HISTOGRAM REQUIREMENTS`, () => {
            test(`REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetHistogramRequirements, assertItem.histogram);
                await Connection.receive(CARTA.RegionHistogramData);
            }, regionTimeout);
        });

        describe("SET IMAGE CHANNELS", () => {
            let Ack: AckStream;
            let SpatialProfileData: CARTA.SpatialProfileData;
            test(`RASTER_TILE_DATA, SPATIAL_PROFILE_DATA, REGION_HISTOGRAM_DATA & REGION_STATS_DATA should arrive within ${changeChannelTimeout} ms`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.imageChannels[1]);
                Ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                SpatialProfileData = Ack.SpatialProfileData[0];
            }, changeChannelTimeout);

            test(`RASTER_TILE_DATA.channel = ${assertItem.imageChannels[1].channel}`, () => {
                expect(Ack.RasterTileData[0].channel).toEqual(assertItem.imageChannels[1].channel);
            });

            test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.histogram.regionId}`, () => {
                expect(Ack.RegionHistogramData[0].regionId).toEqual(assertItem.histogram.regionId);
            });

            test(`REGION_STATS_DATA.region_id = ${assertItem.stats.regionId}`, () => {
                expect(Ack.RegionStatsData[0].regionId).toEqual(assertItem.stats.regionId);
            });

            test(`REGION_STATS_DATA.channel = ${assertItem.imageChannels[1].channel}`, () => {
                expect(Ack.RegionStatsData[0].channel).toEqual(assertItem.imageChannels[1].channel);
            });

            test(`SPATIAL_PROFILE_DATA.channel = ${assertItem.imageChannels[1].channel}`, () => {
                expect(SpatialProfileData.channel).toEqual(assertItem.imageChannels[1].channel);
            });

            test(`SPATIAL_PROFILE_DATA.x = ${assertItem.cursor.point.x}`, () => {
                expect(SpatialProfileData.x).toEqual(assertItem.cursor.point.x);
            });

            test(`SPATIAL_PROFILE_DATA.y = ${assertItem.cursor.point.y}`, () => {
                expect(SpatialProfileData.y).toEqual(assertItem.cursor.point.y);
            });
        });

    });

    afterAll(() => Connection.close());
});