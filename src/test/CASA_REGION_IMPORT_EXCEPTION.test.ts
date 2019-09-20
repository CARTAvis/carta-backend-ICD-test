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
        {success: false,},
        {success: false,},
    ],
};

describe("CASA_REGION_IMPORT_EXCEPTION test: Testing import/export of CASA region format", () => {   
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

                test(`IMPORT_REGION_ACK.message should not be empty`, () => {
                    expect(importRegionAck.message).toBeDefined();
                    expect(importRegionAck.message).not.toEqual("");
                });

            });
        });
    });

    afterAll( () => Connection.close());
});