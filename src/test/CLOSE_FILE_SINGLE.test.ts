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
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    startAnimation: CARTA.IStartAnimation[];
    stopAnimation: CARTA.IStopAnimation[];
    animationFlowControl: CARTA.IAnimationFlowControl[];
    setImageChannel: CARTA.ISetImageChannels[];
    reverseAnimation: CARTA.IStartAnimation[];
    blinkAnimation: CARTA.IStartAnimation;
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
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

describe("ANIMATOR_PLAYBACK test: Testing animation playback", () => {

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
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
        await Connection.receiveAny()
        await Connection.receiveAny() // OpenFileAck | RegionHistogramData
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);

        ack = await Connection.stream(5, 3000) as AckStream;
        // console.log(ack); // RasterTileData * 1 + SpatialProfileData * 2 + RasterTileSync *2 (start & end)
        // let ackRasterAckLength = ack.RasterTileSync.length
        // if (ackRasterAckLength == 1) {
        //     let buffer = await Connection.receive(CARTA.RasterTileSync);
        //     console.log(buffer)
        // }
    }, readFileTimeout);

    test(`(Step 3) close file`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
    });

    afterAll(() => Connection.close());
});

