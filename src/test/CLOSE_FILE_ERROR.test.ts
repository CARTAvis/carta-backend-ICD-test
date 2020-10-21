import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
import { async } from "q";
var W3CWebSocket = require('websocket').w3cwebsocket;

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements;
    ErrorMessage: CARTA.IErrorData;
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
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        }
    ],
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor:
        [
            {
                fileId: 0,
                point: { x: 1, y: 1 },
            },
            {
                fileId: 1,
                point: { x: 1, y: 1 },
            }
        ],
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
    },
    ErrorMessage: {
        tags: ['cursor'],
        message: 'File id 1 not found',
    },
};


describe("[Case 1] Test for requesting the ICD message of the CLOSED image:", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(W3CWebSocket.OPEN);
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of fileId = 0 should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen[0]);
        let OpenAck = await Connection.receive(CARTA.OpenFileAck)
        await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
        expect(OpenAck.success).toBe(true)
        expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file)
    }, openFileTimeout);

    test(`(Step 2) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA of fileId = 1 should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen[1]);
        let OpenAck = await Connection.receive(CARTA.OpenFileAck)
        await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
        expect(OpenAck.success).toBe(true)
        expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[1].file)
    }, openFileTimeout);

    test(`(Step 3) close fileId =1 & request ICD message of the closed fileId=1, then the backend is still alive:`, async () => {
        //close fileId =1
        await Connection.send(CARTA.CloseFile, { fileId: 1 });

        //request ICD message of the closed fileId=1
        await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
        let ErrMesssage = await Connection.receiveAny()
        expect(ErrMesssage.tags).toEqual(assertItem.ErrorMessage.tags)
        expect(ErrMesssage.message).toEqual(assertItem.ErrorMessage.message)

        //check the backend is still alive
        let Response = await Connection.receiveAny(1000, false)
        expect(Response).toEqual(undefined)
        await Connection.send(CARTA.FileListRequest, assertItem.filelist)
        let BackendStatus = await Connection.receive(CARTA.FileListResponse)
        expect(BackendStatus).toBeDefined()
    });

    let ack: AckStream;
    test(`(Step 4) Test fileId = 0 is still working well: `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        ack = await Connection.stream(5, 2500) as AckStream;
        expect(ack.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length) //only 1 Tile returned
    }, readFileTimeout);

    afterAll(() => Connection.close());
});


describe("[Case 2] Open=>Close=>Open of fileId=0, and then check the backend alive:", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(W3CWebSocket.OPEN);
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen[0]);
        let OpenAck = await Connection.receive(CARTA.OpenFileAck)
        await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
        expect(OpenAck.success).toBe(true)
        expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file)
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        ack = await Connection.stream(5, 2500) as AckStream;
        expect(ack.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length) //only 1 Tile returned
    }, readFileTimeout);

    test(`(Step 3) Closed and Re-open `, async () => {
        //Close fileid=0
        await Connection.send(CARTA.CloseFile, { fileId: 0 });

        //Re-opne fileid=0
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen[0]);
        let OpenAck = await Connection.receive(CARTA.OpenFileAck)
        await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
        expect(OpenAck.success).toBe(true)
        expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file)

        //ICD messages work fine?
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        ack = await Connection.stream(5, 2500) as AckStream;
        expect(ack.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length) //only 1 Tile returned
    }, readFileTimeout);

    test(`(Step 4) the backend is still alive`, async () => {
        await Connection.send(CARTA.FileListRequest, assertItem.filelist);
        let BackendStatus = await Connection.receive(CARTA.FileListResponse);
        expect(BackendStatus).toBeDefined();
        expect(BackendStatus.success).toBe(true);
        expect(BackendStatus.directory).toBe(assertItem.filelist.directory)
    });

    afterAll(() => Connection.close());
});