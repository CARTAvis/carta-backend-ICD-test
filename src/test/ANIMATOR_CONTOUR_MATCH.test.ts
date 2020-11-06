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
    register: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles;
    setContour: CARTA.ISetContourParameters[];
    startAnimation: CARTA.IStartAnimation;
    stopAnimation: CARTA.IStopAnimation;
    setImageChannel: CARTA.ISetImageChannels[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
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
            file: "M17_SWex.image",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 1,
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
        {
            fileId: 1,
            referenceFileId: 1,
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
    ],
    startAnimation: {
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
        matchedFrames: {
            [1]: {
                frameNumbers: [
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
                    10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
                    20, 21, 22, 23, 24,
                ],
            },
        },
    },
    stopAnimation:
    {
        fileId: 0,
        endFrame: { channel: 10, stokes: 0 },
    },
    setImageChannel: [
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
            fileId: 1,
            channel: 0,
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

describe("ANIMATOR_CONTOUR_MATCH: Testing animator playback with matching two set of contour lines", () => {

    let Connection: Client;
    describe(`Register a session`, () => {
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen[0]);
            await Connection.stream(2);
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen[1]);
            await Connection.stream(2); // OpenFileAck | RegionHistogramData
        }, openFileTimeout);

        describe(`Preparation`, () => {
            test(`Contour set`, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                await Connection.streamUntil((type, data) => {
                    return type == CARTA.RasterTileSync ? !data.endSync : true;
                });
                await Connection.send(CARTA.SetContourParameters, assertItem.setContour[0]);
                await Connection.stream(assertItem.setContour[0].levels.length);
                await Connection.send(CARTA.SetContourParameters, assertItem.setContour[1]);
                await Connection.stream(assertItem.setContour[1].levels.length);
            }, readFileTimeout);
        });
        describe(`Play some channels forwardly`, () => {

            let sequence: number[] = [];
            let contourImageData: CARTA.ContourImageData[] = [];
            test(`Assert ContourImageData.channel = RasterTileData.channel`, async () => {
                await Connection.send(CARTA.StartAnimation, assertItem.startAnimation);
                expect((await Connection.receive(CARTA.StartAnimationAck)).success).toBe(true);

                let Ack: AckStream;
                for (let i = 0; i < assertItem.stopAnimation.endFrame.channel; i++) {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                    Ack = await Connection.streamUntil((type, data, ack) => {
                        return ack.ContourImageData.length < assertItem.setContour[0].levels.length * assertItem.fileOpen.length;
                    });
                    contourImageData = contourImageData.concat(Ack.ContourImageData);
                    expect(Ack.ContourImageData.slice(-1)[0].channel).toEqual(Ack.RasterTileData.slice(-1)[0].channel);
                    let currentChannel = Ack.RasterTileSync.slice(-1)[0].channel;
                    sequence.push(currentChannel);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            fileId: 0,
                            animationId: 0,
                            receivedFrame: {
                                channel: currentChannel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                };

            }, playAnimatorTimeout)

            test(`Assert the last channel = StopAnimation.endFrame`, async () => {
                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                await Connection.streamUntil((type, data) => {
                    return type == CARTA.RasterTileSync ? !data.endSync : true;
                });
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[1]);
                await Connection.streamUntil((type, data) => {
                    return type == CARTA.RasterTileSync ? !data.endSync : true;
                });
                expect(sequence.slice(-1)[0]).toEqual(assertItem.stopAnimation.endFrame.channel);
            }, readFileTimeout);

            test(`Received image channels should be in sequence`, async () => {
                sequence.map((id, index) => {
                    let channelId = (index + assertItem.startAnimation.startFrame.channel + assertItem.startAnimation.deltaFrame.channel) - 1.;
                    expect(id).toEqual(channelId);
                });
            });

            test(`Assert a series of ContourImageData`, async () => {
                for (let i = 1; i <= assertItem.stopAnimation.endFrame.channel; i++) {
                    let testSet = contourImageData.filter(data => data.progress == 1 && data.channel == i);
                    expect(testSet.length).toEqual(assertItem.setContour[0].levels.length * assertItem.fileOpen.length);
                    expect(testSet.filter(data => data.fileId == 0).length).toEqual(assertItem.setContour[0].levels.length);
                    expect(testSet.filter(data => data.fileId == 1).length).toEqual(assertItem.setContour[1].levels.length);
                }
                expect(contourImageData.length).toEqual(assertItem.stopAnimation.endFrame.channel * assertItem.setContour[0].levels.length * assertItem.fileOpen.length);
                contourImageData.map(data => {
                    expect(data.referenceFileId).toEqual(1);
                });
            });
        });
        afterAll(() => Connection.close());
    });
});