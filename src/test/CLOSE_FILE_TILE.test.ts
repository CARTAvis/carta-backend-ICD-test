import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let listFileTimeout: number = config.timeout.listFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setImageChannel: CARTA.ISetImageChannels;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen:
    {
        directory: testSubdirectory,
        file: "S255_IR_sci.spw29.cube.I.pbcor.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addRequiredTiles:
    {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor:
    {
        fileId: 0,
        point: { x: 960, y: 960 },
    },
    setSpatialReq:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
    },
    setImageChannel:
    {
        fileId: 0,
        channel: 100,
        stokes: 0,
        requiredTiles: {
            fileId: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            // tiles: [0]
            tiles: [33558529, 33562625, 33558530, 33562626, 33558528, 33554433, 33562624, 33554434, 33566721, 33558531, 33566722, 33562627, 33554432, 33566720, 33554435, 33566723],
        },
    },

};

describe("Testing CLOSE_FILE with large-size image and test CLOSE_FILE during the TILE data streaming :", () => {

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
        let Ack = await Connection.openFile(assertItem.fileOpen);
        expect(Ack.OpenFileAck.success).toBe(true);
        expect(Ack.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen.file);
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles);
        ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
        expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addRequiredTiles.tiles.length); //only 1 Tile returned
    }, readFileTimeout);

    test(`(Step 3) Set SET_IMAGE_CHANNELS and then CLOSE_FILE during the tile streaming & Check whether the backend is alive:`, async () => {
        await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel);
        // Interupt during the tile, we will receive the number <  assertItem.setImageChannel.requiredTiles.tiles.length
        await Connection.stream(2);
        // CLOSE_FILE during the tile streaming
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
        //await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);

        await Connection.send(CARTA.FileListRequest, assertItem.filelist);
        let BackendStatus = await Connection.receive(CARTA.FileListResponse);
        expect(BackendStatus).toBeDefined();
        expect(BackendStatus.success).toBe(true);
        expect(BackendStatus.directory).toBe(assertItem.filelist.directory);
    }, readFileTimeout + listFileTimeout);

    afterAll(() => Connection.close());
});