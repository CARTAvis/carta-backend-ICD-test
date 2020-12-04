import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
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
    precisionDigits: 3,
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
                controlPoints: [{ x: 200, y: 200 }, { x: 100, y: 100 }],
            },
        },
        {
            fileId: 100,
            regionId: 2,
            regionInfo: {
                regionType: 3,
                rotation: 30,
                controlPoints: [{ x: 100, y: 100 }, { x: 150, y: 150 }],
            },
        },
        {
            fileId: 100,
            regionId: 3,
            regionInfo: {
                regionType: 4,
                rotation: 45,
                controlPoints: [{ x: 150, y: 150 }, { x: 10, y: 100 }],
            },
        },
        {
            fileId: 100,
            regionId: 4,
            regionInfo: {
                regionType: 6,
                controlPoints: [{ x: 100, y: 350 }, { x: 200, y: 350 }, { x: 100, y: 250 }],
            },
        },
    ],
    setStatsRequirements: [
        [
            {
                fileId: 100,
                regionId: 1,
                stats: [2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
                regionId: 2,
                stats: [2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
                regionId: 3,
                stats: [2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 100,
                regionId: 4,
                stats: [2, 3, 4, 5, 6, 7, 8, 9],
            },
        ],
        [
            {
                fileId: 101,
                regionId: 1,
                stats: [2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
                regionId: 2,
                stats: [2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
                regionId: 3,
                stats: [2, 3, 4, 5, 6, 7, 8, 9],
            },
            {
                fileId: 101,
                regionId: 4,
                stats: [2, 3, 4, 5, 6, 7, 8, 9],
            },
        ],
    ]
};

describe("MATCH_STATS: Testing region stats result as matching multiple images", () => {
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
            test(`Should set region ${index}`, async () => {
                await Connection.send(CARTA.SetRegion, region);
                await Connection.receiveAny();
            }, regionTimeout);
        }
    });

    describe(`Test if the stats results are equal`, () => {
        let RegionStatsData: CARTA.RegionStatsData[][] = [];
        for (const [fileIdx, file] of assertItem.openFile.entries()) {
            test(`Should receive 4 RegionStatsData for file_id: ${file.fileId}`, async () => {
                for (const [statsIdx, statsReq] of assertItem.setStatsRequirements[fileIdx].entries()) {
                    await Connection.send(CARTA.SetStatsRequirements, statsReq);
                }
                let ack = await Connection.streamUntil(
                    (type, data, ack: AckStream) => ack.RegionStatsData.length == 4
                );
                RegionStatsData.push(ack.RegionStatsData);
            }, profileTimeout);

            test(`Assert region_id for file_id: ${file.fileId}`, () => {
                for (const [regionIdx, region] of assertItem.setRegion.entries()) {
                    expect(RegionStatsData[fileIdx][regionIdx].regionId).toEqual(region.regionId);
                }
            });
        }

        for (const [regionIdx, region] of assertItem.setRegion.entries()) {
            for (const [statsIdx, statsType] of assertItem.setStatsRequirements[0][regionIdx].stats.entries()) {
                test(`Assert the ${CARTA.StatsType[statsType]} of region ${region.regionId} for first image equal to that for the second image`, () => {
                    expect(RegionStatsData[0][regionIdx].statistics[statsIdx].value).toBeCloseTo(RegionStatsData[1][regionIdx].statistics[statsIdx].value, assertItem.precisionDigits);
                });
            }
        }
    });

    afterAll(() => Connection.close());
});