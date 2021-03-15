import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl = config.serverURL;
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
    precisionDigits: -1,
    regionType:["Point", "Rectangle", "Ellipse", "Polygon"],
    setRegion:
    [
        {
            fileId: 0,
            regionId: -1,   // 1
            regionInfo: {
                regionType: CARTA.RegionType.POINT,
                rotation: 0,
                controlPoints: [{ x: 262.071716, y: 377.173907 }],
            },
        },
        {
            fileId: 0,
            regionId: -1,   // 2
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                rotation: 0,
                controlPoints: [{ x: 224.531619, y: 503.871734 }, { x: 154.852900, y: 319.090825 }],
            },
        },
        {
            fileId: 0,
            regionId: -1,   // 3
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                rotation: 0,
                controlPoints: [{ x: 405.191764, y: 628.238373 }, { x: 105.581523, y: 79.772706 }],
            },
        },
        {
            fileId: 0,
            regionId: -1,   // 4
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                rotation: 0,
                controlPoints: [{ x: 419.270873, y: 367.788882 }, { x: 330.113142, y: 285.669920 }, { x: 431.002154, y: 177.742140 }],
            },
        },
    ],
        exportRegion:
        [
            {
                coordType: CARTA.CoordinateType.WORLD,
                file: "M17_SWex_test_world.reg",
                fileId: 0,
                type: CARTA.FileType.DS9_REG,
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
                file: "M17_SWex_test_world.reg",
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
                        file:assertItem.importRegion[0].file,
                        directory: basePath + regionSubdirectory,
                        groupId:0,
                        type:CARTA.FileType.DS9_REG
                    });
                    importRegionAck = (await Connection.streamUntil(type => type == CARTA.ImportRegionAck)).Responce[0] as CARTA.ImportRegionAck;
                    // console.log(importRegionAck);
                });

                assertItem.setRegion.map((regionValue,regionIndex)=>{
                   regionValue.regionInfo.controlPoints.map((cpValue,cpIndex)=>{
                       test(`Region Type "${assertItem.regionType[regionIndex]}" & Central Points of (x,y)=(${cpValue.x},${cpValue.y})}`,()=>{
                        let importRegionKey = Object.keys(importRegionAck.regions);
                        if (regionIndex ==1 && cpIndex ==0){
                            let xdiff = importRegionAck.regions[importRegionKey[regionIndex]].controlPoints[cpIndex].x - cpValue.x;
                            let ydiff = importRegionAck.regions[importRegionKey[regionIndex]].controlPoints[cpIndex].y - cpValue.y;
                            expect(xdiff).toBeCloseTo(-0.53);
                            expect(ydiff).toBeCloseTo(-0.87);
                        } else {
                            expect(importRegionAck.regions[importRegionKey[regionIndex]].controlPoints[cpIndex].x).toBeCloseTo(cpValue.x,assertItem.precisionDigits);
                            expect(importRegionAck.regions[importRegionKey[regionIndex]].controlPoints[cpIndex].y).toBeCloseTo(cpValue.y,assertItem.precisionDigits);
                        };
                       });
                   });
                });
            });

        });

    });

    afterAll(() => Connection.close());
});