import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;
let exportTimeout = config.timeout.export;

interface ImportRegionAckExt extends CARTA.IImportRegionAck{
    lengthOfRegions?: number;
    assertRegionId?: {
        index: number,
        id: number,
    };
};
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
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
    registerViewer: {
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
                    rotation: 0,
                    controlPoints: [{x: 320, y: 400}, {x: 40, y: 100}],
                },
            },
            {
                regionId: 2, 
                regionInfo: {
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                    controlPoints: [{x: 320, y: 400}, {x: 100, y: 40}],
                },
            },
            {
                regionId: 3, 
                regionInfo: {
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                    controlPoints: [{x: 320, y: 400}, {x: 200, y: 40}],
                },
            },
            {
                regionId: 4, 
                regionInfo: {
                    regionType: CARTA.RegionType.POLYGON,
                    controlPoints: [{x: 320, y: 400}, {x: 320, y: 600}, {x: 400, y: 400}],
                },
            },
            {
                regionId: 5, 
                regionInfo: {
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                    controlPoints: [{x: 320, y: 400}, {x: 200, y: 200}],
                },
            },
            {
                regionId: 6, 
                regionInfo: {
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                    controlPoints: [{x: 320, y: 400}, {x: 100, y: 20}],
                },
            },
            {
                regionId: 7, 
                regionInfo: {
                    regionType: CARTA.RegionType.POINT,
                    controlPoints: [{x: 320, y: 300}],
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
            regionId: [1,2,3,4,5,6,7],
            directory: regionSubdirectory,
            file: "M17_SWex_testRegions_pix_export_to_world.crtf",
        },
        {
            type: CARTA.FileType.CRTF,
            coordType: CARTA.CoordinateType.PIXEL,
            fileId: 0,
            regionId: [1,2,3,4,5,6,7],
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
    let Connection: WebSocket;
    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.registerViewer);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {

        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1,});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, assertItem.openFile);
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
        });

        describe(`Import "${assertItem.importRegion.file}"`, () => {
            let importRegionAck: CARTA.ImportRegionAck;
            test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.ImportRegion, assertItem.importRegion);
                importRegionAck = await Utility.getEventAsync(Connection, CARTA.ImportRegionAck) as CARTA.ImportRegionAck;
            }, importTimeout);

            test(`IMPORT_REGION_ACK.success = ${assertItem.importRegionAck.success}`, () => {
                expect(importRegionAck.success).toBe(assertItem.importRegionAck.success);
            });

            test(`Length of IMPORT_REGION_ACK.region = ${assertItem.importRegionAck.regions.length}`, () => {
                expect(importRegionAck.regions.length).toEqual(assertItem.importRegionAck.regions.length);
            });

            assertItem.importRegionAck.regions.map( (region, index) => {
                test(`IMPORT_REGION_ACK.region[${index}] = "Id:${region.regionId}, Type:${CARTA.RegionType[region.regionInfo.regionType]}"`, () => {
                    expect(importRegionAck.regions[index]).toEqual(region);
                });
            });
        });

        assertItem.exportRegionAck.map((exRegion, idxRegion) => {
            describe(`Export "${assertItem.exportRegion[idxRegion].file}"`, () => {
                let exportRegionAck: CARTA.ExportRegionAck;
                test(`EXPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.ExportRegion, assertItem.exportRegion[idxRegion]);
                    exportRegionAck = await Utility.getEventAsync(Connection, CARTA.ExportRegionAck) as CARTA.ExportRegionAck;
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
                    await Utility.setEventAsync(Connection, CARTA.ImportRegion, assertItem.exportRegion[idxRegion]);
                    importRegionAck = await Utility.getEventAsync(Connection, CARTA.ImportRegionAck) as CARTA.ImportRegionAck;
                }, exportTimeout);

                test(`EXPORT_REGION_ACK.success = ${Region.success}`, () => {
                    expect(importRegionAck.success).toBe(Region.success);
                });

                test(`Length of EXPORT_REGION_ACK.regions = ${Region.lengthOfRegions}`, () => {
                    expect(importRegionAck.regions.length).toEqual(Region.lengthOfRegions);
                });

                test(`EXPORT_REGION_ACK.regions[${Region.assertRegionId.index}].region_id = ${Region.assertRegionId.id}`, () => {
                    expect(importRegionAck.regions[Region.assertRegionId.index].regionId).toEqual(Region.assertRegionId.id);
                });
            });
        });
    });

    afterAll( () => Connection.close());
});