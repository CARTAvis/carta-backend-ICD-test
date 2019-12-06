import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let importTimeout = config.timeout.import;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    precisionDigits: number;
    importRegion: CARTA.IImportRegion[];
    importRegionAck: CARTA.IImportRegionAck[];
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
        [
            {
                groupId: 0,
                type: CARTA.FileType.CRTF,
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet2_pix.crtf",
            },
            {
                groupId: 0,
                type: CARTA.FileType.CRTF,
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet3_world.crtf",
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
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            await Connection.send(CARTA.OpenFile, assertItem.openFile);
            await Connection.receiveAny();
            await Connection.receiveAny(); // OpenFileAck | RegionHistogramData
        });

        assertItem.importRegionAck.map((regionAck, idxRegion) => {
            describe(`Import "${assertItem.importRegion[idxRegion].file}"`, () => {
                let importRegionAck: CARTA.ImportRegionAck;
                test(`IMPORT_REGION_ACK should return within ${importTimeout}ms`, async () => {
                    await Connection.send(CARTA.ImportRegion, assertItem.importRegion[idxRegion]);
                    importRegionAck = await Connection.receive(CARTA.ImportRegionAck) as CARTA.ImportRegionAck;
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