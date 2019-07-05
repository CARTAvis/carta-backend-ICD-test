import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;
interface Stats {
    coordinate: string,
    statsTypes: CARTA.StatsType[],
    statsValue: {statsType: CARTA.StatsType, value: number}[],
}
interface Region {
        regionId?: number;
        regionType: CARTA.RegionType;
        controlPoints: CARTA.IPoint[];
        rotation: number;
        regionName: string;
        assert: {
            regionId: number,
        };
        stats: Stats;
}
interface ImageAssertItem {
    fileId: number;
    fileName: string;
    hdu: string;
    imageDataInfo: {
        compressionQuality: number;
        imageBounds: CARTA.IImageBounds;
        compressionType: CARTA.CompressionType;
        mip: number;
        numSubsets: number;
    }
    precisionDigits: number;
    regionGroup: Region[];
}
let imageAssertItem: ImageAssertItem = {
    fileId: 0,
    fileName: "M17_SWex.image",
    hdu: "",
    imageDataInfo: {
        compressionQuality: 11,
        imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
        compressionType: CARTA.CompressionType.ZFP,
        mip: 2,
        numSubsets: 4,
    },
    precisionDigits: 4,
    regionGroup: [
        {
            regionId: -1,
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{x: 114, y: 545}, {x: 4, y: 2}],
            rotation: 0.0,
            regionName: "ellipse_1",
            assert: {
                regionId: 1,               
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
                statsValue: [
                    {statsType: CARTA.StatsType.NumPixels,  value:  24         },
                    {statsType: CARTA.StatsType.Sum,        value:  0.18536625 },
                    {statsType: CARTA.StatsType.Mean,       value:  0.00772359 },
                    {statsType: CARTA.StatsType.RMS,        value:  0.01397174 },
                    {statsType: CARTA.StatsType.Sigma,      value:  0.01189324 },
                    {statsType: CARTA.StatsType.SumSq,      value:  0.00468503 },
                    {statsType: CARTA.StatsType.Min,        value: -0.01768329 },
                    {statsType: CARTA.StatsType.Max,        value:  0.02505673 },
                ],
            },
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{x: 83, y: 489}, {x: 4, y: 3}],
            rotation: 30.0,
            regionName: "ellipse_2",
            assert: {
                regionId: 2,               
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
                statsValue: [
                    {statsType: CARTA.StatsType.NumPixels,  value: 18           },
                    {statsType: CARTA.StatsType.Sum,        value: 0.00485459   },
                    {statsType: CARTA.StatsType.Mean,       value: 0.0002697    },
                    {statsType: CARTA.StatsType.RMS,        value: 0.00307906   },
                    {statsType: CARTA.StatsType.Sigma,      value: 0.00315614   },
                    {statsType: CARTA.StatsType.SumSq,      value: 0.00017065   },
                    {statsType: CARTA.StatsType.Min,        value: -0.00590614  },
                    {statsType: CARTA.StatsType.Max,        value: 0.00654556   },
                ],
            },
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{x: 0, y: 486}, {x: 4, y: 3}],
            rotation: 30.0,
            regionName: "ellipse_3",
            assert: {
                regionId: 3,               
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
                statsValue: [
                    {statsType: CARTA.StatsType.NumPixels,  value: 0    },
                    {statsType: CARTA.StatsType.Sum,        value: NaN  },
                    {statsType: CARTA.StatsType.Mean,       value: NaN  },
                    {statsType: CARTA.StatsType.RMS,        value: NaN  },
                    {statsType: CARTA.StatsType.Sigma,      value: NaN  },
                    {statsType: CARTA.StatsType.SumSq,      value: NaN  },
                    {statsType: CARTA.StatsType.Min,        value: NaN  },
                    {statsType: CARTA.StatsType.Max,        value: NaN  },
                ],
            },
        },
    ],
}

describe("REGION_STATISTICS_ELLIPSE test: Testing statistics with ellipse regions", () => {   
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
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.fileName}" to set image view`, () => {

        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1,});
            await Utility.setEvent(Connection, CARTA.OpenFile, 
                {
                    directory: testSubdirectory, 
                    file: imageAssertItem.fileName,
                    fileId: imageAssertItem.fileId,
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
        });

        imageAssertItem.regionGroup.map( function( region: Region) {
            if (region.regionId) {
                describe(`${region.regionId < 0?"Creating":"Modify"} ${CARTA.RegionType[region.regionType]} region #${region.assert.regionId} on ${JSON.stringify(region.controlPoints)}`, () => {
                    let SetRegionAckTemp: CARTA.SetRegionAck;
                    test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                        await Utility.setEventAsync(Connection, CARTA.SetRegion, region);
                        await Utility.getEventAsync(Connection, CARTA.SetRegionAck,  
                            (SetRegionAck: CARTA.SetRegionAck, resolve) => {
                                SetRegionAckTemp = SetRegionAck;
                                resolve();
                            }
                        );
                    }, regionTimeout);

                    test("SET_REGION_ACK.success = True", () => {
                        expect(SetRegionAckTemp.success).toBe(true);
                    });

                    test(`SET_REGION_ACK.region_id = ${region.assert.regionId}`, () => {
                        expect(SetRegionAckTemp.regionId).toEqual(region.assert.regionId);
                    });

                });
            }
            
            describe(`SET STATS REQUIREMENTS on ${CARTA.RegionType[region.regionType]} region #${region.assert.regionId}`, () => {
                let RegionStatsDataTemp: CARTA.RegionStatsData;
                test(`REGION_STATS_DATA should return within ${regionTimeout} ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.SetStatsRequirements, 
                        {
                            fileId: imageAssertItem.fileId,
                            regionId: region.assert.regionId,
                            stats: region.stats.statsTypes,
                        }
                    );
                    await Utility.getEventAsync(Connection, CARTA.RegionStatsData,  
                        (RegionStatsData: CARTA.RegionStatsData, resolve) => {
                            RegionStatsDataTemp = RegionStatsData;
                            resolve();
                        }
                    );
                }, regionTimeout);
                
                test(`REGION_STATS_DATA.region_id = ${region.assert.regionId}`, () => {
                    expect(RegionStatsDataTemp.regionId).toEqual(region.assert.regionId);
                });

                test("Assert REGION_STATS_DATA.statistics", () => {
                    region.stats.statsValue.map(stats => {
                        if (isNaN(stats.value)) {
                            expect(isNaN(RegionStatsDataTemp.statistics.find( f => f.statsType === stats.statsType).value)).toBe(true);
                        } else {
                            expect(RegionStatsDataTemp.statistics.find( f => f.statsType === stats.statsType).value).toBeCloseTo(stats.value, imageAssertItem.precisionDigits);
                        }
                    });
                });

            });

        });

    });

    afterAll( () => {
        Connection.close();
    });
});