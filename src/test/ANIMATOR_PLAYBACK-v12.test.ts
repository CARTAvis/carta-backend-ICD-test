import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
import { async } from "q";
import * as Long from "long";
import { Field } from "protobufjs";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let playImageTimeout: number = config.timeout.playImages;

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
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
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
                endFrame: { channel: 19, stokes: 0 },
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
                channel: 19,
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
    // reverseAnimation:
    //     [
    //         {
    //             fileId: 0,
    //             startFrame: { channel: 20, stokes: 0 },
    //             firstFrame: { channel: 10, stokes: 0 },
    //             lastFrame: { channel: 20, stokes: 0 },
    //             deltaFrame: { channel: 1, stokes: 0 },
    //             requiredTiles: {
    //                 fileId: 0,
    //                 tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
    //                 compressionType: CARTA.CompressionType.ZFP,
    //                 compressionQuality: 9,
    //             },
    //             reverse: true,
    //         },
    //         // {
    //         //     fileId: 0,
    //         //     startFrame: { channel: 20, stokes: 0 },
    //         //     firstFrame: { channel: 10, stokes: 0 },
    //         //     lastFrame: { channel: 20, stokes: 0 },
    //         //     deltaFrame: { channel: -1, stokes: 0 },
    //         //     requiredTiles: {
    //         //         fileId: 0,
    //         //         tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
    //         //         compressionType: CARTA.CompressionType.ZFP,
    //         //         compressionQuality: 9,
    //         //     },
    //         // },
    //     ],
    // blinkAnimation:
    // {
    //     fileId: 0,
    //     startFrame: { channel: 3, stokes: 0 },
    //     firstFrame: { channel: 3, stokes: 0 },
    //     lastFrame: { channel: 10, stokes: 0 },
    //     deltaFrame: { channel: 7, stokes: 0 },
    //     requiredTiles: {
    //         fileId: 0,
    //         tiles: [33554432, 33558528, 33562624, 33566720, 33554433, 33558529, 33562625, 33566721, 33554434, 33558530, 33562626, 33566722],
    //         compressionType: CARTA.CompressionType.ZFP,
    //         compressionQuality: 9,
    //     },
    //     looping: true,
    // },
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
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        }, connectTimeout);

        describe(`(Step 1) Initialization: the open image"`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                await Connection.send(CARTA.CloseFile, { fileId: 0 });
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                await Connection.receiveAny()
                await Connection.receiveAny() // OpenFileAck | RegionHistogramData
            }, openFileTimeout);

            let ack: AckStream;
            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);

                ack = await Connection.stream(15) as AckStream;
                // console.log(ack); // RasterTileData * 12 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)
                expect(ack.RasterTileData.length).toBe(assertItem.addTilesReq[0].tiles.length);
            }, playImageTimeout);

        });

        describe(`(Step 2):Play all images forwardly`, () => {
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
                    AnimateStreamData.push(await Connection.stream(16) as AckStream);
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
                    // console.log(AnimateStreamData[i].RasterTileData[0].channel) // In principle, each channel should have RasterTileSync *2 (start & end)
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                };

                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[0]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0])
                let lastRasterImageData = await Connection.stream(14) as AckStream;
                // console.log(lastRasterImageData); // RasterTileData * 12 + RasterTileSync *2 (start & end)
                // console.log(AnimateStreamData); // RasterTileData * 12 + SpatialProfileData * 1 + RegionHistogramData * 1 + RasterTileSync *2 (start & end)
                console.log(sequence); // show looping sequence
                expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation[0].endFrame.channel);

            }, playImageTimeout)

            test(`Received image channels should be in sequence`, async () => {
                console.log(`Sequent channel index: ${sequence}`);
                AnimateStreamData.map((imageData, index) => {
                    let j = (index + assertItem.startAnimation[0].startFrame.channel + assertItem.startAnimation[0].deltaFrame.channel) - 1.;
                    // let i = 3 * Math.abs(assertItem.stopAnimation[0].endFrame.channel - assertItem.startAnimation[0].firstFrame.channel) + 5;
                    // let j = i-- % Math.abs(1 + assertItem.startAnimation[0].lastFrame.channel - assertItem.startAnimation[0].firstFrame.channel) + assertItem.startAnimation[0].firstFrame.channel;
                    expect(sequence[index]).toEqual(j);
                });
            });
        });

        describe(`(Step 3) Play all images backwardly with looping`, () => {
            let AnimateStreamData: AckStream[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[1],
                    looping: true,
                    reverse: false,
                    frameRate: 5,
                });
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < 2 * Math.abs(assertItem.startAnimation[1].lastFrame.channel - assertItem.startAnimation[1].firstFrame.channel + 1); i++) {
                    AnimateStreamData.push(await Connection.stream(16) as AckStream);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[1],
                            receivedFrame: {
                                channel: AnimateStreamData[i].RasterTileData[0].channel,
                                stokes: 0,
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                };
                // console.log(AnimateStreamData); // RasterTileData * 12 + SpatialProfileData * 1 + RegionHistogramData * 1 + RasterTileSync *2 (start & end)

                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[1]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[1]);
                let lastRasterImageData = await Connection.stream(16) as AckStream;
                // console.log(lastRasterImageData); // RasterTileData * 12 + SpatialProfileData * 1 + RegionHistogramData * 1 + RasterTileSync *2 (start & end)
                sequence.push(lastRasterImageData.RasterTileData[0].channel);
                // console.log(sequence);

                expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation[1].endFrame.channel);
            }, playImageTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.log(`Sequent channel index: ${sequence}`);
                let i = 2 * Math.abs(assertItem.startAnimation[1].lastFrame.channel - assertItem.startAnimation[1].firstFrame.channel) + 1;
                AnimateStreamData.map((imageData, index) => {
                    let j = i-- % Math.abs(1 + assertItem.startAnimation[1].lastFrame.channel - assertItem.startAnimation[1].firstFrame.channel) + assertItem.startAnimation[1].firstFrame.channel;
                    expect(imageData.RasterTileData[0].channel).toEqual(j);
                });
            });

        });

        describe(`(Step 4 )Play some images until stop`, () => {
            let AnimateStreamData: AckStream[] = [];
            let lastRasterImageData: AckStream;
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[0],
                    looping: true,
                    reverse: false,
                    frameRate: 5,
                });
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                await Connection.receive(CARTA.StartAnimationAck);

                for (let i = 0; i < assertItem.stopAnimation[2].endFrame.channel + 1; i++) {
                    // console.log(i);
                    AnimateStreamData.push(await Connection.stream(16) as AckStream);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl[2],
                            receivedFrame: {
                                channel: AnimateStreamData[i].RasterTileData[0].channel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    // console.log(AnimateStreamData[i].RasterTileData);
                };
                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[2]);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[2]);
                lastRasterImageData = await Connection.stream(16) as AckStream;
                // console.log(lastRasterImageData);
                // console.log(AnimateStreamData);

            }, playImageTimeout);

            test(`Last image on channel${JSON.stringify(assertItem.stopAnimation[2].endFrame)} should receive after stop`, async () => {
                // console.log(lastRasterImageData.RasterTileData[0].channel);
                expect(lastRasterImageData.RasterTileData[0].channel).toEqual(assertItem.stopAnimation[2].endFrame.channel);
            });
        });

        describe(`(Step 5) Play images round-trip`, () => {
            let AnimateStreamData: AckStream[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[0],
                    reverse: true,
                });
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                await Connection.receive(CARTA.StartAnimationAck);

                for (let i = 0; i < 3 * Math.abs(assertItem.startAnimation[0].lastFrame.channel - assertItem.startAnimation[0].firstFrame.channel); i++) {
                    // console.log(i);
                    AnimateStreamData.push(await Connection.stream(16) as AckStream);
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
                let lastRasterImageData = await Connection.stream(16) as AckStream;
                // console.log(lastRasterImageData)
                // console.log(sequence);

            }, playImageTimeout);

            test(`Received image channels should be in sequence and then reverse:`, async () => {
                console.log(`Channel index in roundtrip: ${sequence}`);
                let previous: number = assertItem.startAnimation[0].lastFrame.channel;
                // console.log(previous);
                expect(Math.abs(sequence[sequence.length - 1] - previous)).toEqual(0);
            });
        });

        // assertItem.reverseAnimation.map((animation, index) => {
        //     describe(`(Step 6) Play all images backwardly using method${index + 1}`, () => {
        //         let AnimateStreamData: AckStream[] = [];
        //         let sequence: number[] = [];
        //         test(`Image should return one after one`, async () => {
        //             await Connection.send(CARTA.StartAnimation, animation);
        //             await Connection.receive(CARTA.StartAnimationAck);
        //             for (let i = 0; i < Math.abs(animation.lastFrame.channel - animation.firstFrame.channel); i++) {
        //                 AnimateStreamData.push(await Connection.stream(16) as AckStream);
        //                 await Connection.send(CARTA.AnimationFlowControl,
        //                     {
        //                         ...assertItem.animationFlowControl,
        //                         receivedFrame: {
        //                             channel: AnimateStreamData[i].RasterTileData[0].channel,
        //                             stokes: 0
        //                         },
        //                         timestamp: Long.fromNumber(Date.now()),
        //                         animationid: index + 5,
        //                     }
        //                 );
        //                 sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
        //             }
        //             await Connection.send(CARTA.StopAnimation, CARTA.StopAnimation);
        //             await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[1])
        //             let lastRasterImageData = await Connection.stream(14) as AckStream;
        //             console.log(AnimateStreamData[0].RasterTileData);
        //             console.log(sequence);
        //         }, playImageTimeout);

        //         test(`Received image channels should be in sequence`, async () => {
        //             console.log(`Backward channel index: ${sequence}`);
        //             AnimateStreamData.map((imageData, index) => {
        //                 expect(sequence[index]).toEqual(animation.startFrame.channel - index);
        //             });
        //         });
        //     });
        // });
    });

    test(`close file`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
    }, connectTimeout);

    afterAll(() => Connection.close());

});