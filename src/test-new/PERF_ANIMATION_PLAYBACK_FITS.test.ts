import { CARTA } from "carta-protobuf";
import config from "./config.json";
import * as Long from "long";
import { take } from 'rxjs/operators';
import { checkConnection, Stream } from './myClient';
import {MessageController, ConnectionStatus} from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = 7000;//config.timeout.openFile;
let readFileTimeout: number = 7000;//config.timeout.readFile; //5000
let playImageTimeout: number = config.timeout.playImages;
let sleepTimeout: number = config.timeout.sleep;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    startAnimation: CARTA.IStartAnimation[];
    stopAnimation: CARTA.IStopAnimation[];
    animationFlowControl: CARTA.IAnimationFlowControl[];
    setImageChannel: CARTA.ISetImageChannels[];
    playAnimatorTimeout: number[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory  + "/cube_B"},
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_B",
            file: "cube_B_09600_z00100.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
    },
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 9,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
    },
    startAnimation:
        [
            {
                fileId: 0,
                startFrame: { channel: 0, stokes: 0 },
                firstFrame: { channel: 0, stokes: 0 },
                lastFrame: { channel: 999, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
            },
        ],
    stopAnimation:
        [
            {
                fileId: 0,
                endFrame: { channel: 46, stokes: 0 },
            },
        ],
    animationFlowControl:
        [
            {
                fileId: 0,
                animationId: 0,
            },
        ],
    setImageChannel:
        [
            {
                fileId: 0,
                channel: 46,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
        ],
    playAnimatorTimeout: [200000],
};

describe("PERF_ANIMATION_PLAYBACK",() => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);

    checkConnection();
    let basepath: string;
    test(`Get basepath`, async () => {
        let fileListResponse = await msgController.getFileList("$BASE",0);
        basepath = fileListResponse.directory;
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        let OpenFileResponse: CARTA.IOpenFileAck;
        test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async () => {
            assertItem.fileOpen[0].directory = basepath + "/" + assertItem.filelist.directory;
            OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
            let res1 = await Stream(CARTA.RegionHistogramData,1);
            console.log(res1);
            expect(true).toEqual(true);
            
        },openFileTimeout);

        test(`(Step 1)"${assertItem.fileOpen[0].file}" SetCursor & setSpatialRequest responses should arrive within ${readFileTimeout} ms`, async()=>{
            msgController.setCursor(assertItem.initSetCursor);
            let res2 = await Stream(CARTA.SpatialProfileData,1);
            console.log(res2);

            msgController.setSpatialRequirements(assertItem.initSpatialRequirements);
            let res3 = await Stream(CARTA.SpatialProfileData,1);
            console.log(res3);

        },readFileTimeout)

        test(`(Step 1)"${assertItem.fileOpen[0].file}" RasterTileData and RasterTileSync`, async () => {
            msgController.addRequiredTiles(assertItem.initTilesReq);
            let res4 = await Stream(CARTA.RasterTileData,1);
            console.log(res4);
            expect(res4[1].tiles.length).toEqual(1);
            expect(res4.length).toEqual(3);

        });

        describe(`Play some channels forwardly`, () => {

            test(`(Step 2)"${assertItem.fileOpen[0].file}" Image should return within ${assertItem.playAnimatorTimeout[0]}:`, async()=>{
                let StartAnimationResponse: CARTA.IStartAnimationAck;
                StartAnimationResponse = await msgController.startAnimation({
                    ...assertItem.startAnimation[0],
                    looping: true,
                    reverse: false,
                    frameRate: 15,
                });
                console.log(StartAnimationResponse);
                expect(StartAnimationResponse.success).toEqual(true);
            });

            let sequence: number[] = [];
            test(`running animation flow:`, async() => {
                for (let i=0; i < assertItem.stopAnimation[0].endFrame.channel-1; i++){
                    msgController.addRequiredTiles(assertItem.addTilesReq[0]);
                    let res7 = await Stream(CARTA.RegionHistogramData,1);
                    console.log(res7);

                    let res8 = await Stream(CARTA.SpatialProfileData,1);
                    console.log(res8);

                    let res9 = await Stream(CARTA.RasterTileData,1)
                    console.log(res9);
                    sequence.push(res9[0].channel);

                    msgController.sendAnimationFlowControl({
                        ...assertItem.animationFlowControl[0],
                        receivedFrame: {
                            channel: i+1,
                            stokes: 0
                        },
                        timestamp: Long.fromNumber(Date.now()),
                    });
                }
            },assertItem.playAnimatorTimeout[0]);

            test(`stop animation`, async() => {
                msgController.stopAnimation(assertItem.stopAnimation[0]);
                msgController.setChannels(assertItem.setImageChannel[0]);

                let res10 = await Stream(CARTA.RasterTileData,1);
                console.log(res10);
                sequence.push(res10[1].channel)
                console.log(sequence);
                expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation[0].endFrame.channel);
            })
        })

    });

    afterAll(() => msgController.closeConnection());
});