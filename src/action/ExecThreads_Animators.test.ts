import { CARTA } from "carta-protobuf";

import Long from "long";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait, Monitor } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testFile: string = "cube_A/cube_A_03200_z00100.fits"
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let fileopenTimeout: number = config.timeout.readLargeImage;
let animatorTimeout: number = config.timeout.readLargeImage;
let animatorFlame: number = config.repeat.animation;
let monitorPeriod: number = config.wait.monitor;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
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
    fileOpen: {
        file: testFile,
        directory: testSubdirectory,
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
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
    startAnimation: {
        fileId: 0,
        startFrame: { channel: 1, stokes: 0 },
        firstFrame: { channel: 0, stokes: 0 },
        lastFrame: { channel: animatorFlame, stokes: 0 },
        deltaFrame: { channel: 1, stokes: 0 },
        requiredTiles: {
            fileId: 0,
            tiles: [
                50343939, 50343938, 50339843, 50339842, 50348035,
                50343940, 50348034, 50339844, 50343937, 50335747,
                50339841, 50335746, 50348036, 50348033, 50335748,
                50335745, 50352131, 50343941, 50352130, 50339845,
                50343936, 50331651, 50339840, 50331650, 50352132,
                50348037, 50352129, 50335749, 50348032, 50331652,
                50335744, 50331649, 50352133, 50356227, 50343942,
                50356226, 50339846, 50352128, 50331653, 50356228,
                50348038, 50331648, 50356225, 50335750, 50356229,
                50352134, 50356224, 50331654, 50356230
            ],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 9,
        },
        looping: false,
        reverse: false,
        frameRate: 30,
    },
    stopAnimation: {
        fileId: 0,
        endFrame: { channel: animatorFlame, stokes: 0 },
    },
}
let testMainThreads = [
    2, 4, 6, 8,
    10, 12, 14, 16,
];
let testOmpThreads = [
    4, 8, 12, 16,
    20, 24, 28, 32,
];
testMainThreads.map(mainThread => {
    testOmpThreads.map(ompThread => {
        let testServerUrl: string = `${config.localHost}:${config.port}`;
        describe(`Animator action: thread=${mainThread}, omp thread=${ompThread}`, () => {
            let Connection: Client;
            let cartaBackend: any;
            let fileNameInit: string = testFile.substr(testFile.search('/') + 1).replace('.', '_') + "_" + mainThread + "_" + ompThread;
            let logFile = fileNameInit + "_animator.txt";
            let usageFile = fileNameInit + "_animator_usage.txt";
            test(`Empty the record files`, async () => {
                await EmptyTxt(logFile);
                await EmptyTxt(usageFile);
            });

            test(`CARTA is ready`, async () => {
                cartaBackend = await Socket.CartaBackend(
                    logFile,
                    config.port,
                    mainThread,
                    ompThread,
                );
                await Wait(config.wait.exec);
            }, execTimeout + config.wait.exec);

            describe(`Start the action: animator`, () => {
                test(`Connection is ready`, async () => {
                    Connection = new Client(testServerUrl);
                    await Connection.open();
                    await Connection.send(CARTA.RegisterViewer, assertItem.register);
                    await Connection.receive(CARTA.RegisterViewerAck);
                }, connectTimeout);

                describe(`start the action`, () => {
                    let ackStream: AckStream;
                    test(`should open the file "${testFile}"`, async () => {
                        await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                        await Connection.receiveAny(); // OpenFileAck
                    }, fileopenTimeout);

                    test(`should play animator with ${assertItem.stopAnimation.endFrame.channel} frames`, async () => {
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

                        let monitor;
                        for (let channel: number = 1; channel <= assertItem.stopAnimation.endFrame.channel; channel++) {
                            monitor = Monitor(cartaBackend.pid, monitorPeriod);
                            while (true) {
                                ackStream = await Connection.stream(1) as AckStream;
                                if (ackStream.RasterTileSync.length > 0) {
                                    if (ackStream.RasterTileSync[0].endSync) {
                                        break;
                                    }
                                }
                            };
                            clearInterval(monitor.id);
                            if (monitor.data.cpu.length === 0) {
                                await AppendTxt(usageFile, await Usage(cartaBackend.pid));
                            } else {
                                await AppendTxt(usageFile, monitor.data);
                            }
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

                        await Connection.send(CARTA.CloseFile, { fileId: -1 });
                    }, animatorTimeout * animatorFlame);
                });
            });

            afterAll(async done => {
                await Connection.close();
                cartaBackend.kill();
                cartaBackend.on("close", () => done());
            }, execTimeout);
        });
    });
});