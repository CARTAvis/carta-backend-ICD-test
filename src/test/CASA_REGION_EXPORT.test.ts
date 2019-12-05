import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;
let exportTimeout = config.timeout.export;

interface ImportRegionAckExt extends CARTA.IImportRegionAck {
    lengthOfRegions?: number;
    assertRegionId?: {
        index: number,
        id: number,
    };
};
interface AssertItem {
    register: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    precisionDigits: number;
    setRegion: CARTA.ISetRegion[];
    exportRegion: CARTA.IExportRegion[];
    exportRegionAck: CARTA.IExportRegionAck[];
    importRegion: CARTA.IImportRegion[];
    importRegionAck: ImportRegionAckExt[];
};
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
        tileSize: 256,
    },
    precisionDigits: 4,
    setRegion:
        [
            {
                fileId: 0,
                regionId: -1,   // 1
                regionName: "",
                regionType: CARTA.RegionType.POINT,
                rotation: 0,
                controlPoints: [{ x: -109.579, y: 618.563 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 2
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                rotation: 0,
                controlPoints: [{ x: -114.748, y: 508.708 }, { x: 90.468, y: 90.468 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 3
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                rotation: 0,
                controlPoints: [{ x: -114.748, y: 332.941 }, { x: 170.597, y: 64.620 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 4
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                rotation: 45,
                controlPoints: [{ x: -126.380, y: 167.512 }, { x: 149.919, y: 38.772 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 5
                regionName: "",
                regionType: CARTA.RegionType.ELLIPSE,
                rotation: 0,
                controlPoints: [{ x: 758.918, y: 634.071 }, { x: 62.035, y: 62.035 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 6
                regionName: "",
                regionType: CARTA.RegionType.ELLIPSE,
                rotation: 0,
                controlPoints: [{ x: 751.163, y: 444.088 }, { x: 29.725, y: 93.053 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 7
                regionName: "",
                regionType: CARTA.RegionType.ELLIPSE,
                rotation: 45,
                controlPoints: [{ x: 749.871, y: 290.291 }, { x: 25.848, y: 84.006 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 8
                regionName: "",
                regionType: CARTA.RegionType.POLYGON,
                rotation: 0,
                controlPoints: [{ x: 757.626, y: 184.314 }, { x: 698.175, y: 66.7051 }, { x: 831.293, y: 106.769 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 9
                regionName: "",
                regionType: CARTA.RegionType.POINT,
                rotation: 0,
                controlPoints: [{ x: 199.306, y: 565.574 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 10
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                rotation: 0,
                controlPoints: [{ x: 192.844, y: 473.813 }, { x: 67.205, y: 67.205 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 11
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                rotation: 0,
                controlPoints: [{ x: 174.750, y: 360.081 }, { x: 118.901, y: 46.526 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 12
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                rotation: 45,
                controlPoints: [{ x: 204.475, y: 254.104 }, { x: 121.486, y: 46.526 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 13
                regionName: "",
                regionType: CARTA.RegionType.ELLIPSE,
                rotation: 0,
                controlPoints: [{ x: 415.138, y: 553.942 }, { x: 45.234, y: 45.234 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 14
                regionName: "",
                regionType: CARTA.RegionType.ELLIPSE,
                rotation: 0,
                controlPoints: [{ x: 406.091, y: 423.409 }, { x: 20.678, y: 68.497 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 15
                regionName: "",
                regionType: CARTA.RegionType.ELLIPSE,
                rotation: 45,
                controlPoints: [{ x: 399.629, y: 331.648 }, { x: 19.386, y: 71.082 }],
            },
            {
                fileId: 0,
                regionId: -1,   // 16
                regionName: "",
                regionType: CARTA.RegionType.POLYGON,
                rotation: 0,
                controlPoints: [{ x: 416.430, y: 229.548 }, { x: 335.008, y: 92.553 }, { x: 513.361, y: 135.202 }],
            },
        ],
    exportRegion:
        [
            {
                type: CARTA.FileType.CRTF,
                coordType: CARTA.CoordinateType.WORLD,
                fileId: 0,
                regionId: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                directory: regionSubdirectory,
                file: "M17_SWex_handMadeRegions_world.crtf",
            },
            {
                type: CARTA.FileType.CRTF,
                coordType: CARTA.CoordinateType.PIXEL,
                fileId: 0,
                regionId: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                directory: regionSubdirectory,
                file: "M17_SWex_handMadeRegions_pix.crtf",
            },
        ],
    exportRegionAck:
        [
            {
                success: true,
                contents: [""],
            },
            {
                success: true,
                contents: [""],
            },
        ],
    importRegion:
        [
            {
                groupId: 0,
                type: CARTA.FileType.CRTF,
                directory: regionSubdirectory,
                file: "M17_SWex_handMadeRegions_world.crtf",
                contents: [],
            },
            {
                groupId: 0,
                type: CARTA.FileType.CRTF,
                directory: regionSubdirectory,
                file: "M17_SWex_handMadeRegions_pix.crtf",
                contents: [],
            },
        ],
    importRegionAck:
        [
            {
                success: true,
                lengthOfRegions: 16,
                assertRegionId: {
                    index: 15,
                    id: 32,
                },
            },
            {
                success: true,
                lengthOfRegions: 16,
                assertRegionId: {
                    index: 15,
                    id: 48,
                },
            },
        ],
};

describe("CASA_REGION_EXPORT test: Testing export of CASA region to a file", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file} and set regions"`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            await Connection.send(CARTA.OpenFile, assertItem.openFile);
            await Connection.receiveAny();
            await Connection.receiveAny(); // OpenFileAck | RegionHistogramData
            for (let region of assertItem.setRegion) {
                await Connection.send(CARTA.SetRegion, region);
                await Connection.receive(CARTA.SetRegionAck);
            }
        });

        assertItem.exportRegionAck.map((exRegion, idxRegion) => {
            describe(`Export "${assertItem.exportRegion[idxRegion].file}"`, () => {
                let exportRegionAck: CARTA.ExportRegionAck;
                test(`EXPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                    await Connection.send(CARTA.ExportRegion, assertItem.exportRegion[idxRegion]);
                    exportRegionAck = await Connection.receive(CARTA.ExportRegionAck) as CARTA.ExportRegionAck;
                }, exportTimeout);

                test(`EXPORT_REGION_ACK.success = ${exRegion.success}`, () => {
                    expect(exportRegionAck.success).toBe(exRegion.success);
                });

                test(`EXPORT_REGION_ACK.contents = ${JSON.stringify(exRegion.contents)}`, () => {
                    expect(exportRegionAck.contents).toEqual(exRegion.contents);
                });
            });
        });

        assertItem.importRegionAck.map((Region, idxRegion) => {
            describe(`Import "${assertItem.importRegion[idxRegion].file}"`, () => {
                let importRegionAck: CARTA.ImportRegionAck;
                test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                    await Connection.send(CARTA.ImportRegion, assertItem.exportRegion[idxRegion]);
                    importRegionAck = await Connection.receive(CARTA.ImportRegionAck) as CARTA.ImportRegionAck;
                }, importTimeout);

                test(`IMPORT_REGION_ACK.success = ${Region.success}`, () => {
                    expect(importRegionAck.success).toBe(Region.success);
                });

                test(`Length of IMPORT_REGION_ACK.regions = ${Region.lengthOfRegions}`, () => {
                    expect(importRegionAck.regions.length).toEqual(Region.lengthOfRegions);
                });

                test(`IMPORT_REGION_ACK.regions[${Region.assertRegionId.index}].region_id = ${Region.assertRegionId.id}`, () => {
                    expect(importRegionAck.regions[Region.assertRegionId.index].regionId).toEqual(Region.assertRegionId.id);
                });
            });
        });

    });

    afterAll(() => Connection.close());
});