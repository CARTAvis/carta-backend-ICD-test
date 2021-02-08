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
    ],
    setStatsRequirements: [
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
                CARTA.StatsType.Max,
                CARTA.StatsType.Extrema
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
                CARTA.StatsType.Max,
                CARTA.StatsType.Extrema
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
                CARTA.StatsType.Max,
                CARTA.StatsType.Extrema
            ],
        },
    ],
    regionStatsData: [
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
                { statsType: CARTA.StatsType.Extrema, value: 0.02505672 },
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
                { statsType: CARTA.StatsType.Extrema, value: 0.00654555 },
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
                { statsType: CARTA.StatsType.Extrema, value: NaN },
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
        });
    });

    afterAll(() => Connection.close());
});