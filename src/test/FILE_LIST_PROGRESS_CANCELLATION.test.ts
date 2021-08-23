import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.large_files;
let testBackendSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openLargeFilesTimeout: number = config.timeout.openLargeFiles;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    checkBackendlist: CARTA.IFileListRequest;
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    checkBackendlist: { directory: testBackendSubdirectory},
};

describe("FILE_LIST_PROGRESS_CANCELLATION test: Test ListProgress & StopFileList ICD with loading the folder which contains many files.", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.register);
    }, connectTimeout);

    test(`Websocket connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    let basepath: any;
    test(`Initialize:`,async()=>{
        await Connection.send(CARTA.FileListRequest,{ directory: "$BASE" });
        let path = await Connection.receiveAny();
        basepath = path.directory;
        console.log('basepath:', basepath);
    },openLargeFilesTimeout);

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        }, connectTimeout);

        let temp: any;
        let Progress: number;
        test(`Receive a series of *One* ListProgress than requst StopFileList:`,async()=>{
            await Connection.send(CARTA.FileListRequest, { directory: basepath + '/' + assertItem.filelist.directory });
            for (let i=0; i<1; i++){
                temp = await Connection.receiveAny();
                if (temp.percentage != undefined){
                    console.log("List Progress: ", Progress, "%");
                };
            }
            await Connection.send(CARTA.StopFileList,{fileListType: 0});
            let Response = await Connection.receiveAny(1000, false);
            expect(Response).toEqual(null);
        },openLargeFilesTimeout);

        test(`Check the backend is still alive:`,async()=>{
            await Connection.send(CARTA.FileListRequest, { directory: basepath + '/' + assertItem.checkBackendlist.directory });
            let BackendStatus = await Connection.receive(CARTA.FileListResponse);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
        },openLargeFilesTimeout);
    });
    afterAll(() => Connection.close());
});

