import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setImageChannels: CARTA.ISetImageChannels;
    regionGroup: CARTA.ISetRegion[];
    setRegionAckGroup: CARTA.ISetRegionAck[];
    setStatsRequirementsGroup: CARTA.ISetStatsRequirements[];
    regionStatsDataGroup: CARTA.IRegionStatsData[];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    openFile:
        [
            {
                directory: testSubdirectory,
                file: "M17_SWex.image",
                fileId: 0,
                hdu: "",
                renderMode: CARTA.RenderMode.RASTER,
                tileSize: 256,
            },
            {
                directory: testSubdirectory,
                file: "M17_SWex.hdf5",
                fileId: 0,
                hdu: "",
                renderMode: CARTA.RenderMode.RASTER,
                tileSize: 256,
            },
        ],
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
    regionGroup: [
        {
            fileId: 0,
            regionId: -1,
            regionName: "polygon_1",
            regionType: CARTA.RegionType.POLYGON,
            controlPoints: [{ x: 155, y: 552 }, { x: 134, y: 498 }, { x: 185, y: 509 }],
            rotation: 0.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "polygon_2",
            regionType: CARTA.RegionType.POLYGON,
            controlPoints: [{ x: 116, y: 604 }, { x: 106, y: 574 }, { x: 137, y: 577 }],
            rotation: 0.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "polygon_3",
            regionType: CARTA.RegionType.POLYGON,
            controlPoints: [{ x: 556, y: 167 }, { x: 547, y: 130 }, { x: 577, y: 139 }],
            rotation: 0.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "polygon_4",
            regionType: CARTA.RegionType.POLYGON,
            controlPoints: [{ x: 65, y: 688 }, { x: 69, y: 36 }, { x: 602, y: 77 }, { x: 562, y: 735 }],
            rotation: 0.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "polygon_5",
            regionType: CARTA.RegionType.POLYGON,
            controlPoints: [{ x: 300.2, y: 300.2 }, { x: 300.2, y: 301.0 }, { x: 300.7, y: 300.2 }],
            rotation: 0.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "polygon_6",
            regionType: CARTA.RegionType.POLYGON,
            controlPoints: [{ x: 299.5, y: 300.5 }, { x: 299.5, y: 299.5 }, { x: 300.5, y: 299.5 }, { x: 300.5, y: 300.5 }],
            rotation: 0.0,
        },
    ],
    setRegionAckGroup: [
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
        {
            success: true,
            regionId: 6,
        },
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
            regionId: 5,
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
            regionId: 6,
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
                { statsType: CARTA.StatsType.NumPixels, value: 1265 },
                { statsType: CARTA.StatsType.Sum, value: 1.2024647 },
                { statsType: CARTA.StatsType.Mean, value: 0.00095056 },
                { statsType: CARTA.StatsType.RMS, value: 0.00372206 },
                { statsType: CARTA.StatsType.Sigma, value: 0.00360005 },
                { statsType: CARTA.StatsType.SumSq, value: 0.01752493 },
                { statsType: CARTA.StatsType.Min, value: -0.01051447 },
                { statsType: CARTA.StatsType.Max, value: 0.01217441 },
            ]
        },
        {
            regionId: 2,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 132 },
                { statsType: CARTA.StatsType.Sum, value: -0.09657376 },
                { statsType: CARTA.StatsType.Mean, value: -0.00073162 },
                { statsType: CARTA.StatsType.RMS, value: 0.00945348 },
                { statsType: CARTA.StatsType.Sigma, value: 0.00946103 },
                { statsType: CARTA.StatsType.SumSq, value: 0.01179662 },
                { statsType: CARTA.StatsType.Min, value: -0.01994896 },
                { statsType: CARTA.StatsType.Max, value: 0.0235076 },
            ]
        },
        {
            regionId: 3,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 0 },
                { statsType: CARTA.StatsType.Sum, value: NaN },
                { statsType: CARTA.StatsType.Mean, value: NaN },
                { statsType: CARTA.StatsType.RMS, value: NaN },
                { statsType: CARTA.StatsType.Sigma, value: NaN },
                { statsType: CARTA.StatsType.SumSq, value: NaN },
                { statsType: CARTA.StatsType.Min, value: NaN },
                { statsType: CARTA.StatsType.Max, value: NaN },
            ]
        },
        {
            regionId: 4,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 216248 },
                { statsType: CARTA.StatsType.Sum, value: -7.6253559 },
                { statsType: CARTA.StatsType.Mean, value: -3.52620875e-05 },
                { statsType: CARTA.StatsType.RMS, value: 0.00473442 },
                { statsType: CARTA.StatsType.Sigma, value: 0.0047343 },
                { statsType: CARTA.StatsType.SumSq, value: 4.84713562 },
                { statsType: CARTA.StatsType.Min, value: -0.03958673 },
                { statsType: CARTA.StatsType.Max, value: 0.04523611 },
            ]
        },
        {
            regionId: 5,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 0 },
                { statsType: CARTA.StatsType.Sum, value: NaN },
                { statsType: CARTA.StatsType.Mean, value: NaN },
                { statsType: CARTA.StatsType.RMS, value: NaN },
                { statsType: CARTA.StatsType.Sigma, value: NaN },
                { statsType: CARTA.StatsType.SumSq, value: NaN },
                { statsType: CARTA.StatsType.Min, value: NaN },
                { statsType: CARTA.StatsType.Max, value: NaN },
            ]
        },
        {
            regionId: 6,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 1 },
                { statsType: CARTA.StatsType.Sum, value: -0.00115214 },
                { statsType: CARTA.StatsType.Mean, value: -0.00115214 },
                { statsType: CARTA.StatsType.RMS, value: 0.00115214 },
                { statsType: CARTA.StatsType.Sigma, value: 0 },
                { statsType: CARTA.StatsType.SumSq, value: 1.32743435e-06 },
                { statsType: CARTA.StatsType.Min, value: -0.00115214 },
                { statsType: CARTA.StatsType.Max, value: -0.00115214 },
            ]
        },
    ],
    precisionDigits: 4,
}

