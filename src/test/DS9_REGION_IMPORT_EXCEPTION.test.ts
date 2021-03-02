import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
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
    },
    precisionDigits: 4,
    importRegion:
        [
            {
                contents: [],
                // directory: regionSubdirectory,
                file: "M17_SWex_regionSet2_pix.reg",
                groupId: 0,
                type: CARTA.FileType.DS9_REG,
            },
            {
                contents: [],
                // directory: regionSubdirectory,
                file: "M17_SWex_regionSet2_world.reg",
                groupId: 0,
                type: CARTA.FileType.DS9_REG,
            },
        ],
    importRegionAck:
        [
            { success: false, },
            { success: false, },
        ],
};

describe("CASA_REGION_IMPORT_EXCEPTION test: Testing import/export of CASA region format", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
        let basePath: string;
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            await Connection.openFile(assertItem.openFile).then(()=>{
                basePath = Connection.Property.basePath;
            });
        });

        assertItem.importRegionAck.map((regionAck, idxRegion) => {
            describe(`Import "${assertItem.importRegion[idxRegion].file}"`, () => {
                let importRegionAck: CARTA.ImportRegionAck;
                test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                    await Connection.send(CARTA.ImportRegion, {
                        ...assertItem.importRegion[idxRegion],
                        directory: basePath + regionSubdirectory,
                    });
                    importRegionAck = (await Connection.streamUntil(type => type==CARTA.ImportRegionAck)).Responce[0] as CARTA.ImportRegionAck;
                }, importTimeout);

                test(`IMPORT_REGION_ACK.success = ${regionAck.success}`, () => {
                    expect(importRegionAck.success).toBe(regionAck.success);
                });

                test(`IMPORT_REGION_ACK.message should not be empty`, () => {
                    expect(importRegionAck.message).toBeDefined();
                    expect(importRegionAck.message).not.toEqual("");
                });

            });
        });
    });

    afterAll(() => Connection.close());
});