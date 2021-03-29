import { AckStream, Client, IOpenFile } from "./CLIENT";
import { CARTA } from "carta-protobuf";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;

type regionAck = {
    success: boolean,
    message: string,
    regionNumber: number,
    regionStyles: CARTA.IRegionStyle,
};
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    importRegion: CARTA.IImportRegion[];
    importRegionAck: regionAck[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        fileId: 100,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    importRegion: [
        {
            directory: testSubdirectory,
            file: "M17_SWex_regionSet1_pix.crtf",
            groupId: 100,
            type: CARTA.FileType.CRTF,
            contents: [],
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex_regionSet1_world.crtf",
            groupId: 100,
            type: CARTA.FileType.CRTF,
            contents: [],
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            groupId: 100,
            type: CARTA.FileType.CASA,
            contents: [],
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex_regionSet1_pix.reg",
            groupId: 100,
            type: CARTA.FileType.DS9_REG,
            contents: [],
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex_regionSet1_world.reg",
            groupId: 100,
            type: CARTA.FileType.DS9_REG,
            contents: [],
        },
    ],
    importRegionAck: [
        {
            success: true,
            message: "",
            regionNumber: 16,
            regionStyles: { color: "green", lineWidth: 1, },
        },
        {
            success: true,
            message: "",
            regionNumber: 16,
            regionStyles: { color: "green", lineWidth: 1, },
        },
        {
            success: false,
            message: "Region importer failed.",
            regionNumber: 0,
            regionStyles: {},
        },
        {
            success: true,
            message: "",
            regionNumber: 16,
            regionStyles: { color: "green", lineWidth: 1, },
        },
        {
            success: true,
            message: "",
            regionNumber: 16,
            regionStyles: { color: "green", lineWidth: 1, },
        },
    ],
};

describe("IMPORT_MULTIPLE_REGION: Opening multiple region files at once", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        beforeAll(async () => {
            await Connection.openFile(assertItem.openFile);
        }, openFileTimeout);

        assertItem.importRegion.map((region, index) => {
            describe(`import file : ${region.file}`, () => {
                let importRegion: CARTA.ImportRegionAck;
                test(`IMPORT_REGION_ACK should arrive within ${openFileTimeout} ms".`, async () => {
                    await Connection.send(CARTA.ImportRegion, region);
                    importRegion = (await Connection.streamUntil(type => type == CARTA.ImportRegionAck) as AckStream).Responce[0];

                }, regionTimeout);

                test(`IMPORT_REGION_ACK.success = ${assertItem.importRegionAck[index].success}`, () => {
                    expect(importRegion.success).toBe(assertItem.importRegionAck[index].success);
                });

                test(`IMPORT_REGION_ACK.regionStyles = ${JSON.stringify(assertItem.importRegionAck[index].regionStyles)}`, () => {
                    Object.values(importRegion.regionStyles).map(style => {
                        for(let key in Object(assertItem.importRegionAck[index].regionStyles)){
                            expect(style[key]).toEqual(assertItem.importRegionAck[index].regionStyles[key]);
                        }
                    });
                });

                test(`IMPORT_REGION_ACK.region.length = ${assertItem.importRegionAck[index].regionNumber}`, () => {
                    expect(Object.keys(importRegion.regions).length).toEqual(assertItem.importRegionAck[index].regionNumber);
                });
                
                test(`IMPORT_REGION_ACK.message = "${assertItem.importRegionAck[index].message}"`, () => {
                    expect(importRegion.message).toEqual(assertItem.importRegionAck[index].message);
                });
            });
        });
    });
    afterAll(() => Connection.close());
});