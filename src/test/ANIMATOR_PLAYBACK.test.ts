import { CARTA } from "carta-protobuf";

import * as Long from "long";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let playImageTimeout: number = config.timeout.playImages;
let sleepTimeout: number = config.timeout.sleep;
let playAnimatorTimeout = config.timeout.playAnimator;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
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
        file: "M17_SWex.image",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
        },
        {
            fileId: 0,
            compressionQuality: 9,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
        },
        {
            fileId: 0,
            compressionQuality: 9,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
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
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                matchedFrames: {},
            },
            {
                fileId: 0,
                startFrame: { channel: 19, stokes: 0 },
                firstFrame: { channel: 9, stokes: 0 },
                lastFrame: { channel: 19, stokes: 0 },
                deltaFrame: { channel: -1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                matchedFrames: {},
            },
            {
                fileId: 0,
                startFrame: { channel: 9, stokes: 0 },
                firstFrame: { channel: 9, stokes: 0 },
                lastFrame: { channel: 19, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                matchedFrames: {},
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
                endFrame: { channel: 18, stokes: 0 },
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
            {
                fileId: 0,
                animationId: 3,
            },
            {
                fileId: 0,
                animationId: 4,
            },
            {
                fileId: 0,
                animationId: 5,
            },
            {
                fileId: 0,
                animationId: 6,
            },
            {
                fileId: 0,
                animationId: 7,
            },
        ],
    setImageChannel:
        [
            {
                fileId: 0,
                channel: 10,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
            {
                fileId: 0,
                channel: 18,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
            {
                fileId: 0,
                channel: 10,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [33558529, 33558528, 33562625, 33554433, 33562624, 33558530, 33554432, 33562626, 33554434, 33566721, 33566720, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
        ],
    reverseAnimation:
        [
            {
                fileId: 0,
                startFrame: { channel: 20, stokes: 0 },
                firstFrame: { channel: 10, stokes: 0 },
                lastFrame: { channel: 20, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                reverse: true,
                looping: true,
                matchedFrames: {},
            },
            {
                fileId: 0,
                startFrame: { channel: 20, stokes: 0 },
                firstFrame: { channel: 10, stokes: 0 },
                lastFrame: { channel: 20, stokes: 0 },
                deltaFrame: { channel: -1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                reverse: false,
                looping: true,
                matchedFrames: {},
            },
        ],
    blinkAnimation:
    {
        fileId: 0,
        startFrame: { channel: 3, stokes: 0 },
        firstFrame: { channel: 3, stokes: 0 },
        lastFrame: { channel: 10, stokes: 0 },
        deltaFrame: { channel: 7, stokes: 0 },
        matchedFrames: {},
        requiredTiles: {
            fileId: 0,
            tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 9,
        },
        looping: true,
        frameRate: 5,
        reverse: false,
    },
};

describe("ANIMATOR_PLAYBACK test: Testing animation playback", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.register);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms)).then(() => { console.log('sleep!') });
    }

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        }, connectTimeout);

        describe(`(Step 1) Initialization: the open image`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                await Connection.send(CARTA.CloseFile, { fileId: 0 });
                await Connection.openFile(assertItem.fileOpen);
            }, openFileTimeout);

            let ack: AckStream;
            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);

                ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                expect(ack.RasterTileData.length).toBe(assertItem.addTilesReq[0].tiles.length);
            }, playImageTimeout);

        });

        describe(`(Step 2):Play some channels forwardly`, () => {
            let AnimateStreamData: AckStream[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one and the last channel is correct:`, async () => {
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[0],
                    looping: true,
                    reverse: false,
                    frameRate: 5,
                });
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                let SAAck = await Connection.receive(CARTA.StartAnimationAck);
                expect(SAAck.success).toBe(true);

                for (let i = 0; i < assertItem.stopAnimation[0].endFrame.channel; i++) {
                    AnimateStreamData.push(await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false));
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[0],
                            receivedFrame: {
                                channel: AnimateStreamData[i].RasterTileData[0].channel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                };
                // Pick up the streaming messages
                // Channel 11 & 12: RasterTileData + RasterTileSync(start & end) + SpatialProfileData + RegionHistogramData
                let RetreiveMessages = await Connection.stream(assertItem.startAnimation[0].requiredTiles.tiles.length * 2 + 4 + 2 + 2);

                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[0]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0])
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation[0].endFrame.channel);

            }, playAnimatorTimeout)

            test(`Received image channels should be in sequence`, async () => {
                console.warn(`(Step 2) Sequent channel index: ${sequence}`);
                AnimateStreamData.map((imageData, index) => {
                    let j = (index + assertItem.startAnimation[0].startFrame.channel + assertItem.startAnimation[0].deltaFrame.channel) - 1.;
                    // let i = 3 * Math.abs(assertItem.stopAnimation[0].endFrame.channel - assertItem.startAnimation[0].firstFrame.channel) + 5;
                    // let j = i-- % Math.abs(1 + assertItem.startAnimation[0].lastFrame.channel - assertItem.startAnimation[0].firstFrame.channel) + assertItem.startAnimation[0].firstFrame.channel;
                    expect(sequence[index]).toEqual(j);
                });
            });
        });

        describe(`(Step 3) Play some channels backwardly with looping`, () => {
            let AnimateStreamData: AckStream[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await sleep(sleepTimeout);
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[1],
                    looping: true,
                    reverse: false,
                    frameRate: 5,
                });
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < 13; i++){//assertItem.stopAnimation[0].endFrame.channel; i++) {
                    AnimateStreamData.push(await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream);
                    let currentChannel = AnimateStreamData[i].RasterTileData[0].channel;
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[1],
                            receivedFrame: {
                                channel: currentChannel,//AnimateStreamData[i].RasterTileData[0].channel,
                                stokes: 0,
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                };
                // Pick up the streaming messages
                // Channel 17 & 16: RasterTileData + RasterTileSync(start & end) + SpatialProfileData + RegionHistogramData
                let RetreiveMessages = await Connection.stream(assertItem.startAnimation[1].requiredTiles.tiles.length * 2 + 4 + 2 + 2);

                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[1]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[1]);
                let lastRasterImageData = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
                // sequence.push(lastRasterImageData.RasterTileData[0].channel);

                expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation[1].endFrame.channel);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.warn(`(Step 3) Sequent channel index: ${sequence}`);
                let i = 2 * Math.abs(assertItem.startAnimation[1].lastFrame.channel - assertItem.startAnimation[1].firstFrame.channel) + 1;
                AnimateStreamData.map((imageData, index) => {
                    let j = i-- %Math.abs(1 + assertItem.startAnimation[1].lastFrame.channel - assertItem.startAnimation[1].firstFrame.channel) + assertItem.startAnimation[1].firstFrame.channel;
                    expect(imageData.RasterTileData[0].channel).toEqual(j);
                });
            });

        });

        describe(`(Step 4 )Play some channels forwardly with looping until stop`, () => {
            let AnimateStreamData: AckStream[] = [];
            let lastRasterImageData: AckStream;
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await sleep(sleepTimeout);
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[2],
                    looping: true,
                    reverse: false,
                    frameRate: 5,
                });
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[2]);
                await Connection.receive(CARTA.StartAnimationAck);

                for (let i = 0; i < 13; i++){ //2 * Math.abs(assertItem.startAnimation[2].lastFrame.channel - assertItem.startAnimation[2].firstFrame.channel + 1); i++) {
                    AnimateStreamData.push(await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream);
                    let currentChannel = AnimateStreamData[i].RasterTileData[0].channel;
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[2],
                            receivedFrame: {
                                channel: currentChannel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                };
                // Pick up the streaming messages
                // Channel 11 & 12: RasterTileData + RasterTileSync(start & end) + SpatialProfileData + RegionHistogramData
                let RetreiveMessages = await Connection.stream(assertItem.startAnimation[2].requiredTiles.tiles.length * 2 + 4 + 2 + 2);

                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[2]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[2]);

                lastRasterImageData = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
                // sequence.push(lastRasterImageData.RasterTileData[0].channel);

            }, playAnimatorTimeout);

            test(`Last channel should be received after stop and should be ${JSON.stringify(assertItem.stopAnimation[2].endFrame.channel)}`, async () => {
                console.warn(`(Step 4) Sequent channel index: ${sequence}`);
                console.warn('(Step 4) Last Raster Tile channel:', lastRasterImageData.RasterTileData[0].channel);
                expect(lastRasterImageData.RasterTileData[0].channel).toEqual(assertItem.stopAnimation[2].endFrame.channel);
            });
        });

        describe(`(Step 5) Play images round-trip`, () => {
            let AnimateStreamData: AckStream[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await sleep(sleepTimeout);
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[0],
                    reverse: true,
                    looping: true,
                });
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                await Connection.receive(CARTA.StartAnimationAck);

                for (let i = 0; i < 3 * Math.abs(assertItem.startAnimation[0].lastFrame.channel - assertItem.startAnimation[0].firstFrame.channel); i++) {
                    // console.log(i);
                    AnimateStreamData.push(await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[3],
                            receivedFrame: {
                                channel: AnimateStreamData[i].RasterTileData[0].channel,
                                stokes: 0,
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                };
                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[2]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[2])
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence and then reverse:`, async () => {
                console.warn(`(Step 5) Channel index in roundtrip: ${sequence}`);
                let previous: number = assertItem.startAnimation[0].lastFrame.channel;
                expect(Math.abs(sequence[sequence.length - 1] - previous)).toEqual(0);
            });
        });

        describe(`(Step 6) Play all images backwardly using method 1`, () => {
            let AnimateStreamData: AckStream[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await sleep(sleepTimeout);
                await Connection.send(CARTA.StartAnimation, assertItem.reverseAnimation[0]);
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < Math.abs(assertItem.reverseAnimation[0].lastFrame.channel - assertItem.reverseAnimation[0].firstFrame.channel); i++) {
                    AnimateStreamData.push(await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[4],
                            receivedFrame: {
                                channel: AnimateStreamData[i].RasterTileData[0].channel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                }
                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[0]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0])
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.warn(`(Step 6) Backward channel index with method 1: ${sequence}`);
                AnimateStreamData.map((imageData, index) => {
                    expect(sequence[index]).toEqual(assertItem.reverseAnimation[0].startFrame.channel - index);
                });
            });
        });

        describe(`(Step 6) Play all images backwardly using method 2`, () => {
            let AnimateStreamData: AckStream[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await sleep(sleepTimeout);
                await Connection.send(CARTA.StartAnimation, assertItem.reverseAnimation[1]);
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < Math.abs(assertItem.reverseAnimation[1].lastFrame.channel - assertItem.reverseAnimation[1].firstFrame.channel); i++) {
                    AnimateStreamData.push(await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[5],
                            receivedFrame: {
                                channel: AnimateStreamData[i].RasterTileData[0].channel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                }
                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[0]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0])
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            }, playAnimatorTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.warn(`(Step 6) Backward channel index with method 2: ${sequence}`);
                AnimateStreamData.map((imageData, index) => {
                    expect(sequence[index]).toEqual(assertItem.reverseAnimation[1].startFrame.channel - index);
                });
            });
        });

        // assertItem.reverseAnimation.map((animation, index) => {
        //     describe(`(Step 6) Play all images backwardly using method${index + 1}`, () => {
        //         let AnimateStreamData: AckStream[] = [];
        //         let sequence: number[] = [];
        //         test(`Image should return one after one`, async () => {
        //             await sleep(sleepTimeout);
        //             await Connection.send(CARTA.StartAnimation, animation);
        //             await Connection.receive(CARTA.StartAnimationAck);
        //             for (let i = 0; i < Math.abs(animation.lastFrame.channel - animation.firstFrame.channel); i++) {
        //                 AnimateStreamData.push(await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream);
        //                 await Connection.send(CARTA.AnimationFlowControl,
        //                     {
        //                         ...assertItem.animationFlowControl[4 + index],
        //                         receivedFrame: {
        //                             channel: AnimateStreamData[i].RasterTileData[0].channel,
        //                             stokes: 0
        //                         },
        //                         timestamp: Long.fromNumber(Date.now()),
        //                     }
        //                 );
        //                 sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
        //             }
        //             await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[0]);
        //             await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0])
        //             await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        //         }, playAnimatorTimeout);

        //         test(`Received image channels should be in sequence`, async () => {
        //             console.warn(`(Step 6) Backward channel index with method${index + 1}: ${sequence}`);
        //             AnimateStreamData.map((imageData, index) => {
        //                 expect(sequence[index]).toEqual(animation.startFrame.channel - index);
        //             });
        //         });
        //     });
        // });

        // describe(`(Step 7) Blink images between ${assertItem.blinkAnimation.firstFrame.channel} and ${assertItem.blinkAnimation.lastFrame.channel}`, () => {
        //     let AnimateStreamData: AckStream[] = [];
        //     let sequence: number[] = [];
        //     test(`Image should return one after one`, async () => {
        //         await sleep(sleepTimeout);
        //         await Connection.send(CARTA.StartAnimation, assertItem.blinkAnimation);
        //         await Connection.receive(CARTA.StartAnimationAck);
        //         for (let i = 0; i < 11; i++) {
        //             AnimateStreamData.push(await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream);
        //             await Connection.send(CARTA.AnimationFlowControl,
        //                 {
        //                     ...assertItem.animationFlowControl[6],
        //                     receivedFrame: {
        //                         channel: AnimateStreamData[i].RasterTileData[0].channel,
        //                         stokes: 0
        //                     },
        //                     timestamp: Long.fromNumber(Date.now()),
        //                 }
        //             );
        //             sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
        //         }
        //         await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[0]);
        //         await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0])
        //         await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        //     }, playAnimatorTimeout);

        //     test(`Received image channels should be in sequence`, async () => {
        //         console.warn(`(Step 7) Blink channel index: ${sequence}`);
        //         AnimateStreamData.map((imageData, index) => {
        //             expect(imageData.RasterTileData[0].channel === assertItem.blinkAnimation.firstFrame.channel || imageData.RasterTileData[0].channel === assertItem.blinkAnimation.lastFrame.channel).toBe(true);
        //         });
        //     });
        // });
    });

    test(`close file`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    afterAll(() => Connection.close());

});