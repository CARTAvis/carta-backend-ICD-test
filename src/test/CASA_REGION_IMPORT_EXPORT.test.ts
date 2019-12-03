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
    importRegion: CARTA.IImportRegion;
    importRegionAck: CARTA.IImportRegionAck;
    exportRegion: CARTA.IExportRegion[];
    exportRegionAck: CARTA.IExportRegionAck[];
    importRegion2: CARTA.IImportRegion[];
    importRegionAck2: ImportRegionAckExt[];
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
    importRegion:
    {
        groupId: 0,
        type: CARTA.FileType.CRTF,
        directory: regionSubdirectory,
        file: "M17_SWex_testRegions_pix.crtf",
        contents: [],
    },
    importRegionAck:
    {
        success: true,
        regions: [
            {
                regionId: 1,
                regionInfo: {
                    regionType: CARTA.RegionType.RECTANGLE,
                    controlPoints: [{ x: 320, y: 400 }, { x: 40, y: 100 }],
                },
            },
            {
                regionId: 2,
                regionInfo: {
                    regionType: CARTA.RegionType.RECTANGLE,
                    controlPoints: [{ x: 320, y: 400 }, { x: 100, y: 40 }],
                },
            },
            {
                regionId: 3,
                regionInfo: {
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                    controlPoints: [{ x: 320, y: 400 }, { x: 200, y: 40 }],
                },
            },
            {
                regionId: 4,
                regionInfo: {
                    regionType: CARTA.RegionType.POLYGON,
                    controlPoints: [{ x: 320, y: 400 }, { x: 320, y: 600 }, { x: 400, y: 400 }],
                },
            },
            {
                regionId: 5,
                regionInfo: {
                    regionType: CARTA.RegionType.ELLIPSE,
                    controlPoints: [{ x: 320, y: 400 }, { x: 200, y: 200 }],
                },
            },
            {
                regionId: 6,
                regionInfo: {
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                    controlPoints: [{ x: 320, y: 400 }, { x: 100, y: 20 }],
                },
            },
            {
                regionId: 7,
                regionInfo: {
                    regionType: CARTA.RegionType.POINT,
                    controlPoints: [{ x: 320, y: 300 }],
                },
            },
        ],
    },
    exportRegion:
        [
            {
                type: CARTA.FileType.CRTF,
                coordType: CARTA.CoordinateType.WORLD,
                fileId: 0,
                regionId: [1, 2, 3, 4, 5, 6, 7],
                directory: regionSubdirectory,
                file: "M17_SWex_testRegions_pix_export_to_world.crtf",
            },
            {
                type: CARTA.FileType.CRTF,
                coordType: CARTA.CoordinateType.PIXEL,
                fileId: 0,
                regionId: [1, 2, 3, 4, 5, 6, 7],
                directory: regionSubdirectory,
                file: "M17_SWex_testRegions_pix_export_to_pix.crtf",
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
    importRegion2:
        [
            {
                groupId: 0,
                type: CARTA.FileType.CRTF,
                directory: regionSubdirectory,
                file: "M17_SWex_testRegions_pix_export_to_world.crtf",
                contents: [],
            },
            {
                groupId: 0,
                type: CARTA.FileType.CRTF,
                directory: regionSubdirectory,
                file: "M17_SWex_testRegions_pix_export_to_pix.crtf",
                contents: [],
            },
        ],
    importRegionAck2:
        [
            {
                success: true,
                lengthOfRegions: 7,
                assertRegionId: {
                    index: 6,
                    id: 14,
                },
            },
            {
                success: true,
                lengthOfRegions: 7,
                assertRegionId: {
                    index: 6,
                    id: 21,
                },
            },
        ],
};

describe("CASA_REGION_IMPORT_EXPORT test: Testing import/export of CASA region format", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            await Connection.send(CARTA.OpenFile, assertItem.openFile);
            await Connection.receive(CARTA.OpenFileAck);
        });

        describe(`Import "${assertItem.importRegion.file}"`, () => {
            let importRegionAck: CARTA.ImportRegionAck;
            test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                await Connection.send(CARTA.ImportRegion, assertItem.importRegion);
                importRegionAck = await Connection.receive(CARTA.ImportRegionAck) as CARTA.ImportRegionAck;
            }, importTimeout);

            test(`IMPORT_REGION_ACK.success = ${assertItem.importRegionAck.success}`, () => {
                expect(importRegionAck.success).toBe(assertItem.importRegionAck.success);
            });

            test(`Length of IMPORT_REGION_ACK.region = ${assertItem.importRegionAck.regions.length}`, () => {
                expect(importRegionAck.regions.length).toEqual(assertItem.importRegionAck.regions.length);
            });

            assertItem.importRegionAck.regions.map((region, index) => {
                test(`IMPORT_REGION_ACK.region[${index}] = "Id:${region.regionId}, Type:${CARTA.RegionType[region.regionInfo.regionType]}"`, () => {
                    expect(importRegionAck.regions[index].regionId).toEqual(region.regionId);
                    expect(importRegionAck.regions[index].regionInfo.regionType).toEqual(region.regionInfo.regionType);
                    if (region.regionInfo.rotation)
                        expect(importRegionAck.regions[index].regionInfo.rotation).toEqual(region.regionInfo.rotation);
                    expect(importRegionAck.regions[index].regionInfo.controlPoints).toEqual(region.regionInfo.controlPoints);
                });
            });
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

        assertItem.importRegionAck2.map((Region, idxRegion) => {
            describe(`Import "${assertItem.importRegion2[idxRegion].file}"`, () => {
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