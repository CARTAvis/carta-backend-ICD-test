import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    setImageChannels: CARTA.ISetImageChannels;
    setRegionGroup: CARTA.ISetRegion[];
    regionAckGroup: CARTA.ISetRegionAck[];
    setStatsRequirementsGroup: CARTA.ISetStatsRequirements[];
    regionStatsDataGroup: CARTA.IRegionStatsData[];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0, 
        apiKey: "",
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory, 
        file: "M17_SWex.image",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
        tileSize: 256,
    },
    setImageChannels: {
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
    setRegionGroup: [
        {
            fileId: 0,
            regionId: -1,
            regionName: "rectangle_1",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 212, y: 464}, {x: 10, y: 10}],
            rotation: 0.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "rectangle_2",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 103, y: 549}, {x: 5, y: 7}],
            rotation: 0.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "rectangle_3",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 115, y: 544}, {x: 5, y: 7}],
            rotation: 300.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "rectangle_4",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 0, y: 544}, {x: 5, y: 7}],
            rotation: 300.0,
        },
        {
            fileId: 0,
        },
    ],
    regionAckGroup: [
        {
            success: true,
            regionId: 1,
        },
        {
            success: true,
            regionId: 2,
        },
        {
            success: true,
            regionId: 3,
        },
        {
            success: true,
            regionId: 4,
        },
        {
            success: true,
            regionId: 5,
        },
        {},
    ],
    setStatsRequirementsGroup: [
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
        {
            fileId: 0,
            regionId: 2,
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
        {
            fileId: 0,
            regionId: 3,
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
        {
            fileId: 0,
            regionId: 4,
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
        {
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
    ],
    regionStatsDataGroup: [
        {
            regionId: 1,
            statistics: [
                {statsType: CARTA.StatsType.NumPixels,  value: 121         },
                {statsType: CARTA.StatsType.Sum,        value: 0.28389804  },
                {statsType: CARTA.StatsType.Mean,       value: 0.00234626  },
                {statsType: CARTA.StatsType.RMS,        value: 0.00388394  },
                {statsType: CARTA.StatsType.Sigma,      value: 0.00310803  },
                {statsType: CARTA.StatsType.SumSq,      value: 0.00182528  },
                {statsType: CARTA.StatsType.Min,        value: -0.00358113 },
                {statsType: CARTA.StatsType.Max,        value: 0.00793927  },
            ]
        },
        {
            regionId: 2,
            statistics: [
                {statsType: CARTA.StatsType.NumPixels,  value: 14          },
                {statsType: CARTA.StatsType.Sum,        value: -0.03493149 },
                {statsType: CARTA.StatsType.Mean,       value: -0.00249511 },
                {statsType: CARTA.StatsType.RMS,        value: 0.00586684  },
                {statsType: CARTA.StatsType.Sigma,      value: 0.00551027  },
                {statsType: CARTA.StatsType.SumSq,      value: 0.00048188  },
                {statsType: CARTA.StatsType.Min,        value: -0.0095625  },
                {statsType: CARTA.StatsType.Max,        value: 0.00694707  },
            ]
        },
        {
            regionId: 3,
            statistics: [
                {statsType: CARTA.StatsType.NumPixels,  value: 35          },
                {statsType: CARTA.StatsType.Sum,        value: 0.16957074  },
                {statsType: CARTA.StatsType.Mean,       value: 0.00484488  },
                {statsType: CARTA.StatsType.RMS,        value: 0.01209958  },
                {statsType: CARTA.StatsType.Sigma,      value: 0.01124911  },
                {statsType: CARTA.StatsType.SumSq,      value: 0.00512399  },
                {statsType: CARTA.StatsType.Min,        value: -0.01768329 },
                {statsType: CARTA.StatsType.Max,        value: 0.02505673  },
            ]
        },
        {
            regionId: 4,
            statistics: [
                {statsType: CARTA.StatsType.NumPixels,  value: 0   },
                {statsType: CARTA.StatsType.Sum,        value: NaN },
                {statsType: CARTA.StatsType.Mean,       value: NaN },
                {statsType: CARTA.StatsType.RMS,        value: NaN },
                {statsType: CARTA.StatsType.Sigma,      value: NaN },
                {statsType: CARTA.StatsType.SumSq,      value: NaN },
                {statsType: CARTA.StatsType.Min,        value: NaN },
                {statsType: CARTA.StatsType.Max,        value: NaN },
            ]
        },
        {
            regionId: -1,
            statistics: [
                {statsType: CARTA.StatsType.NumPixels,  value: 216248          },
                {statsType: CARTA.StatsType.Sum,        value: -7.6253559      },
                {statsType: CARTA.StatsType.Mean,       value: -3.52620875e-05 },
                {statsType: CARTA.StatsType.RMS,        value: 0.00473442      },
                {statsType: CARTA.StatsType.Sigma,      value: 0.0047343       },
                {statsType: CARTA.StatsType.SumSq,      value: 4.84713562      },
                {statsType: CARTA.StatsType.Min,        value: -0.03958673     },
                {statsType: CARTA.StatsType.Max,        value: 0.04523611      },
            ]
        },
    ],
    precisionDigits: 4,
}

describe("REGION_STATISTICS_RECTANGLE test: Testing statistics with rectangle regions", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.registerViewer);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}" to set image view`, () => {

        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1,});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, assertItem.openFile); 
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannels);
            await Utility.getEventAsync(Connection, CARTA.RasterTileData);
        });

        assertItem.setRegionGroup.map( (region, index) => {
            if (region.regionId) {
                describe(`${region.regionId < 0?"Creating":"Modify"} ${CARTA.RegionType[region.regionType]} region #${assertItem.regionAckGroup[index].regionId} on ${JSON.stringify(region.controlPoints)}`, () => {
                    let SetRegionAckTemp: CARTA.SetRegionAck;
                    test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                        await Utility.setEventAsync(Connection, CARTA.SetRegion, region);
                        SetRegionAckTemp = <CARTA.SetRegionAck> await Utility.getEventAsync(Connection, CARTA.SetRegionAck);
                    }, regionTimeout);

                    test("SET_REGION_ACK.success = True", () => {
                        expect(SetRegionAckTemp.success).toBe(true);
                    });

                    test(`SET_REGION_ACK.region_id = ${assertItem.regionAckGroup[index].regionId}`, () => {
                        expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAckGroup[index].regionId);
                    });

                });
            }
            
            describe(`SET STATS REQUIREMENTS on ${CARTA.RegionType[region.regionType]} region #${assertItem.regionAckGroup[index].regionId}`, () => {
                let RegionStatsDataTemp: CARTA.RegionStatsData;
                test(`REGION_STATS_DATA should return within ${regionTimeout} ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.SetStatsRequirements, assertItem.setStatsRequirementsGroup[index]);
                    RegionStatsDataTemp = <CARTA.RegionStatsData> await Utility.getEventAsync(Connection, CARTA.RegionStatsData);
                }, regionTimeout);
                
                test(`REGION_STATS_DATA.region_id = ${assertItem.regionStatsDataGroup[index].regionId}`, () => {
                    expect(RegionStatsDataTemp.regionId).toEqual(assertItem.regionStatsDataGroup[index].regionId);
                });

                test("Assert REGION_STATS_DATA.statistics", () => {
                    assertItem.regionStatsDataGroup[index].statistics.map(stats => {
                        if (isNaN(stats.value)) {
                            expect(isNaN(RegionStatsDataTemp.statistics.find( f => f.statsType === stats.statsType).value)).toBe(true);
                        } else {
                            expect(RegionStatsDataTemp.statistics.find( f => f.statsType === stats.statsType).value).toBeCloseTo(stats.value, assertItem.precisionDigits);
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