import {CARTA} from "carta-protobuf";

import {BackendService, ConnectionStatus} from "./BACKEND_SERVECE";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

export function checkConnection() {
    const backendService = BackendService.Instance;
    test("check connection", () => {
        expect(backendService.connectionStatus).toBe(ConnectionStatus.ACTIVE)
    })
}

describe("FILELIST test: Testing File List", () => {

    const backendService = BackendService.Instance;
    beforeAll(async ()=> {
        await backendService.connect(testServerUrl);
    }, connectTimeout);
    
    checkConnection();

    let fileListResponse: CARTA.IFileListResponse;
    test("getFileList Open", async () => {
        fileListResponse = await backendService.getFileList("$BASE");
        expect(fileListResponse.files.length).toBe(2);
    }, 2000);

    // backendService.closeFile(-1);
    // backendService.loadFile(testSubdirectory, assertItem.openFile[0].file, assertItem.openFile[0].hdu, assertItem.openFile[0].fileId, assertItem.openFile[0].renderMode);
    // backendService.setCursor(assertItem.setCursor.fileId, assertItem.setCursor.point.x, assertItem.setCursor.point.y);
    // backendService.addRequiredTiles(assertItem.addTilesRequire.fileId, assertItem.addTilesRequire.tiles, assertItem.addTilesRequire.compressionQuality);
    
    // backendService.rasterTileStream();
    // backendService.closeFile(-1);

    afterAll(() => backendService.close());
});
