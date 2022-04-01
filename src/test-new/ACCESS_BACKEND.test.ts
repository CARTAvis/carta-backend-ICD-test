import {MessageController, ConnectionStatus} from "./MessageController";
import config from "./config.json";
let testServerUrl = config.serverURL0;
let connectTimeout = config.timeout.connection;

describe("GET_FILELIST_DEFAULT_PATH tests: Testing generation of a file list at default path ($BASE)", () => {

    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);
    
    test(`Connect to the backend`, async()=>{
        expect(msgController.connectionStatus).toEqual(ConnectionStatus.ACTIVE);
    })

    afterAll(() => {
        msgController.closeConnection();
    });
});