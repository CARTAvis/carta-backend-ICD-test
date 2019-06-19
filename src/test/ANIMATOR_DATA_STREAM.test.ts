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
    },
}

describe("ANIMATOR_DATA_STREAM test: Testing data streaming with animator", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: ""
                }
            );
            await new Promise( resolve => Utility.getEvent(this, CARTA.RegisterViewerAck, 
                RegisterViewerAck => {
                    expect(RegisterViewerAck.success).toBe(true);
                    resolve();
                }                
            ));
            await done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.file.file}" to set region`, () => {

        beforeAll( async () => {
            await Utility.setEvent(Connection, CARTA.CloseFile, {fileId: -1,});
            await Utility.setEvent(Connection, CARTA.OpenFile, imageAssertItem.file);
            await new Promise( resolve => Utility.getEvent(Connection, CARTA.OpenFileAck, resolve));
            await Utility.setEvent(Connection, CARTA.SetImageView, imageAssertItem.imageDataInfo);
            await new Promise( resolve => Utility.getEvent(Connection, CARTA.RasterImageData, resolve));
        });

        describe(`SET SPATIAL REQUIREMENTS`, () => {
            test(`SPATIAL_PROFILE_DATA should arrive within ${regionTimeout} ms`, async () => {                
                await Utility.setEvent(Connection, CARTA.SetCursor, imageAssertItem.cursor);
                await Utility.setEvent(Connection, CARTA.SetSpatialRequirements, imageAssertItem.spatial);
                await new Promise( resolve => Utility.getEvent(Connection, CARTA.SpatialProfileData, resolve));
            }, regionTimeout);
        });

        describe("SET STATS REQUIREMENTS", () => {
            test(`REGION_STATS_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Utility.setEvent(Connection, CARTA.SetStatsRequirements, imageAssertItem.stats);
                await new Promise( resolve => Utility.getEvent(Connection, CARTA.RegionStatsData, resolve));
            }, regionTimeout);
        });
    
        describe(`SET HISTOGRAM REQUIREMENTS`, () => {
            test(`REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Utility.setEvent(Connection, CARTA.SetHistogramRequirements, imageAssertItem.histogram);
                await new Promise( resolve => Utility.getEvent(Connection, CARTA.RegionHistogramData, resolve));
            }, regionTimeout);
        });

        describe("SET IMAGE CHANNELS", () => {
            let RasterImageDataTemp: CARTA.RasterImageData;
            let SpatialProfileDataTemp: CARTA.SpatialProfileData;
            let RegionHistogramDataTemp: CARTA.RegionHistogramData;
            let RegionStatsDataTemp: CARTA.RegionStatsData;
            test(`RASTER_IMAGE_DATA, SPATIAL_PROFILE_DATA, REGION_HISTOGRAM_DATA & REGION_STATS_DATA should arrive within ${changeChannelTimeout} ms`, async () => {
                await Utility.setEvent(Connection, CARTA.SetImageChannels, imageAssertItem.imageChannels);
                await new Promise( (resolve, reject) => 
                    Utility.getStream(Connection, 4, resolve,
                        {
                            RasterImageData: RasterImageData => {
                                RasterImageDataTemp = RasterImageData;
                            },
                            SpatialProfileData: SpatialProfileData => {
                                SpatialProfileDataTemp = SpatialProfileData;
                            },
                            RegionHistogramData: RegionHistogramData => {
                                RegionHistogramDataTemp = RegionHistogramData;
                            },
                            RegionStatsData: RegionStatsData => {
                                RegionStatsDataTemp = RegionStatsData;
                            },
                        },
                    )
                );
            }, changeChannelTimeout);

            test(`RASTER_IMAGE_DATA.channel = ${imageAssertItem.imageChannels.channel}`, () => {
                expect(RasterImageDataTemp.channel).toEqual(imageAssertItem.imageChannels.channel);
            });

            test(`REGION_HISTOGRAM_DATA.region_id = ${imageAssertItem.histogram.regionId}`, () => {
                expect(RegionHistogramDataTemp.regionId).toEqual(imageAssertItem.histogram.regionId);
            });

            test(`REGION_STATS_DATA.region_id = ${imageAssertItem.stats.regionId}`, () => {
                expect(RegionStatsDataTemp.regionId).toEqual(imageAssertItem.stats.regionId);
            });

            test(`REGION_STATS_DATA.channel = ${imageAssertItem.imageChannels.channel}`, () => {
                expect(RegionStatsDataTemp.channel).toEqual(imageAssertItem.imageChannels.channel);
            });

            test(`SPATIAL_PROFILE_DATA.channel = ${imageAssertItem.imageChannels.channel}`, () => {
                expect(SpatialProfileDataTemp.regionId).toEqual(imageAssertItem.imageChannels.channel);
            });

            test(`SPATIAL_PROFILE_DATA.x = ${imageAssertItem.cursor.point.x}`, () => {
                expect(SpatialProfileDataTemp.x).toEqual(imageAssertItem.cursor.point.x);
            });

            test(`SPATIAL_PROFILE_DATA.y = ${imageAssertItem.cursor.point.y}`, () => {
                expect(SpatialProfileDataTemp.y).toEqual(imageAssertItem.cursor.point.y);
            });
        });

    });

    afterAll( () => {
        Connection.close();
    });
});