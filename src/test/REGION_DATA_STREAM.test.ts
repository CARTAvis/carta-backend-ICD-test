import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;
interface Stats {
    coordinate: string,
    statsTypes: CARTA.StatsType[],
    statsValue?: {statsType: CARTA.StatsType, value: number}[],
}
interface Region {
    fileId?: number;
    regionId?: number;
    regionType: CARTA.RegionType;
    controlPoints: CARTA.IPoint[];
    rotation: number;
    regionName: string;
    assert: {
        regionId: number,
        progress: number,
    };
    stats: Stats;
}
interface ImageAssertItem {
    fileName: string;
    hdu: string;
    imageDataInfo: CARTA.ISetImageView;
    precisionDigits: number;
    region: Region;
}
let imageAssertItem: ImageAssertItem = {
    fileName: "M17_SWex.image",
    hdu: "",
    imageDataInfo: {
        fileId: 0,
        compressionQuality: 11,
        imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
        compressionType: CARTA.CompressionType.ZFP,
        mip: 2,
        numSubsets: 4,
    },
    precisionDigits: 4,
    region: {
        fileId: 0,
        regionId: -1,
        regionType: CARTA.RegionType.RECTANGLE,
        controlPoints: [{x: 302, y: 370}, {x: 10, y: 10}],
        rotation: 0.0,
        regionName: "",
        assert: {
            regionId: 1,
            progress: 1,
        },
        stats: {
            coordinate: "z",
            statsTypes: [
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
    },
}

describe("REGION_DATA_STREAM test: Testing data streaming with regions", () => {   
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

    describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.fileName}" to set region`, () => {

        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, 
                {
                    directory: testSubdirectory, 
                    file: imageAssertItem.fileName,
                    fileId: imageAssertItem.imageDataInfo.fileId,
                    hdu: imageAssertItem.hdu,
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
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
            await Utility.setEventAsync(Connection, CARTA.SetRegion, imageAssertItem.region);
            await Utility.getEventAsync(Connection, CARTA.SetRegionAck);
        });
            
        describe(`SET SPECTRAL REQUIREMENTS`, () => {
            test(`SPECTRAL_PROFILE_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetSpectralRequirements, 
                    {
                        fileId: imageAssertItem.imageDataInfo.fileId,
                        regionId: imageAssertItem.region.assert.regionId,
                        spectralProfiles: [
                            {
                                coordinate: imageAssertItem.region.stats.coordinate,
                                statsTypes: [CARTA.StatsType.Mean],
                            },
                        ],
                    }
                );
                await Utility.getEventAsync(Connection, CARTA.SpectralProfileData);
            }, regionTimeout);

        });

        describe("SET STATS REQUIREMENTS", () => {
            test(`REGION_STATS_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetStatsRequirements, 
                    {
                        fileId: imageAssertItem.imageDataInfo.fileId,
                        regionId: imageAssertItem.region.assert.regionId,
                        stats: imageAssertItem.region.stats.statsTypes,
                    }
                );
                await Utility.getEventAsync(Connection, CARTA.RegionStatsData);
            }, regionTimeout);

        });
    
        describe(`SET HISTOGRAM REQUIREMENTS`, () => {
            test(`REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetHistogramRequirements, 
                    {
                        fileId: imageAssertItem.imageDataInfo.fileId,
                        regionId: imageAssertItem.region.assert.regionId,
                        histograms: [{channel: -1, numBins: -1},],
                    }
                );
                await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            }, regionTimeout);

        });

        describe("SET REGION", () => {
            let SetRegionAckTemp: CARTA.SetRegionAck;
            let SpectralProfileDataTemp: CARTA.SpectralProfileData;
            let RegionHistogramDataTemp: CARTA.RegionHistogramData;
            let RegionStatsDataTemp: CARTA.RegionStatsData;
            test(`SET_REGION_ACK, SPECTRAL_PROFILE_DATA, REGION_HISTOGRAM_DATA & REGION_STATS_DATA should arrive within ${readFileTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetRegion, 
                    {
                        fileId: imageAssertItem.region.fileId,
                        regionId: imageAssertItem.region.assert.regionId,
                        regionType: imageAssertItem.region.regionType,
                        controlPoints: imageAssertItem.region.controlPoints,
                        regionName: imageAssertItem.region.regionName,
                        rotation: 30.0,
                    }
                );
                await Utility.getEventAsync(Connection, CARTA.SetRegionAck, 
                    (SetRegionAck: CARTA.SetRegionAck, resolve) => {
                        SetRegionAckTemp = SetRegionAck;
                        resolve();
                    }
                );
                await new Promise( (resolve, reject) => 
                    Utility.getStream(Connection, 3, resolve,
                        {
                            RegionHistogramData: RegionHistogramData => {
                                RegionHistogramDataTemp = RegionHistogramData;
                            },
                            RegionStatsData: RegionStatsData => {
                                RegionStatsDataTemp = RegionStatsData;
                            },
                            SpectralProfileData: SpectralProfileData => {
                                SpectralProfileDataTemp = SpectralProfileData;
                            },
                        },
                    )
                );
  
            }, readFileTimeout);
            
            test("SET_REGION_ACK.success = true", () => {
                expect(SetRegionAckTemp.success).toBe(true);
            });

            test(`SET_REGION_ACK.region_id = ${imageAssertItem.region.assert.regionId}`, () => {
                expect(SetRegionAckTemp.regionId).toEqual(imageAssertItem.region.assert.regionId);
            });

            test(`SPECTRAL_PROFILE_DATA.region_id = ${imageAssertItem.region.assert.regionId}`, () => {
                expect(SpectralProfileDataTemp.regionId).toEqual(imageAssertItem.region.assert.regionId);
            });

            test(`SPECTRAL_PROFILE_DATA.progress = ${imageAssertItem.region.assert.progress}`, () => {
                expect(SpectralProfileDataTemp.regionId).toEqual(imageAssertItem.region.assert.progress);
            });

            test(`REGION_HISTOGRAM_DATA.region_id = ${imageAssertItem.region.assert.regionId}`, () => {
                expect(RegionHistogramDataTemp.regionId).toEqual(imageAssertItem.region.assert.regionId);
            });

            test(`REGION_HISTOGRAM_DATA.progress = ${imageAssertItem.region.assert.progress}`, () => {
                expect(RegionHistogramDataTemp.regionId).toEqual(imageAssertItem.region.assert.progress);
            });

            test(`REGION_STATS_DATA.region_id = ${imageAssertItem.region.assert.regionId}`, () => {
                expect(RegionStatsDataTemp.regionId).toEqual(imageAssertItem.region.assert.regionId);
            });

        });

    });

    afterAll( () => {
        Connection.close();
    });
});