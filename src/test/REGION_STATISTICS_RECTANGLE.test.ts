import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck[];
    setStatsRequirements: CARTA.ISetStatsRequirements[];
    regionStatsData: CARTA.IRegionStatsData[];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    registerViewer: {
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
    addRequiredTiles: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "rectangle_1",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 212, y: 464 }, { x: 10, y: 10 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "rectangle_2",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 103, y: 549 }, { x: 5, y: 7 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "rectangle_3",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 115, y: 544 }, { x: 5, y: 7 }],
                rotation: 300.0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                // regionName: "rectangle_4",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 0, y: 544 }, { x: 5, y: 7 }],
                rotation: 300.0,
            }
        },
    ],
    regionAck: [
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
    ],
    setStatsRequirements: [
        {
            fileId: 0,
            regionId: 1,
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
        {
            fileId: 0,
            regionId: 2,
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
        {
            fileId: 0,
            regionId: 3,
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
        {
            fileId: 0,
            regionId: 4,
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
        {
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
    ],
    regionStatsData: [
        {
            regionId: 1,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 121 },
                { statsType: CARTA.StatsType.Sum, value: 0.28389804 },
                { statsType: CARTA.StatsType.FluxDensity, value: 0.01304297 },
                { statsType: CARTA.StatsType.Mean, value: 0.00234626 },
                { statsType: CARTA.StatsType.RMS, value: 0.00388394 },
                { statsType: CARTA.StatsType.Sigma, value: 0.00310803 },
                { statsType: CARTA.StatsType.SumSq, value: 0.00182528 },
                { statsType: CARTA.StatsType.Min, value: -0.00358113 },
                { statsType: CARTA.StatsType.Max, value: 0.00793927 },
                { statsType: CARTA.StatsType.Extrema, value: 0.00793926 },
            ]
        },
        {
            regionId: 2,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 14 },
                { statsType: CARTA.StatsType.Sum, value: -0.03493149 },
                { statsType: CARTA.StatsType.FluxDensity, value: -0.00160484 },
                { statsType: CARTA.StatsType.Mean, value: -0.00249511 },
                { statsType: CARTA.StatsType.RMS, value: 0.00586684 },
                { statsType: CARTA.StatsType.Sigma, value: 0.00551027 },
                { statsType: CARTA.StatsType.SumSq, value: 0.00048188 },
                { statsType: CARTA.StatsType.Min, value: -0.0095625 },
                { statsType: CARTA.StatsType.Max, value: 0.00694707 },
                { statsType: CARTA.StatsType.Extrema, value: -0.00956249 },
            ]
        },
        {
            regionId: 3,
            statistics: [
                { statsType: CARTA.StatsType.NumPixels, value: 35 },
                { statsType: CARTA.StatsType.Sum, value: 0.16957074 },
                { statsType: CARTA.StatsType.FluxDensity, value: 0.0077905 },
                { statsType: CARTA.StatsType.Mean, value: 0.00484488 },
                { statsType: CARTA.StatsType.RMS, value: 0.01209958 },
                { statsType: CARTA.StatsType.Sigma, value: 0.01124911 },
                { statsType: CARTA.StatsType.SumSq, value: 0.00512399 },
                { statsType: CARTA.StatsType.Min, value: -0.01768329 },
                { statsType: CARTA.StatsType.Max, value: 0.02505673 },
                { statsType: CARTA.StatsType.Extrema, value: 0.02505672 },
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
                { statsType: CARTA.StatsType.Extrema, value: NaN },
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
                { statsType: CARTA.StatsType.Extrema, value: 0.04523611 },
            ]
        },
    ],
    precisionDigits: 4,
};

describe("REGION_STATISTICS_RECTANGLE: Testing statistics with rectangle regions", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    assertItem.openFile.map(openFile => {
        describe(`Open image "${openFile.file}" to set image view`, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, connectTimeout);

            let ack: AckStream;
            test(`Prepare`, async () => {
                await Connection.openFile(openFile);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles);
                ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                expect(ack.RasterTileData.length).toBe(assertItem.addRequiredTiles.tiles.length);
            }, readFileTimeout);

            assertItem.setRegion.map((region, index) => {
                if (region.regionId) {
                    describe(`${region.regionId < 0 ? "Creating" : "Modify"} ${CARTA.RegionType[region.regionInfo.regionType]} region #${assertItem.regionAck[index].regionId} on ${JSON.stringify(region.regionInfo.controlPoints)}`, () => {
                        let SetRegionAck: CARTA.SetRegionAck;
                        test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                            await Connection.send(CARTA.SetRegion, region);
                            SetRegionAck = await Connection.receive(CARTA.SetRegionAck);
                        }, regionTimeout);

                        test(`SET_REGION_ACK.success = ${assertItem.regionAck[index].success}`, () => {
                            expect(SetRegionAck.success).toBe(assertItem.regionAck[index].success);
                        });

                        test(`SET_REGION_ACK.region_id = ${assertItem.regionAck[index].regionId}`, () => {
                            expect(SetRegionAck.regionId).toEqual(assertItem.regionAck[index].regionId);
                        });

                    });
                };

                describe(`SET STATS REQUIREMENTS on ${CARTA.RegionType[region.regionInfo.regionType]} region #${assertItem.regionAck[index].regionId}`, () => {
                    let RegionStatsData: CARTA.RegionStatsData;
                    test(`REGION_STATS_DATA should return within ${regionTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetStatsRequirements, assertItem.setStatsRequirements[index]);
                        RegionStatsData = await Connection.receive(CARTA.RegionStatsData);
                    }, regionTimeout);

                    test(`REGION_STATS_DATA.region_id = ${assertItem.regionStatsData[index].regionId}`, () => {
                        expect(RegionStatsData.regionId).toEqual(assertItem.regionStatsData[index].regionId);
                    });

                    test("Assert & Check REGION_STATS_DATA.statistics", () => {
                        assertItem.regionStatsData[index].statistics.map(stats => {
                            if (isNaN(stats.value)) {
                                expect(isNaN(RegionStatsData.statistics.find(f => f.statsType === stats.statsType).value)).toBe(true);
                            } else {
                                expect(RegionStatsData.statistics.find(f => f.statsType === stats.statsType).value).toBeCloseTo(stats.value, assertItem.precisionDigits);
                            }
                        });
                    });
                });
            });
            describe(`SET STATS REQUIREMENTS on region #-1`, () => {
                let RegionStatsData: CARTA.RegionStatsData;
                test(`REGION_STATS_DATA should return within ${regionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetStatsRequirements, assertItem.setStatsRequirements[4]);
                    RegionStatsData = await Connection.receive(CARTA.RegionStatsData);
                }, regionTimeout);

                test(`REGION_STATS_DATA.region_id = ${assertItem.regionStatsData[4].regionId}`, () => {
                    expect(RegionStatsData.regionId).toEqual(assertItem.regionStatsData[4].regionId);
                });

                test("Assert & Check REGION_STATS_DATA.statistics", () => {
                    assertItem.regionStatsData[4].statistics.map(stats => {
                        if (isNaN(stats.value)) {
                            expect(isNaN(RegionStatsData.statistics.find(f => f.statsType === stats.statsType).value)).toBe(true);
                        } else {
                            expect(RegionStatsData.statistics.find(f => f.statsType === stats.statsType).value).toBeCloseTo(stats.value, assertItem.precisionDigits);
                        }
                    });
                });
            });
        });
    });
    afterAll(() => Connection.close());
});