import {CARTA} from "carta-protobuf";

import {MessageController, ConnectionStatus} from "./MessageController";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

export function checkConnection() {
    const msgController = MessageController.Instance;
    test("check connection", () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE)
    })
}

describe("GET_FILELIST_DEFAULT_PATH tests: Testing generation of a file list at default path ($BASE)", () => {

    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);
    
    checkConnection();

    let fileListResponse: CARTA.IFileListResponse;
    test("getFileList Open", async () => {
        fileListResponse = await msgController.getFileList("$BASE");
        expect(fileListResponse.files.length).toBe(2);
    }, 2000);

    afterAll(() => msgController.closeConnection());
});
