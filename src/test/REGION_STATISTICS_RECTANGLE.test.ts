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
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 212, y: 464}, {x: 10, y: 10}],
            rotation: 0.0,
            regionName: "rectangle_1",
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
                    {statsType: CARTA.StatsType.NumPixels,  value: 121         },
                    {statsType: CARTA.StatsType.Sum,        value: 0.28389804  },
                    {statsType: CARTA.StatsType.Mean,       value: 0.00234626  },
                    {statsType: CARTA.StatsType.RMS,        value: 0.00388394  },
                    {statsType: CARTA.StatsType.Sigma,      value: 0.00310803  },
                    {statsType: CARTA.StatsType.SumSq,      value: 0.00182528  },
                    {statsType: CARTA.StatsType.Min,        value: -0.00358113 },
                    {statsType: CARTA.StatsType.Max,        value: 0.00793927  },
                ],
            },
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 103, y: 549}, {x: 5, y: 7}],
            rotation: 0.0,
            regionName: "rectangle_2",
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
                    {statsType: CARTA.StatsType.NumPixels,  value: 14           },
                    {statsType: CARTA.StatsType.Sum,        value: -0.03493149  },
                    {statsType: CARTA.StatsType.Mean,       value: -0.00249511  },
                    {statsType: CARTA.StatsType.RMS,        value: 0.00586684   },
                    {statsType: CARTA.StatsType.Sigma,      value: 0.00551027   },
                    {statsType: CARTA.StatsType.SumSq,      value: 0.00048188   },
                    {statsType: CARTA.StatsType.Min,        value: -0.0095625   },
                    {statsType: CARTA.StatsType.Max,        value: 0.00694707   },
                ],
            },
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 115, y: 544}, {x: 5, y: 7}],
            rotation: 300.0,
            regionName: "rectangle_3",
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
                    {statsType: CARTA.StatsType.NumPixels,  value: 35           },
                    {statsType: CARTA.StatsType.Sum,        value: 0.16957074   },
                    {statsType: CARTA.StatsType.Mean,       value: 0.00484488   },
                    {statsType: CARTA.StatsType.RMS,        value: 0.01209958   },
                    {statsType: CARTA.StatsType.Sigma,      value: 0.01124911   },
                    {statsType: CARTA.StatsType.SumSq,      value: 0.00512399   },
                    {statsType: CARTA.StatsType.Min,        value: -0.01768329  },
                    {statsType: CARTA.StatsType.Max,        value: 0.02505673   },
                ],
            },
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 0, y: 544}, {x: 5, y: 7}],
            rotation: 300.0,
            regionName: "rectangle_4",
            assert: {
                regionId: 4,               
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
        {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [],
            rotation: 0.0,
            regionName: "",
            assert: {
                regionId: -1,               
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
                    {statsType: CARTA.StatsType.NumPixels,  value: 216248           },
                    {statsType: CARTA.StatsType.Sum,        value: -7.6253559       },
                    {statsType: CARTA.StatsType.Mean,       value: -3.52620875e-05  },
                    {statsType: CARTA.StatsType.RMS,        value: 0.00473442       },
                    {statsType: CARTA.StatsType.Sigma,      value: 0.0047343        },
                    {statsType: CARTA.StatsType.SumSq,      value: 4.84713562       },
                    {statsType: CARTA.StatsType.Min,        value: -0.03958673      },
                    {statsType: CARTA.StatsType.Max,        value: 0.04523611       },
                ],
            },
        },
    ],
}

describe("REGION_STATISTICS_RECTANGLE test: Testing statistics with rectangle regions", () => {   
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
            await new Promise( resolve => { 
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();
                    }
                );
            });
            await done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.fileName}" to set image view`, () => {

        beforeAll( async () => {
            await Utility.setEvent(Connection, CARTA.CloseFile, 
                {
                    fileId: -1,
                }
            );
            await Utility.setEvent(Connection, CARTA.OpenFile, 
                {
                    directory: testSubdirectory, 
                    file: imageAssertItem.fileName,
                    fileId: imageAssertItem.fileId,
                    hdu: imageAssertItem.hdu,
                    renderMode: CARTA.RenderMode.RASTER,
                }
            ); 
            await new Promise( resolve => {           
                Utility.getEvent(Connection, CARTA.OpenFileAck, 
                    (OpenFileAck: CARTA.OpenFileAck) => {
                        resolve();
                    }
                );
            });
            await Utility.setEvent(Connection, CARTA.SetImageView, 
                {
                    fileId: imageAssertItem.fileId, 
                    imageBounds: imageAssertItem.imageDataInfo.imageBounds, 
                    mip: imageAssertItem.imageDataInfo.mip, 
                    compressionType: imageAssertItem.imageDataInfo.compressionType,
                    compressionQuality: imageAssertItem.imageDataInfo.compressionQuality,
                    numSubsets: imageAssertItem.imageDataInfo.numSubsets,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.RasterImageData, 
                    (RasterImageData: CARTA.RasterImageData) => {
                        resolve();
                    }
                );
            });
        });

        imageAssertItem.regionGroup.map( function( region: Region) {
            if (region.regionId) {
                describe(`${region.regionId < 0?"Creating":"Modify"} ${CARTA.RegionType[region.regionType]} region #${region.assert.regionId} on ${JSON.stringify(region.controlPoints)}`, () => {
                    let SetRegionAckTemp: CARTA.SetRegionAck;
                    test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                        await Utility.setEvent(Connection, CARTA.SetRegion, region);
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, CARTA.SetRegionAck, 
                                (SetRegionAck: CARTA.SetRegionAck) => {
                                    SetRegionAckTemp = SetRegionAck;
                                    resolve();
                                }
                            );
                        });
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
                    await Utility.setEvent(Connection, CARTA.SetStatsRequirements, 
                        {
                            fileId: imageAssertItem.fileId,
                            regionId: region.assert.regionId,
                            stats: region.stats.statsTypes,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.RegionStatsData, 
                            (RegionStatsData: CARTA.RegionStatsData) => {
                                RegionStatsDataTemp = RegionStatsData;
                                resolve();
                            }
                        );
                    });
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