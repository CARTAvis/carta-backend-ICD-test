import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;
let exportTimeout = config.timeout.export;

interface AssertItem {
    registerrViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    precisionDigits: number;
    setRegion: CARTA.ISetRegion[];
    exportRegion: CARTA.IExportRegion[];
    exportRegionAck: CARTA.IExportRegionAck[];
    importRegion: CARTA.IImportRegion[];
    importRegionAck: CARTA.ImportRegionAck[];
    regionType: string[];
};

let assertItem: AssertItem = {
    registerrViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    precisionDigits: 1,
    regionType:["Point", "Rectangle", "Ellipse", "Polygon"],
    setRegion:
        [
            {
                fileId: 0,
                regionId: -1,   // 1
                regionInfo: {
                    regionType: CARTA.RegionType.POINT,
                    rotation: 0,
                    controlPoints: [{ x: -109.579, y: 618.563 }],
                },
            },
            {
                fileId: 0,
                regionId: -1,   // 2
                regionInfo: {
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 0,
                    controlPoints: [{ x: -114.748, y: 508.708 }, { x: 90.468, y: 90.468 }],
                },
            },
            {
                fileId: 0,
                regionId: -1,   // 3
                regionInfo: {
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                    controlPoints: [{ x: 758.918, y: 634.071 }, { x: 62.035, y: 62.035 }],
                },
            },
            {
                fileId: 0,
                regionId: -1,   // 4
                regionInfo: {
                    regionType: CARTA.RegionType.POLYGON,
                    rotation: 0,
                    controlPoints: [{ x: 757.626, y: 184.314 }, { x: 698.175, y: 66.7051 }, { x: 831.293, y: 106.769 }],
                },
            },
        ],
        exportRegion:
        [
            {
                coordType: CARTA.CoordinateType.WORLD,
                file: "M17_SWex_test_world.crtf",
                fileId: 0,
                type: CARTA.FileType.CRTF,
                regionStyles: {
                    '1': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '2': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '3': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                    '4': { color: "#2EE6D6", dashList: [], lineWidth: 2, name: "" },
                },
            },
        ],
        exportRegionAck:
        [
            {
                success: true,
                contents: [],
            },
        ],
        importRegion:
        [
            {
                contents: [],
                file: "M17_SWex_handMadeRegions_world.crtf",
                groupId: 0,
                type: CARTA.FileType.CRTF,
            },
        ],
};

describe("REGION_EXPORT test: Testing export of FITS region to a file", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerrViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file} and set regions"`, () => {

        let basePath: string;
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            await Connection.openFile(assertItem.openFile).then(()=>{
                basePath = Connection.Property.basePath;
            });
            for (let region of assertItem.setRegion) {
                await Connection.send(CARTA.SetRegion, region);
                await Connection.receive(CARTA.SetRegionAck);
            }
        });

        test(`(Step 0) Connection open? | `, () => {
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        });

        describe(`Export "${assertItem.exportRegion[0].file}"`, () => {
            let exportRegionAck: CARTA.ExportRegionAck;
            test(`EXPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                
                await Connection.send(CARTA.ExportRegion, {
                    ...assertItem.exportRegion[0],
                    directory: basePath + regionSubdirectory,
                });
                exportRegionAck = (await Connection.streamUntil(type => type == CARTA.ExportRegionAck)).Responce[0] as CARTA.ExportRegionAck;
                // console.log(exportRegionAck)
            }, exportTimeout);

            test(`EXPORT_REGION_ACK.success = ${assertItem.exportRegionAck[0].success}`, () => {
                expect(exportRegionAck.success).toBe(assertItem.exportRegionAck[0].success);
            });

            test(`EXPORT_REGION_ACK.contents = [${assertItem.exportRegionAck[0].contents}]`, () => {
                expect(exportRegionAck.contents).toEqual(assertItem.exportRegionAck[0].contents);
            });
        });

        describe(`Import "${assertItem.importRegion[0].file}"`, () => {
            let importRegionAck: CARTA.ImportRegionAck;
            let importRegionAckProperties: any;
            describe(`Check IMPORT_REGION_ACK and the region controlPoints:`,()=>{
                test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`,async()=>{
                    await Connection.send(CARTA.ImportRegion, {
                        // ...assertItem.exportRegion[idxRegion],
                        file:assertItem.exportRegion[0].file,
                        directory: basePath + regionSubdirectory,
                        groupId:0,
                        type:1
                    });
                    importRegionAck = (await Connection.streamUntil(type => type == CARTA.ImportRegionAck)).Responce[0] as CARTA.ImportRegionAck;
                    // console.log(importRegionAck);
                });

                assertItem.setRegion.map((regionValue,regionIndex)=>{
                   regionValue.regionInfo.controlPoints.map((cpValue,cpIndex)=>{
                       test(`Region Type "${assertItem.regionType[regionIndex]}" & Central Points of (x,y)=(${cpValue.x},${cpValue.y})}`,()=>{
                        let importRegionKey = Object.keys(importRegionAck.regions);
                        expect(importRegionAck.regions[importRegionKey[regionIndex]].controlPoints[cpIndex].x).toBeCloseTo(cpValue.x,assertItem.precisionDigits);
                        expect(importRegionAck.regions[importRegionKey[regionIndex]].controlPoints[cpIndex].y).toBeCloseTo(cpValue.y,assertItem.precisionDigits);
                       });
                   });
                });
            });

        });

    });

    afterAll(() => Connection.close());
});