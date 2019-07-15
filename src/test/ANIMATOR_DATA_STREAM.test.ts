import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let changeChannelTimeout = config.timeout.changeChannel;
let regionTimeout = config.timeout.region;

interface ImageAssertItem {
    file: CARTA.IOpenFile;
    imageDataInfo: CARTA.ISetImageView;
    precisionDigits: number;
    cursor: CARTA.ISetCursor;
    spatial: CARTA.ISetSpatialRequirements;
    stats: CARTA.ISetStatsRequirements;
    histogram: CARTA.ISetHistogramRequirements;
    imageChannels: CARTA.ISetImageChannels;
}
let imageAssertItem: ImageAssertItem = { 
    file: {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    imageDataInfo: {
        fileId: 0,
        compressionQuality: 11,
        imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
        compressionType: CARTA.CompressionType.ZFP,
        mip: 2,
        numSubsets: 4,
    },
    precisionDigits: 4,
    cursor: {
        fileId: 0,
        point: {x: 319, y: 378},
    },
    spatial: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"],
    },
    stats: {
        fileId: 0,
        regionId: -1,
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
    histogram: {
        fileId: 0,
        regionId: -1,
        histograms: [{channel: -1, numBins: -1}],
    },
    imageChannels: {
        fileId: 0,
        channel: 12,
        stokes: 0,
        requiredTiles: {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
        },
    },
}

describe("ANIMATOR_DATA_STREAM test: Testing data streaming with animator", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: ""
                }
            );
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            await done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.file.file}" to set region`, () => {

        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1,});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, imageAssertItem.file);
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            await Utility.setEventAsync(Connection, CARTA.SetImageChannels, 
                {
                    fileId: 0,
                    channel: 0,
                    requiredTiles: {
                        fileId: 0,
                        tiles: [0],
                        compressionType: CARTA.CompressionType.NONE,
                    },
                },
            );
            await Utility.getEventAsync(Connection, CARTA.RasterTileData);
            await Utility.setEventAsync(Connection, CARTA.SetCursor, imageAssertItem.cursor);
        });

        describe(`SET SPATIAL REQUIREMENTS`, () => {
            test(`SPATIAL_PROFILE_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetSpatialRequirements, imageAssertItem.spatial);
                await Utility.getEventAsync(Connection, CARTA.SpatialProfileData);
            }, regionTimeout);
        });

        describe("SET STATS REQUIREMENTS", () => {
            test(`REGION_STATS_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetStatsRequirements, imageAssertItem.stats);
                await Utility.getEventAsync(Connection, CARTA.RegionStatsData);
            }, regionTimeout);
        });
    
        describe(`SET HISTOGRAM REQUIREMENTS`, () => {
            test(`REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetHistogramRequirements, imageAssertItem.histogram);
                await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            }, regionTimeout);
        });

        describe("SET IMAGE CHANNELS", () => {
            let Ack;
            test(`RASTER_TILE_DATA, SPATIAL_PROFILE_DATA, REGION_HISTOGRAM_DATA & REGION_STATS_DATA should arrive within ${changeChannelTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetImageChannels, imageAssertItem.imageChannels);
                Ack = await Utility.getStreamAsync(Connection, 4);
            }, changeChannelTimeout);

            test(`RASTER_TILE_DATA.channel = ${imageAssertItem.imageChannels.channel}`, () => {
                expect(Ack.RasterTileData.channel).toEqual(imageAssertItem.imageChannels.channel);
            });

            test(`REGION_HISTOGRAM_DATA.region_id = ${imageAssertItem.histogram.regionId}`, () => {
                expect(Ack.RegionHistogramData.regionId).toEqual(imageAssertItem.histogram.regionId);
            });

            test(`REGION_STATS_DATA.region_id = ${imageAssertItem.stats.regionId}`, () => {
                expect(Ack.RegionStatsData.regionId).toEqual(imageAssertItem.stats.regionId);
            });

            test(`REGION_STATS_DATA.channel = ${imageAssertItem.imageChannels.channel}`, () => {
                expect(Ack.RegionStatsData.channel).toEqual(imageAssertItem.imageChannels.channel);
            });

            test(`SPATIAL_PROFILE_DATA.channel = ${imageAssertItem.imageChannels.channel}`, () => {
                expect(Ack.SpatialProfileData.channel).toEqual(imageAssertItem.imageChannels.channel);
            });

            test(`SPATIAL_PROFILE_DATA.x = ${imageAssertItem.cursor.point.x}`, () => {
                expect(Ack.SpatialProfileData.x).toEqual(imageAssertItem.cursor.point.x);
            });

            test(`SPATIAL_PROFILE_DATA.y = ${imageAssertItem.cursor.point.y}`, () => {
                expect(Ack.SpatialProfileData.y).toEqual(imageAssertItem.cursor.point.y);
            });
        });

    });

    afterAll( () => {
        Connection.close();
    });
});