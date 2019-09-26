import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    precisionDigits: number;
    importRegion: CARTA.IImportRegion[];
    importRegionAck: CARTA.IImportRegionAck[];
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
    importRegionAck:
    [
        {
            success: true,
            regions: [
                {
                    regionId: 1, 
                    regionInfo: {
                        regionType: CARTA.RegionType.POINT,
                        controlPoints: [{x: -103.80097961425781, y: 613.0922241210938}],
                    },
                },
                {
                    regionId: 2, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: -106.38993072509766, y: 528.9498291015625}, {x: 75.0989990234375, y: 75.09903717041016}],
                    },
                },
                {
                    regionId: 3, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: -118.0404052734375, y: 412.4449462890625}, {x: 137.23011779785156, y: 54.40286636352539}],
                    },
                },
                {
                    regionId: 4, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 45,
                        controlPoints: [{x: -120.6, y: 251.9}, {x: 173.5, y: 44.0}],
                    },
                },
                {
                    regionId: 5, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 0,
                        controlPoints: [{x: 758.3348999023438, y: 635.0986328125}, {x: 50.48550033569336, y: 50.48550033569336}],
                    },
                },
                {
                    regionId: 6, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 90,
                        controlPoints: [{x: 749.2734375, y: 486.2314147949219}, {x: 69.90299987792969, y: 29.773500442504883}],
                    },
                },
                {
                    regionId: 7, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 135,
                        controlPoints: [{x: 745.3899536132812, y: 369.7265319824219}, {x: 78.9645004272461, y: 18.12299919128418}],
                    },
                },
                {
                    regionId: 8, 
                    regionInfo: {
                        regionType: CARTA.RegionType.POLYGON,
                        controlPoints: [{x: 757.0404663085938, y: 270.0501403808594}, {x: 715.6165161132812, y: 118.59384155273438}, {x: 829.5323486328125, y: 191.08578491210938}],
                    },
                },
                {
                    regionId: 9, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: 175.81072998046875, y: 591.085693359375}],
                    },
                },
                {
                    regionId: 10, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: 168.04367065429688, y: 519.8883056640625}, {x: 56.96287155151367, y: 56.96287536621094}],
                    },
                },
                {
                    regionId: 11, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: 130.50320434570312, y: 429.2734375}, {x: 121.68660736083984, y: 36.25899124145508}],
                    },
                },
                {
                    regionId: 12, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        rotation: 45,
                        controlPoints: [{x: 100.72977447509766, y: 284.2896423339844}, {x: 137.22122192382812, y: 36.26295471191406}],
                    },
                },
                {
                    regionId: 13, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 0,
                        controlPoints: [{x: 496.8462829589844, y: 574.2572631835938}, {x: 49.191001892089844, y: 49.191001892089844}],
                    },
                },
                {
                    regionId: 14, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 90,
                        controlPoints: [{x: 533.0922241210938, y: 435.74591064453125}, {x: 69.90299987792969, y: 25.889999389648438}],
                    },
                },
                {
                    regionId: 15, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 135,
                        controlPoints: [{x: 522.7362670898438, y: 307.5906066894531}, {x: 80.25900268554688, y: 22.006500244140625}],
                    },
                },
                {
                    regionId: 16, 
                    regionInfo: {
                        regionType: CARTA.RegionType.POLYGON,
                        controlPoints: [{x: 491.5906066894531, y: 228.57814025878906}, {x: 416.5096435546875, y: 110.77886199951172}, {x: 586.0889282226562, y: 106.89531707763672}],
                    },
                },
            ],
        },
        {
            success: true,
            regions: [
                {
                    regionId: 17, 
                    regionInfo: {
                        regionType: CARTA.RegionType.POINT,
                        controlPoints: [{x: -103.80097961425781, y: 613.0922241210938}],
                    },
                },
                {
                    regionId: 18, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: -106.38993072509766, y: 528.9498291015625}, {x: 75.0989990234375, y: 75.09903717041016}],
                    },
                },
                {
                    regionId: 19, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: -118.0404052734375, y: 412.4449462890625}, {x: 137.23011779785156, y: 54.40286636352539}],
                    },
                },
                {
                    regionId: 20, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 45,
                        controlPoints: [{x: -120.6, y: 251.9}, {x: 173.5, y: 44.0}],
                    },
                },
                {
                    regionId: 21, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        controlPoints: [{x: 758.3348999023438, y: 635.0986328125}, {x: 50.48550033569336, y: 50.48550033569336}],
                    },
                },
                {
                    regionId: 22, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 90,
                        controlPoints: [{x: 749.2734375, y: 486.2314147949219}, {x: 69.90299987792969, y: 29.773500442504883}],
                    },
                },
                {
                    regionId: 23, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 135,
                        controlPoints: [{x: 745.3899536132812, y: 369.7265319824219}, {x: 78.9645004272461, y: 18.12299919128418}],
                    },
                },
                {
                    regionId: 24, 
                    regionInfo: {
                        regionType: CARTA.RegionType.POLYGON,
                        controlPoints: [{x: 757.0404663085938, y: 270.0501403808594}, {x: 715.6165161132812, y: 118.59384155273438}, {x: 829.5323486328125, y: 191.08578491210938}],
                    },
                },
                {
                    regionId: 25, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: 175.81072998046875, y: 591.085693359375}],
                    },
                },
                {
                    regionId: 26, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: 168.04367065429688, y: 519.8883056640625}, {x: 56.96287155151367, y: 56.96287536621094}],
                    },
                },
                {
                    regionId: 27, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        controlPoints: [{x: 130.50320434570312, y: 429.2734375}, {x: 121.68660736083984, y: 36.25899124145508}],
                    },
                },
                {
                    regionId: 28, 
                    regionInfo: {
                        regionType: CARTA.RegionType.RECTANGLE,
                        rotation: 45,
                        controlPoints: [{x: 100.72977447509766, y: 284.2896423339844}, {x: 137.22122192382812, y: 36.26295471191406}],
                    },
                },
                {
                    regionId: 29, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 0,
                        controlPoints: [{x: 496.8462829589844, y: 574.2572631835938}, {x: 49.191001892089844, y: 49.191001892089844}],
                    },
                },
                {
                    regionId: 30, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 90,
                        controlPoints: [{x: 533.0922241210938, y: 435.74591064453125}, {x: 69.90299987792969, y: 25.889999389648438}],
                    },
                },
                {
                    regionId: 31, 
                    regionInfo: {
                        regionType: CARTA.RegionType.ELLIPSE,
                        rotation: 135,
                        controlPoints: [{x: 522.7362670898438, y: 307.5906066894531}, {x: 80.25900268554688, y: 22.006500244140625}],
                    },
                },
                {
                    regionId: 32, 
                    regionInfo: {
                        regionType: CARTA.RegionType.POLYGON,
                        controlPoints: [{x: 491.5906066894531, y: 228.57814025878906}, {x: 416.5096435546875, y: 110.77886199951172}, {x: 586.0889282226562, y: 106.89531707763672}],
                    },
                },
            ],
        },
    ],
};

