import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
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
    precisionDigits: 2,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: [
        {
            directory: testSubdirectory,
            file: "casa_wideField.fits",
            fileId: 100,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "casa_wideField.image",
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
                controlPoints: [{ x: 300, y: 200 }, { x: 400, y: 400 }],
            },
        },
        {
            fileId: 100,
            regionId: 2,
            regionInfo: {
                regionType: 3,
                rotation: 45,
                controlPoints: [{ x: 1800, y: 700 }, { x: 1000, y: 1000 }],
            },
        },
        {
            fileId: 100,
            regionId: 3,
            regionInfo: {
                regionType: 4,
                rotation: 45,
                controlPoints: [{ x: 1800, y: 1200 }, { x: 800, y: 2000 }],
            },
        },
        {
            fileId: 100,
            regionId: 4,
            regionInfo: {
                regionType: 6,
                controlPoints: [{ x: 3500, y: 1300 }, { x: 3599, y: 1 }, { x: 2200, y: 100 }],
            },
        },
    ],
    setStatsRequirements: [
        [
            {
                fileId: 100,
                regionId: 1,
                stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
                regionId: 2,
                stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
                regionId: 3,
                stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
                regionId: 4,
                stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
        ],
        [
            {
                fileId: 101,
                regionId: 1,
                stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
                regionId: 2,
                stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
                regionId: 3,
                stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
                regionId: 4,
                stats: [0, 2, 3, 4, 5, 6, 7, 8, 9],
            },
        ],
    ]
};

describe("MATCH_STATS_WIDE: Testing region stats with spatially and spectrally matched wide field images", () => {
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
            for (const [statsIdx, statsType] of assertItem.setStatsRequirements[0][regionIdx].stats.entries()) {
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