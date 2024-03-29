import { CARTA } from "carta-protobuf";

import * as Long from "long";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let playAnimatorTimeout = config.timeout.playAnimator

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setContour: CARTA.ISetContourParameters;
    startAnimation: CARTA.IStartAnimation[];
    stopAnimation: CARTA.IStopAnimation[];
    animationFlowControl: CARTA.IAnimationFlowControl[];
    setImageChannel: CARTA.ISetImageChannels[];
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
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setContour: {
        fileId: 0,
        referenceFileId: 0,
        imageBounds: {
            xMin: 0, xMax: 640,
            yMin: 0, yMax: 800,
        },
        levels: [-0.01, 0.01],
        smoothingMode: CARTA.SmoothingMode.GaussianBlur,
        smoothingFactor: 4,
        decimationFactor: 4,
        compressionLevel: 8,
        contourChunkSize: 100000,
    },
    startAnimation:
        [
            {
                fileId: 0,
                startFrame: { channel: 1, stokes: 0 },
                firstFrame: { channel: 0, stokes: 0 },
                lastFrame: { channel: 24, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                looping: false,
                reverse: false,
                frameRate: 5,
            },
            {
                fileId: 0,
                startFrame: { channel: 20, stokes: 0 },
                firstFrame: { channel: 0, stokes: 0 },
                lastFrame: { channel: 24, stokes: 0 },
                deltaFrame: { channel: -1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                looping: false,
                reverse: false,
                frameRate: 5,
            },
        ],
    stopAnimation:
        [
            {
                fileId: 0,
                endFrame: { channel: 10, stokes: 0 },
            },
            {
                fileId: 0,
                endFrame: { channel: 10, stokes: 0 },
            },
        ],
    animationFlowControl:
        [
            {
                fileId: 0,
                animationId: 1,
            },
            {
                fileId: 0,
                animationId: 2,
            },
        ],
    setImageChannel:
        [
            {
                fileId: 0,
                channel: 0,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
            {
                fileId: 0,
                channel: 20,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
        ],
};

describe("ANIMATOR_CONTOUR: Testing animation playback with contour lines", () => {

    let Connection: Client;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.registerViewer(assertItem.registerViewer);

            await Connection.openFile(assertItem.openFile);
        }, openFileTimeout);

        test(`Preparation`, async () => {
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
            await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            await Connection.send(CARTA.SetContourParameters, assertItem.setContour);
            await Connection.stream(assertItem.setContour.levels.length);
        }, readFileTimeout);

        describe(`(Case 1):Play some channels forwardly`, () => {
            test(`Preparation`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            }, readFileTimeout);

            let sequence: number[] = [];
            let contourImageData: CARTA.ContourImageData[] = [];
            test(`Image should return one after one and the last channel is correct:`, async () => {
                await Connection.send(CARTA.StartAnimation, assertItem.startAnimation[0]);
                expect((await Connection.receive(CARTA.StartAnimationAck)).success).toBe(true);

                let Ack: AckStream;
                for (let i = 0; i < assertItem.stopAnimation[0].endFrame.channel; i++) {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                    Ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                    let currentChannel = Ack.RasterTileData.slice(-1)[0].channel;
                    sequence.push(currentChannel);
                    contourImageData = contourImageData.concat(Ack.ContourImageData);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[0],
                            receivedFrame: {
                                channel: currentChannel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                };
                // Pick up the streaming messages
                // Channel 11 & 12: RasterTileData + RasterTileSync(start & end) + ContourImageData + RegionHistogramData
                let RetreiveMessages = await Connection.stream(assertItem.startAnimation[0].requiredTiles.tiles.length * 2 + 4 + 4 + 2);
                
                // Send StopAnimator
                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[0]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                expect(sequence.slice(-1)[0]).toEqual(assertItem.stopAnimation[0].endFrame.channel);
            }, playAnimatorTimeout)

            test(`Received image channels should be in sequence`, async () => {
                console.warn(`(Step 1) Sequent channel index: ${sequence}`);
                sequence.map((id, index) => {
                    let channelId = (index + assertItem.startAnimation[0].startFrame.channel + assertItem.startAnimation[0].deltaFrame.channel) - 1.;
                    expect(id).toEqual(channelId);
                });
            });

            test(`Received image contours should be in sequence`, async () => {
                for (let i = 1; i <= assertItem.stopAnimation[0].endFrame.channel; i++) {
                    expect(contourImageData.filter(data => data.progress == 1 && data.channel == i).length).toEqual(assertItem.setContour.levels.length);
                }
            });
        });
        afterAll(() => Connection.close());
    });
});

describe("ANIMATOR_CONTOUR: Testing animation playback with contour lines", () => {

    let Connection: Client;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.registerViewer(assertItem.registerViewer);

            await Connection.openFile(assertItem.openFile);
        }, openFileTimeout);

        test(`Preparation`, async () => {
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
            await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            await Connection.send(CARTA.SetContourParameters, assertItem.setContour);
            await Connection.stream(assertItem.setContour.levels.length);
        }, readFileTimeout);

        describe(`(Case 2) Play some channels backwardly`, () => {
            test(`Preparation`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[1]);
                let tt = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            }, readFileTimeout);

            let sequence: number[] = [];
            let contourImageData: CARTA.ContourImageData[] = [];
            test(`Image should return one after one and the last channel is correct:`, async () => {
                await Connection.send(CARTA.StartAnimation, assertItem.startAnimation[1]);
                expect((await Connection.receive(CARTA.StartAnimationAck)).success).toBe(true);

                let Ack: AckStream;
                for (let i = assertItem.startAnimation[1].startFrame.channel; i > assertItem.stopAnimation[1].endFrame.channel - 1; i--) {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                    Ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                    let currentChannel = Ack.RasterTileData.slice(-1)[0].channel;
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[1],
                            receivedFrame: {
                                channel: currentChannel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(currentChannel);
                    contourImageData = contourImageData.concat(Ack.ContourImageData);
                    // console.log(contourImageData)
                };
                // Pick up the streaming messages
                // Channel 8 & 7: RasterTileData + RasterTileSync(start & end) + ContourImageData + RegionHistogramData
                let RetreiveMessages = await Connection.stream(assertItem.startAnimation[1].requiredTiles.tiles.length *  2 + 4 + 4 + 2);

                // Send StopAnimator
                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[1]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[1]);
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                expect(sequence.slice(-1)[0]).toEqual(assertItem.stopAnimation[1].endFrame.channel - 1);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.warn(`(Step 2) Sequent channel index: ${sequence}`);
                sequence.map((id, index) => {
                    let channelId = -index + assertItem.startAnimation[1].startFrame.channel - 1;
                    expect(id).toEqual(channelId);
                });
            });

            test(`Received image contours should be in sequence`, async () => {
                for (let i = assertItem.startAnimation[1].startFrame.channel -1 ; i > assertItem.stopAnimation[1].endFrame.channel - 2; i--) {
                    expect(contourImageData.filter(data => data.progress == 1 && data.channel == (i)).length).toEqual(assertItem.setContour.levels.length);
                }
            });
        });

        afterAll(() => Connection.close());
    });
});