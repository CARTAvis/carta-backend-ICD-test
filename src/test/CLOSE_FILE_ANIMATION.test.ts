import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
import * as Long from "long";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let playAnimatorTimeout = config.timeout.playAnimator;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    startAnimation: CARTA.IStartAnimation;
    animationFlowControl: CARTA.IAnimationFlowControl;
    AnimatorStopChannel: number;
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
        file: "S255_IR_sci.spw25.cube.I.pbcor.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addRequiredTiles: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33558529, 33562625, 33558530, 33562626, 33558528, 33554433, 33562624, 33554434, 33566721, 33558531, 33566722, 33562627, 33554432, 33566720, 33554435, 33566723],
        },
        {
            fileId: 0,
            compressionQuality: 9,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33558529, 33562625, 33558530, 33562626, 33558528, 33554433, 33562624, 33554434, 33566721, 33558531, 33566722, 33562627, 33554432, 33566720, 33554435, 33566723],
        },
    ],
    setCursor:
    {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
    },
    startAnimation:
    {
        fileId: 0,
        startFrame: { channel: 1, stokes: 0 },
        firstFrame: { channel: 0, stokes: 0 },
        lastFrame: { channel: 1916, stokes: 0 },
        deltaFrame: { channel: 1, stokes: 0 },
        requiredTiles: {
            fileId: 0,
            tiles: [33558529, 33562625, 33558530, 33562626, 33558528, 33554433, 33562624, 33554434, 33566721, 33558531, 33566722, 33562627, 33554432, 33566720, 33554435, 33566723],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 9,
        },
    },
    animationFlowControl: {
        fileId: 0,
        animationId: 1,
    },
    AnimatorStopChannel: 2,
};

describe("Testing CLOSE_FILE with large-size image and test CLOSE_FILE during the ANIMATION data streaming :", () => {

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
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[0]);
        ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
        expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addRequiredTiles[0].tiles.length); //only 1 Tile returned
    }, readFileTimeout);

    let AnimateStreamData: AckStream[] = [];
    let sequence: number[] = [];
    test(`(Step 3) START_ANIMATION & ANIMATION_FLOW_CONTROL, then CLOSE_FILE during the animation streaming & Check whether the backend is alive:`, async () => {
        await Connection.send(CARTA.StartAnimation, {
            ...assertItem.startAnimation,
            looping: true,
            reverse: false,
            frameRate: 5,
        });
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[1]);
        let SAAck = await Connection.receive(CARTA.StartAnimationAck);
        expect(SAAck.success).toBe(true);

        for (let i = 0; i < assertItem.AnimatorStopChannel; i++) {
            AnimateStreamData.push(await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream);
            await Connection.send(CARTA.AnimationFlowControl,
                {
                    ...assertItem.animationFlowControl,
                    receivedFrame: {
                        channel: AnimateStreamData[i].RasterTileData[0].channel,
                        stokes: 0
                    },
                    timestamp: Long.fromNumber(Date.now()),
                }
            );
            sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
        };
        expect(AnimateStreamData.length).toEqual(assertItem.AnimatorStopChannel);

        // CLOSE_FILE before STOP_ANIMATION (NO STOP_ANIMATION in this test!)
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
        // The backend may still returning the remain message
        // To check whether the backend is still alive
        await Connection.send(CARTA.FileListRequest, assertItem.filelist);
        let Ack = await Connection.streamUntil(type => type == CARTA.FileListResponse) as AckStream;
        let BackendStatus = Ack.Responce.filter(f => f.constructor.name == "FileListResponse")[0] as CARTA.FileListResponse;
        expect(BackendStatus).toBeDefined();
        expect(BackendStatus.success).toBe(true);
        expect(BackendStatus.directory).toBe(assertItem.filelist.directory);

    }, playAnimatorTimeout);
    afterAll(() => Connection.close());
});
