import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let expectRootPath = config.path.root;
let connectionTimeout = config.timeout.connection;
let concurrentTimeout = config.timeout.concurrent;
let testNumber = config.repeat.concurrent;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "1234",
        clientFeatureFlags: 5,
    },
    filelist: {
        directory: config.path.base,
    },
}

let client: Client[] = Array(testNumber);

describe("GET_FILELIST_ROOTPATH_CONCURRENT test: Testing generation of a file list at root path from multiple concurrent users.", () => {    

    test(`establish ${testNumber} connections to "${testServerUrl}".`, async () => {
        for (let i = 0; i< client.length; i++) {
            client[i] = new Client(testServerUrl);
            await client[i].open(connectionTimeout);
        }
        for(let index = 0; index < client.length; index++) {
            client[index].send(CARTA.RegisterViewer, assertItem.register);
            await client[index].receive(CARTA.RegisterViewerAck);
        }
    }, concurrentTimeout);

    let fileListResponse: CARTA.FileListResponse[] = new Array(testNumber);
    
    test(`${testNumber} connections send EventName: "FILE_LIST_REQUEST" to CARTA "${testServerUrl}".`, async () => {
        for(let index = 0; index < client.length; index++) {
            client[index].send(CARTA.FileListRequest, assertItem.filelist);
            fileListResponse[index] = await client[index].receive(CARTA.FileListResponse);
        }
    }, concurrentTimeout);
    
    test(`assert every FILE_LIST_RESPONSE.success to be True.`, () => {
        for (let response of fileListResponse) {
            expect(response.success).toBe(true);
        }       
    });

    test(`assert every FILE_LIST_RESPONSE.parent is None.`, () => {
        for (let response of fileListResponse) {
            expect(response.parent).toBe("");
        }   
    });

    test(`assert every FILE_LIST_RESPONSE.directory is "${expectRootPath}".`, () => {
        for (let response of fileListResponse) {
            expect(response.directory).toBe(expectRootPath);
        }
    });

    test(`assert all FILE_LIST_RESPONSE.files[] are identical.`, () => {
        expect(fileListResponse[0]).toBeDefined();
        expect(fileListResponse.every(f => JSON.stringify(f.files) === JSON.stringify(fileListResponse[0].files))).toBe(true);
    });

    test(`assert all FILE_LIST_RESPONSE.subdirectories[] are identical.`, () => {
        expect(fileListResponse[0]).toBeDefined();
        expect(fileListResponse.every(f => JSON.stringify(f.subdirectories) === JSON.stringify(fileListResponse[0].subdirectories))).toBe(true);
    });

    afterAll( async () => {
        for (let i = 0; i< client.length; i++) {
            await client[i].close();
        }
    });
    
});