describe("CASA_REGION_IMPORT_INTERNAL test: Testing import of CASA region files made with CARTA", () => {   
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

        assertItem.importRegionAck.map((regionAck, idxRegion) => {
            describe(`Import "${assertItem.importRegion[idxRegion].file}"`, () => {
                let importRegionAck: CARTA.ImportRegionAck;
                test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.ImportRegion, assertItem.importRegion[idxRegion]);
                    importRegionAck = await Utility.getEventAsync(Connection, CARTA.ImportRegionAck) as CARTA.ImportRegionAck;
                }, importTimeout);

                test(`IMPORT_REGION_ACK.success = ${regionAck.success}`, () => {
                    expect(importRegionAck.success).toBe(regionAck.success);
                });

                test(`Length of IMPORT_REGION_ACK.region = ${regionAck.regions.length}`, () => {
                    expect(importRegionAck.regions.length).toEqual(regionAck.regions.length);
                });

                regionAck.regions.map( (region, index) => {
                    test(`IMPORT_REGION_ACK.region[${index}] = "Id:${region.regionId}, Type:${CARTA.RegionType[region.regionInfo.regionType]}"`, () => {
                        expect(importRegionAck.regions[index].regionId).toEqual(region.regionId);
                        expect(importRegionAck.regions[index].regionInfo.regionType).toEqual(region.regionInfo.regionType);
                        if(region.regionInfo.rotation)
                            expect(importRegionAck.regions[index].regionInfo.rotation).toEqual(region.regionInfo.rotation);
                        expect(importRegionAck.regions[index].regionInfo.controlPoints).toEqual(region.regionInfo.controlPoints);
                    });
                });
            });
        });
    });

    afterAll( () => Connection.close());
});