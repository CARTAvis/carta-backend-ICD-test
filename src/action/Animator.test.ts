import { CARTA } from "carta-protobuf";

import Long from "long";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let animatorTimeout: number = config.timeout.playAnimator;
let animatorFlame: number = config.repeat.animation;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor;
    addTilesReq: CARTA.IAddRequiredTiles;
    startAnimation: CARTA.IStartAnimation;
    stopAnimation: CARTA.IStopAnimation;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "cube_A/cube_A_01600_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: []
        },
    },
    addTilesReq:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    startAnimation:{
        fileId: 0,
        startFrame: { channel: 1, stokes: 0 },
        firstFrame: { channel: 0, stokes: 0 },
        lastFrame: { channel: animatorFlame, stokes: 0 },
        deltaFrame: { channel: 1, stokes: 0 },
        requiredTiles: {
            fileId: 0,
            tiles: [50343939, 50343938, 50339843, 50339842, 50348035, 
                    50343940, 50348034, 50339844, 50343937, 50335747, 
                    50339841, 50335746, 50348036, 50348033, 50335748, 
                    50335745, 50352131, 50343941, 50352130, 50339845, 
                    50343936, 50331651, 50339840, 50331650, 50352132, 
                    50348037, 50352129, 50335749, 50348032, 50331652, 
                    50335744, 50331649, 50352133, 50356227, 50343942, 
                    50356226, 50339846, 50352128, 50331653, 50356228, 
                    50348038, 50331648, 50356225, 50335750, 50356229, 
                    50352134, 50356224, 50331654, 50356230],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 9,
        },
        looping: false,
        reverse: false,
        frameRate: 30,
    },    
    stopAnimation:{
        fileId: 0,
        endFrame: { channel: animatorFlame, stokes: 0 },
    },
}

describe("Animator action: ", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);


    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.FileListRequest, assertItem.filelist);
            await Connection.receive(CARTA.FileListResponse);
        }, connectTimeout);

        assertItem.fileOpenGroup.map((fileOpen: CARTA.IOpenFile, index) => {

            describe(`open the file "${fileOpen.file}"`, () => {
                test(`should play animator with ${assertItem.stopAnimation.endFrame.channel} frames`, async () => {
                    let ackStream: AckStream;
                    await Connection.send(CARTA.OpenFile, fileOpen);
                    await Connection.receiveAny(); // OpenFileAck

                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                    while (true) {
                        ackStream = await Connection.stream(1) as AckStream;
                        if (ackStream.RasterTileSync.length > 0) {
                            if (ackStream.RasterTileSync[0].endSync) {
                                break;
                            }
                        }
                    }

                    await Connection.send(CARTA.StartAnimation, assertItem.startAnimation);
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.startAnimation.requiredTiles);
                    await Connection.receive(CARTA.StartAnimationAck);
                    
                    for (let channel: number = 1; channel <= assertItem.stopAnimation.endFrame.channel; channel++) {
                        while (true) {
                            ackStream = await Connection.stream(1) as AckStream;
                            if (ackStream.RasterTileSync.length > 0) {
                                if (ackStream.RasterTileSync[0].endSync) {
                                    break;
                                }
                            }
                        };
                        await Connection.send(CARTA.AnimationFlowControl,
                            {
                                fileId: 0,
                                animationId: 1,
                                receivedFrame: {
                                    channel: channel,
                                    stokes: 0
                                },
                                timestamp: Long.fromNumber(Date.now()),
                            }
                        );
                    }
                    await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation);

                    await new Promise(resolve => setTimeout(resolve, 300));
                    await Connection.send(CARTA.CloseFile, { fileId: -1 });
                }, animatorTimeout);
            });

        });
    });

    afterAll(() => Connection.close());
});