import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addRequiredTiles: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
    },
};

describe("Test for Close single file:", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        let OpenAck = await Connection.openFile(assertItem.openFile);
        expect(OpenAck.OpenFileAck.success).toBe(true);
        expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.openFile.file);
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles);
        let ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addRequiredTiles.tiles.length); //only 1 Tile returned
    }, readFileTimeout);

    test(`(Step 3) close image & make sure NO message returned & the backend is still alive`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: 0 });

        let Response = await Connection.receiveAny(1000, false);
        expect(Response).toEqual(undefined);

        await Connection.send(CARTA.FileListRequest, assertItem.filelist);
        let BackendStatus = await Connection.receive(CARTA.FileListResponse);
        expect(BackendStatus).toBeDefined();
        expect(BackendStatus.success).toBe(true);
        expect(BackendStatus.directory).toBe(assertItem.filelist.directory);
    });

    afterAll(() => Connection.close());
});

