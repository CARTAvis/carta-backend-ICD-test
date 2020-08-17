import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;

// interface ImportRegionAckExt extends CARTA.ImportRegionAck {
//     regionId?: number;
// }

interface AssertItem {
    register: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    importRegion: CARTA.IImportRegion[];
    importRegionAck: CARTA.ImportRegionAck;
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
    },
    addTilesRequire:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    precisionDigits: 0,
    importRegion:
        [
            {
                groupId: 0,
                type: CARTA.FileType.CRTF,
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet1_world.crtf",
            },
            {
                groupId: 0,
                type: CARTA.FileType.CRTF,
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet1_pix.crtf",
            },
        ],
    importRegionAck: [
        {
            success: true,
            regions: {
                '1': {
                    controlPoints: [{ x: -103.80097961425781, y: 613.0922241210938 }],
                    regionType: CARTA.RegionType.POINT,
                },
                '2': {
                    controlPoints: [{ x: -106.38993072509766, y: 528.9498291015625 }, { x: 75.0989990234375, y: 75.09903717041016 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                },
                '3': {
                    controlPoints: [{ x: -118.0404052734375, y: 412.4449462890625 }, { x: 137.23011779785156, y: 54.40286636352539 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                },
                '4': {
                    controlPoints: [{ x: -120.6, y: 251.9 }, { x: 173.5, y: 44.0 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '5': {
                    controlPoints: [{ x: 758.3348999023438, y: 635.0986328125 }, { x: 50.48550033569336, y: 50.48550033569336 }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '6': {
                    controlPoints: [{ x: 749.2734375, y: 486.2314147949219 }, { x: 29.773500442504883, y: 69.90299987792969, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '7': {
                    controlPoints: [{ x: 745.3899536132812, y: 369.7265319824219 }, { x: 18.12299919128418, y: 78.9645004272461, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '8': {
                    controlPoints: [{ x: 757.0404663085938, y: 270.0501403808594 }, { x: 715.6165161132812, y: 118.59384155273438 }, { x: 829.5323486328125, y: 191.08578491210938 }],
                    regionType: CARTA.RegionType.POLYGON,
                },
                '9': {
                    controlPoints: [{ x: 175.81072998046875, y: 591.085693359375 }],
                    regionType: CARTA.RegionType.POINT,
                },
                '10': {
                    controlPoints: [{ x: 168.04367065429688, y: 519.8883056640625 }, { x: 56.96287155151367, y: 56.96287536621094 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                },
                '11': {
                    controlPoints: [{ x: 130.50320434570312, y: 429.2734375 }, { x: 121.68660736083984, y: 36.25899124145508 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                },
                '12': {
                    controlPoints: [{ x: 100.72977447509766, y: 284.2896423339844 }, { x: 137.22122192382812, y: 36.26295471191406 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '13': {
                    controlPoints: [{ x: 496.8462829589844, y: 574.2572631835938 }, { x: 49.191001892089844, y: 49.191001892089844 }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '14': {
                    controlPoints: [{ x: 533.0922241210938, y: 435.74591064453125 }, { x: 25.889999389648438, y: 69.90299987792969, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '15': {
                    controlPoints: [{ x: 522.7362670898438, y: 307.5906066894531 }, { x: 22.006500244140625, y: 80.25900268554688, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '16': {
                    controlPoints: [{ x: 491.5906066894531, y: 228.57814025878906 }, { x: 416.5096435546875, y: 110.77886199951172 }, { x: 586.0889282226562, y: 106.89531707763672 }],
                    regionType: CARTA.RegionType.POLYGON,
                },
            },
        },
        {
            success: true,
            regions: {
                '17': {
                    controlPoints: [{ x: -103.80097961425781, y: 613.0922241210938 }],
                    regionType: CARTA.RegionType.POINT,
                },
                '18': {
                    controlPoints: [{ x: -106.38993072509766, y: 528.9498291015625 }, { x: 75.0989990234375, y: 75.09903717041016 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                },
                '19': {
                    controlPoints: [{ x: -118.0404052734375, y: 412.4449462890625 }, { x: 137.23011779785156, y: 54.40286636352539 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                },
                '20': {
                    controlPoints: [{ x: -120.6, y: 251.9 }, { x: 173.5, y: 44.0 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '21': {
                    controlPoints: [{ x: 758.3348999023438, y: 635.0986328125 }, { x: 50.48550033569336, y: 50.48550033569336 }],
                    regionType: CARTA.RegionType.ELLIPSE,
                },
                '22': {
                    controlPoints: [{ x: 749.2734375, y: 486.2314147949219 }, { x: 29.773500442504883, y: 69.90299987792969, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '23': {
                    controlPoints: [{ x: 745.3899536132812, y: 369.7265319824219 }, { x: 18.12299919128418, y: 78.9645004272461, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '24': {
                    controlPoints: [{ x: 757.0404663085938, y: 270.0501403808594 }, { x: 715.6165161132812, y: 118.59384155273438 }, { x: 829.5323486328125, y: 191.08578491210938 }],
                    regionType: CARTA.RegionType.POLYGON,
                },
                '25': {
                    controlPoints: [{ x: 175.81072998046875, y: 591.085693359375 }],
                    regionType: CARTA.RegionType.POINT,
                },
                '26': {
                    controlPoints: [{ x: 168.04367065429688, y: 519.8883056640625 }, { x: 56.96287155151367, y: 56.96287536621094 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                },
                '27': {
                    controlPoints: [{ x: 130.50320434570312, y: 429.2734375 }, { x: 121.68660736083984, y: 36.25899124145508 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                },
                '28': {
                    controlPoints: [{ x: 100.72977447509766, y: 284.2896423339844 }, { x: 137.22122192382812, y: 36.26295471191406 }],
                    regionType: CARTA.RegionType.RECTANGLE,
                    rotation: 45,
                },
                '29': {
                    controlPoints: [{ x: 496.8462829589844, y: 574.2572631835938 }, { x: 49.191001892089844, y: 49.191001892089844 }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '30': {
                    controlPoints: [{ x: 533.0922241210938, y: 435.74591064453125 }, { x: 25.889999389648438, y: 69.90299987792969, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                '31': {
                    controlPoints: [{ x: 522.7362670898438, y: 307.5906066894531 }, { x: 22.006500244140625, y: 80.25900268554688, }],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 45,
                },
                '32': {
                    controlPoints: [{ x: 491.5906066894531, y: 228.57814025878906 }, { x: 416.5096435546875, y: 110.77886199951172 }, { x: 586.0889282226562, y: 106.89531707763672 }],
                    regionType: CARTA.RegionType.POLYGON,
                },
            },
        },
    ],
};

describe("CASA_REGION_IMPORT_INTERNAL: Testing import of CASA region files made with CARTA", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        });

        test(`OpenFileAck & RegionHistogramData? | `, async () => {
            await Connection.send(CARTA.OpenFile, assertItem.openFile);
            await Connection.receive(CARTA.OpenFileAck)
            await Connection.receive(CARTA.RegionHistogramData);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesRequire);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            await Connection.stream(4) as AckStream;
        });

        assertItem.importRegion.map((regionAck, idxRegion) => {
            describe(`Import "${assertItem.importRegion[idxRegion].file}"`, () => {
                let importRegionAck: CARTA.ImportRegionAck;
                let importRegionAckProperties: any;
                test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                    await Connection.send(CARTA.ImportRegion, assertItem.importRegion[idxRegion]);
                    importRegionAck = await Connection.receive(CARTA.ImportRegionAck) as CARTA.ImportRegionAck;
                    importRegionAckProperties = Object.keys(importRegionAck.regions)
                }, importTimeout);

                test(`IMPORT_REGION_ACK.success = ${assertItem.importRegionAck[idxRegion].success}`, () => {
                    expect(importRegionAck.success).toBe(assertItem.importRegionAck[idxRegion].success);
                });

                test(`Length of IMPORT_REGION_ACK.region = ${Object.keys(assertItem.importRegionAck[idxRegion].regions).length}`, () => {
                    expect(importRegionAckProperties.length).toEqual(Object.keys(assertItem.importRegionAck[idxRegion].regions).length);
                });

                Object.keys(assertItem.importRegionAck[idxRegion].regions).map((region, index) => {
                    test(`IMPORT_REGION_ACK.region[${index}] = "Id:${region}, Type:${CARTA.RegionType[assertItem.importRegionAck[idxRegion].regions[region].regionType]}"`, () => {
                        expect(importRegionAckProperties[index]).toEqual(String(region));
                        expect(importRegionAck.regions.[importRegionAckProperties[index]].regionType).toEqual(assertItem.importRegionAck[idxRegion].regions[region].regionType);
                        if (assertItem.importRegionAck[idxRegion].regions[region].rotation) {
                            expect(importRegionAck.regions.[importRegionAckProperties[index]].rotation).toBeCloseTo(assertItem.importRegionAck[idxRegion].regions[region].rotation);
                        };
                        importRegionAck.regions.[importRegionAckProperties[index]].controlPoints.map((point, idx) => {
                            expect(point.x).toBeCloseTo(assertItem.importRegionAck[idxRegion].regions[region].controlPoints[idx].x, assertItem.precisionDigits);
                            expect(point.y).toBeCloseTo(assertItem.importRegionAck[idxRegion].regions[region].controlPoints[idx].y, assertItem.precisionDigits);
                        });
                    });
                });

            });
        });


    });

    afterAll(() => Connection.close());
});