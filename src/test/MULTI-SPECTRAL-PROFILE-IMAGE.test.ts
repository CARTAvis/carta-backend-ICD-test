import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_CO_2_1.fits",
        fileId: 100,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
        
};

describe("MATCH_SPATIAL: Test cursor value and spatial profile with spatially matched images", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Prepare images`, () => {
        test(`Should open image ${assertItem.openFile.file}:`, async () => {
            await Connection.openFile(assertItem.openFile);
        }, openFileTimeout);
    });

    afterAll(() => Connection.close());
});