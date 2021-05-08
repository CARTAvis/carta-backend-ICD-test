import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let tmpdirectory: string = config.path.save;
let connectTimeout: number = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout: number = config.timeout.openFile;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    saveFileReq: CARTA.ISaveFile[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 200,
        renderMode: CARTA.RenderMode.RASTER,
    },
    {
        file: "M17_SWex_Partial.image",
        hdu: "",
        fileId: 300,
        renderMode: CARTA.RenderMode.RASTER,
    }],
    saveFileReq:[
    {
        outputFileName: "M17_SWex_Partial.image",
        outputFileType: CARTA.FileType.CASA,
        fileId: 200,
        channels: [5, 20, 1],
        keepDegenerate: true,
    }]
};

describe("EXPORT IMAGE CHANNEL test: Exporting of a partial spectral range of an image cube", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.register);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        let basePath: string;
        beforeAll(async () => {
            await Connection.send(CARTA.FileListRequest, { directory: "$BASE" });
            basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
        }, listFileTimeout);

        test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 0 });
            await Connection.openFile(assertItem.fileOpen[0]);
        }, openFileTimeout);

        test(`(Step 2) SAVE_FILE_ACK should arrive within ? ms | `, async() => {
            await Connection.send(CARTA.SaveFile,{
                outputFileDirectory: `${basePath}/` + tmpdirectory,
                ...assertItem.saveFileReq[0]
            });
            let SaveFileResponse = await Connection.receive(CARTA.SaveFileAck);
            expect(SaveFileResponse.success).toEqual(true);
        });

        test(`(Step 3) Open the saved file, OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async()=>{
            await Connection.send(CARTA.OpenFile,{
                directory: `${basePath}/` + tmpdirectory,
                ...assertItem.fileOpen[1]});
            let responses = await Connection.stream(2) as AckStream;
            let computedEntries = responses.Responce[0].fileInfoExtended.computedEntries;
            expect(computedEntries).toMatchSnapshot();
        });
    });

});
