import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

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
                file: "M17_SWex.fits",
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
                // regionName: "polygon_1",
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 155, y: 552 }, { x: 134, y: 498 }, { x: 185, y: 509 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "polygon_2",
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 116, y: 604 }, { x: 106, y: 574 }, { x: 137, y: 577 }],
                rotation: 0.0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "polygon_3",
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 556, y: 167 }, { x: 547, y: 130 }, { x: 577, y: 139 }],
                rotation: 0.0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "polygon_4",
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 65, y: 688 }, { x: 69, y: 36 }, { x: 602, y: 77 }, { x: 562, y: 735 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "polygon_5",
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 300.2, y: 300.2 }, { x: 300.2, y: 301.0 }, { x: 300.7, y: 300.2 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "polygon_6",
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 299.5, y: 300.5 }, { x: 299.5, y: 299.5 }, { x: 300.5, y: 299.5 }, { x: 300.5, y: 300.5 }],
                rotation: 0.0,
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
        {
            fileId: 0,
            regionId: 4,
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
            regionId: 5,
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
            regionId: 6,
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
                { statsType: CARTA.StatsType.NumPixels, value: 1265 },
                { statsType: CARTA.StatsType.Sum, value: 1.2024647 },
                { statsType: CARTA.StatsType.FluxDensity, value: 0.05524418 },
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
                { statsType: CARTA.StatsType.FluxDensity, value: -0.00443684 },
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
        {
            regionId: 5,
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
            regionId: 6,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 1 },
                { statsType: CARTA.StatsType.Sum, value: -0.00115214 },
                { statsType: CARTA.StatsType.FluxDensity, value: -5.29322955e-05 },
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