describe("REGION_STATISTICS_POLYGON test: Testing statistics with polygon regions", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    assertItem.openFile.map(openFile => {
        describe(`Go to "${testSubdirectory}" folder and open image "${openFile.file}" to set image view`, () => {

            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1, });
                await Connection.send(CARTA.OpenFile, openFile);
                await Connection.receive(CARTA.OpenFileAck);
                await Connection.receive(CARTA.RegionHistogramData);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannels);
                await Connection.receive(CARTA.RasterTileData);
            });

            assertItem.regionGroup.map((region: CARTA.ISetRegion, index) => {
                if (region.regionId) {
                    describe(`${region.regionId < 0 ? "Creating" : "Modify"} ${CARTA.RegionType[region.regionType]} region #${assertItem.setRegionAckGroup[index].regionId} on ${JSON.stringify(region.controlPoints)}`, () => {
                        let SetRegionAckTemp: CARTA.SetRegionAck;
                        test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                            await Connection.send(CARTA.SetRegion, region);
                            SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck) as CARTA.SetRegionAck;
                        }, regionTimeout);

                        test(`SET_REGION_ACK.success = ${assertItem.setRegionAckGroup[index].success}`, () => {
                            expect(SetRegionAckTemp.success).toBe(assertItem.setRegionAckGroup[index].success);
                        });

                        test(`SET_REGION_ACK.region_id = ${assertItem.setRegionAckGroup[index].regionId}`, () => {
                            expect(SetRegionAckTemp.regionId).toEqual(assertItem.setRegionAckGroup[index].regionId);
                        });

                    });
                }

                describe(`SET STATS REQUIREMENTS on ${CARTA.RegionType[region.regionType]} region #${assertItem.setRegionAckGroup[index].regionId}`, () => {
                    let RegionStatsDataTemp: CARTA.RegionStatsData;
                    test(`REGION_STATS_DATA should return within ${regionTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetStatsRequirements, assertItem.setStatsRequirementsGroup[index]);
                        RegionStatsDataTemp = await Connection.receive(CARTA.RegionStatsData) as CARTA.RegionStatsData;
                    }, regionTimeout);

                    test(`REGION_STATS_DATA.region_id = ${assertItem.regionStatsDataGroup[index].regionId}`, () => {
                        expect(RegionStatsDataTemp.regionId).toEqual(assertItem.regionStatsDataGroup[index].regionId);
                    });

                    test("Assert REGION_STATS_DATA.statistics", () => {
                        assertItem.regionStatsDataGroup[index].statistics.map(stats => {
                            if (isNaN(stats.value)) {
                                expect(isNaN(RegionStatsDataTemp.statistics.find(f => f.statsType === stats.statsType).value)).toBe(true);
                            } else {
                                expect(RegionStatsDataTemp.statistics.find(f => f.statsType === stats.statsType).value).toBeCloseTo(stats.value, assertItem.precisionDigits);
                            }
                        });
                    });

                });

            });

        });
    });
    afterAll(() => Connection.close());
});