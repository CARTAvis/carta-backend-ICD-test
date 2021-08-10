import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;
let cursorTimeout = config.timeout.cursor;
let profileTimeout = config.timeout.spectralProfile;
interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor[];
    setRegion: CARTA.ISetRegion[];
    setStatsRequirements: CARTA.ISetStatsRequirements[][];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: [
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.fits",
            fileId: 100,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.image",
            fileId: 101,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setCursor: [
        {
            fileId: 100,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 101,
            point: { x: 200.0, y: 200.0 },
        },
    ],
    setRegion: [
        {
            fileId: 100,
            regionId: 1,
            regionInfo: {
                regionType: 3,
                rotation: 0,
                controlPoints: [{ x: 250, y: 200 }, { x: 300, y: 300 }],
            },
        },
        {
            fileId: 100,
            regionId: 2,
            regionInfo: {
                regionType: 3,
                rotation: 25,
                controlPoints: [{ x: 350, y: 350 }, { x: 100, y: 150 }],
            },
        },
        {
            fileId: 100,
            regionId: 3,
            regionInfo: {
                regionType: 4,
                rotation: 25,
                controlPoints: [{ x: 150, y: 150 }, { x: 60, y: 100 }],
            },
        },
        {
            fileId: 100,
            regionId: 4,
            regionInfo: {
                regionType: 6,
                controlPoints: [{ x: 100, y: 150 }, { x: 400, y: 400 }, { x: 300, y: 30 }],
            },
        },
    ],
    setStatsRequirements: [
        [
            {
                fileId: 100,
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
                    ]}
                ],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
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
                    ]}
                ],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
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
                    ]}
                ],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
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
                    ]}
                ],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
        ],
        [
            {
                fileId: 101,
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
                    ]}
                ],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
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
                    ]}
                ],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
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
                    ]}
                ],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
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
                    ]}
                ],
                // stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
        ],
    ]
};

describe("MATCH_STATS: Testing region stats with spatially and spectrally matched images", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Prepare images`, () => {
        for (const file of assertItem.openFile) {
            test(`Should open image ${file.file} as file_id: ${file.fileId}`, async () => {
                await Connection.openFile(file);
            }, openFileTimeout);
        }
        for (const [index, cursor] of assertItem.setCursor.entries()) {
            test(`Should set cursor ${index}`, async () => {
                await Connection.send(CARTA.SetCursor, cursor);
                await Connection.receiveAny();
            }, cursorTimeout);
        }
        for (const [index, region] of assertItem.setRegion.entries()) {
            test(`Should set region ${region.regionId}`, async () => {
                await Connection.send(CARTA.SetRegion, region);
                await Connection.receiveAny();
            }, regionTimeout);
        }
    });

    describe(`Test if the stats results are equal`, () => {
        let RegionStatsData: CARTA.RegionStatsData[] = [];
        for (const [fileIdx, file] of assertItem.openFile.entries()) {
            test(`Should receive 4 RegionStatsData for file_id: ${file.fileId}`, async () => {
                for (const [statsIdx, statsReq] of assertItem.setStatsRequirements[fileIdx].entries()) {
                    await Connection.send(CARTA.SetStatsRequirements, {
                        fileId: file.fileId,
                        regionId: statsReq.regionId,
                        stats: [],
                    });
                    await Connection.send(CARTA.SetStatsRequirements, statsReq);
                    RegionStatsData.push(await Connection.receive(CARTA.RegionStatsData));
                }
            }, profileTimeout);

            test(`Assert region_id for file_id: ${file.fileId}`, () => {
                for (const [regionIdx, region] of assertItem.setRegion.entries()) {
                    expect(RegionStatsData.find(data => data.fileId == file.fileId && data.regionId == region.regionId).statistics.length).toBeGreaterThan(0);
                }
            });
        }
        for (const [regionIdx, region] of assertItem.setRegion.entries()) {
            // test(`Log statistics`, () => {
            //     console.log(RegionStatsData.find(data => data.fileId == assertItem.openFile[0].fileId && data.regionId == region.regionId).statistics);
            //     console.log(RegionStatsData.find(data => data.fileId == assertItem.openFile[1].fileId && data.regionId == region.regionId).statistics);
            // });
            for (const [statsIdx, statsType] of assertItem.setStatsRequirements[0][regionIdx].statsConfigs[0].statsTypes.entries()) {
                test(`Assert the ${CARTA.StatsType[statsType]} of region ${region.regionId} for first image equal to that for the second image`, () => {
                    const left = RegionStatsData.find(data => data.fileId == assertItem.openFile[0].fileId && data.regionId == region.regionId).statistics.find(data => data.statsType == statsType).value;
                    const right = RegionStatsData.find(data => data.fileId == assertItem.openFile[1].fileId && data.regionId == region.regionId).statistics.find(data => data.statsType == statsType).value;
                    if (isNaN(left) || isNaN(right)) {
                        expect(Object.is(left, right)).toBe(true);
                    } else {
                        expect(left).toBeCloseTo(right, assertItem.precisionDigits);
                    }
                });
            }
        }
    });

    afterAll(() => Connection.close());
});