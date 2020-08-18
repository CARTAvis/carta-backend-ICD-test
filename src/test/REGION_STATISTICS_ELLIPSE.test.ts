import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setRegionGroup: CARTA.ISetRegion[];
    regionAckGroup: CARTA.ISetRegionAck[];
    setStatsRequirementsGroup: CARTA.ISetStatsRequirements[];
    regionStatsDataGroup: CARTA.IRegionStatsData[];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
        [
            {
                directory: testSubdirectory,
                file: "M17_SWex.image",
                fileId: 0,
                hdu: "0",
                renderMode: CARTA.RenderMode.RASTER,
            },
            {
                directory: testSubdirectory,
                file: "M17_SWex.hdf5",
                fileId: 0,
                hdu: "0",
                renderMode: CARTA.RenderMode.RASTER,
            },
        ],
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setRegionGroup: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "ellipse_1",
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 114, y: 545 }, { x: 4, y: 2 }],
                rotation: 0.0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "ellipse_2",
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 83, y: 489 }, { x: 4, y: 3 }],
                rotation: 30.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "ellipse_3",
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 0, y: 486 }, { x: 4, y: 3 }],
                rotation: 30.0,
            },
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
    ],
    setStatsRequirementsGroup: [
        {
            fileId: 0,
            regionId: 1,
            stats: [
                CARTA.StatsType.NumPixels,
                CARTA.StatsType.Sum,
                CARTA.StatsType.FluxDensity,
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
                CARTA.StatsType.FluxDensity,
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
                CARTA.StatsType.FluxDensity,
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
                { statsType: CARTA.StatsType.NumPixels, value: 24 },
                { statsType: CARTA.StatsType.Sum, value: 0.18536625 },
                { statsType: CARTA.StatsType.FluxDensity, value: 0.00851618 },
                { statsType: CARTA.StatsType.Mean, value: 0.00772359 },
                { statsType: CARTA.StatsType.RMS, value: 0.01397174 },
                { statsType: CARTA.StatsType.Sigma, value: 0.01189324 },
                { statsType: CARTA.StatsType.SumSq, value: 0.00468503 },
                { statsType: CARTA.StatsType.Min, value: -0.01768329 },
                { statsType: CARTA.StatsType.Max, value: 0.02505673 },
            ]
        },
        {
            regionId: 2,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 18 },
                { statsType: CARTA.StatsType.Sum, value: 0.00485459 },
                { statsType: CARTA.StatsType.FluxDensity, value: 0.00022303 },
                { statsType: CARTA.StatsType.Mean, value: 0.0002697 },
                { statsType: CARTA.StatsType.RMS, value: 0.00307906 },
                { statsType: CARTA.StatsType.Sigma, value: 0.00315614 },
                { statsType: CARTA.StatsType.SumSq, value: 0.00017065 },
                { statsType: CARTA.StatsType.Min, value: -0.00590614 },
                { statsType: CARTA.StatsType.Max, value: 0.00654556 },
            ]
        },
        {
            regionId: 3,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 0 },
                { statsType: CARTA.StatsType.Sum, value: NaN },
                { statsType: CARTA.StatsType.FluxDensity, value: NaN },
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
                { statsType: CARTA.StatsType.NumPixels, value: 0 },
                { statsType: CARTA.StatsType.Sum, value: NaN },
                { statsType: CARTA.StatsType.FluxDensity, value: NaN },
                { statsType: CARTA.StatsType.Mean, value: NaN },
                { statsType: CARTA.StatsType.RMS, value: NaN },
                { statsType: CARTA.StatsType.Sigma, value: NaN },
                { statsType: CARTA.StatsType.SumSq, value: NaN },
                { statsType: CARTA.StatsType.Min, value: NaN },
                { statsType: CARTA.StatsType.Max, value: NaN },
            ]
        },
        {
            regionId: -1,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 216248 },
                { statsType: CARTA.StatsType.Sum, value: -7.6253559 },
                { statsType: CARTA.StatsType.FluxDensity, value: -0.35032758 },
                { statsType: CARTA.StatsType.Mean, value: -3.52620875e-05 },
                { statsType: CARTA.StatsType.RMS, value: 0.00473442 },
                { statsType: CARTA.StatsType.Sigma, value: 0.0047343 },
                { statsType: CARTA.StatsType.SumSq, value: 4.84713562 },
                { statsType: CARTA.StatsType.Min, value: -0.03958673 },
                { statsType: CARTA.StatsType.Max, value: 0.04523611 },
            ]
        },
    ],
    precisionDigits: 4,
};

describe("REGION_STATISTICS_RECTANGLE test: Testing statistics with rectangle regions", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    assertItem.openFile.map(openFile => {
        describe(`Go to "${testSubdirectory}" folder and open image "${openFile.file}" to set image view`, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, connectTimeout);

            describe(`(Step 0) Initialization: the open image`, () => {
                test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.CloseFile, { fileId: 0 });
                    await Connection.send(CARTA.OpenFile, openFile);
                    await Connection.receiveAny()
                    await Connection.receiveAny() // OpenFileAck | RegionHistogramData
                }, openFileTimeout);

                let ack: AckStream;
                test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                    // await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);

                    ack = await Connection.stream(assertItem.addTilesReq.tiles.length + 3) as AckStream;
                    // console.log(ack); // RasterTileData * 1 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)
                    expect(ack.RasterTileData.length).toBe(assertItem.addTilesReq.tiles.length);
                }, readFileTimeout);

                assertItem.setRegionGroup.map((region, index) => {
                    if (region.regionId) {
                        describe(`${region.regionId < 0 ? "Creating" : "Modify"} ${CARTA.RegionType[region.regionType]} region #${assertItem.regionAckGroup[index].regionId} on ${JSON.stringify(region.controlPoints)}`, () => {
                            let SetRegionAckTemp: CARTA.SetRegionAck;
                            test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                                await Connection.send(CARTA.SetRegion, region);
                                SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck) as CARTA.SetRegionAck;
                            }, regionTimeout);

                            test(`SET_REGION_ACK.success = ${assertItem.regionAckGroup[index].success}`, () => {
                                expect(SetRegionAckTemp.success).toBe(assertItem.regionAckGroup[index].success);
                            });

                            test(`SET_REGION_ACK.region_id = ${assertItem.regionAckGroup[index].regionId}`, () => {
                                expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAckGroup[index].regionId);
                            });

                        });
                    };

                    describe(`SET STATS REQUIREMENTS on ${CARTA.RegionType[region.regionType]} region #${assertItem.regionAckGroup[index].regionId}`, () => {
                        let RegionStatsDataTemp: CARTA.RegionStatsData;
                        test(`REGION_STATS_DATA should return within ${regionTimeout} ms`, async () => {
                            await Connection.send(CARTA.SetStatsRequirements, assertItem.setStatsRequirementsGroup[index]);
                            RegionStatsDataTemp = await Connection.receive(CARTA.RegionStatsData) as CARTA.RegionStatsData;
                        }, regionTimeout);

                        test(`REGION_STATS_DATA.region_id = ${assertItem.regionStatsDataGroup[index].regionId}`, () => {
                            expect(RegionStatsDataTemp.regionId).toEqual(assertItem.regionStatsDataGroup[index].regionId);
                        });

                        test("Assert & Check REGION_STATS_DATA.statistics", () => {
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
    });

    afterAll(() => Connection.close());
});