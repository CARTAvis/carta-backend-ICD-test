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
    stopAnimation: CARTA.IStopAnimation;
    animationFlowControl: CARTA.IAnimationFlowControl;
    setImageChannel: CARTA.ISetImageChannels[];
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
    {
        fileId: 0,
        endFrame: { channel: 10, stokes: 0 },
    },
    animationFlowControl:
    {
        fileId: 0,
        animationId: 0,
    },
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
        ]
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

        describe(`(Step 2):Play all images forwardly with looping`, () => {
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

                for (let i = 0; i < assertItem.stopAnimation.endFrame.channel; i++) {
                    AnimateStreamData.push(await Connection.stream(16) as AckStream);
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
                    // console.log(AnimateStreamData[i].Responce) // In principle, each channel should have RasterTileSync *2 (start & end)
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                };

                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0])
                let lastRasterImageData = await Connection.stream(14) as AckStream;
                // console.log(lastRasterImageData); // RasterTileData * 12 + RasterTileSync *2 (start & end)
                // console.log(AnimateStreamData); // RasterTileData * 12 + SpatialProfileData * 1 + RegionHistogramData * 1 + RasterTileSync *2 (start & end)
                // console.log(sequence); // show looping sequence
                expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation.endFrame.channel);

            }, playImageTimeout)

            test(`Received image channels should be in sequence`, async () => {
                console.log(`Sequent channel index: ${sequence}`);
                AnimateStreamData.map((imageData, index) => {
                    let j = (index + assertItem.startAnimation[0].startFrame.channel + assertItem.startAnimation[0].deltaFrame.channel) - 1.;
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
                });
                // await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < 2 * Math.abs(assertItem.startAnimation[1].lastFrame.channel - assertItem.startAnimation[1].firstFrame.channel) + 1; i++) {
                    AnimateStreamData.push(await Connection.stream(16) as AckStream);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl,
                            receivedFrame: {
                                channel: AnimateStreamData[i].RasterTileData[0].channel,
                                stokes: 0,
                                requiredTiles: assertItem.addTilesReq[1],
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(AnimateStreamData[i].RasterTileData[0].channel);
                }
                await Connection.send(CARTA.StopAnimation, assertItem.startAnimation);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0])
                let lastRasterImageData = await Connection.stream(14) as AckStream;
                expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation.endFrame.channel);
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
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[0],
                    looping: true,
                    reverse: false,
                    frameRate: 5,
                });
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                await Connection.receive(CARTA.StartAnimationAck);

                for (let i = 0; i < assertItem.stopAnimation.endFrame.channel; i++) {
                    AnimateStreamData.push(await Connection.stream(16) as AckStream);
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
                    // console.log(AnimateStreamData[i].RasterTileData[0].channel);
                };

            }, playImageTimeout);

            test(`Last image on channel${JSON.stringify(assertItem.stopAnimation.endFrame)} should receive after stop`, async () => {
                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0])
                let lastRasterImageData = await Connection.stream(14) as AckStream;
                expect(lastRasterImageData.RasterTileData[0].channel).toEqual(assertItem.stopAnimation.endFrame.channel);
            });
        });

        describe(`(Step 5) Play images round-trip`, () => {
            let AnimateStreamData: AckStream[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[0],
                    reverse: true,
                    requiredTiles: assertItem.addTilesReq[1]
                });
                // await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                await Connection.receive(CARTA.StartAnimationAck);

                for (let i = 0; i < 3 * Math.abs(assertItem.startAnimation[0].lastFrame.channel - assertItem.startAnimation[0].firstFrame.channel); i++) {
                    AnimateStreamData.push(await Connection.stream(16) as AckStream);
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
                }
                await Connection.send(CARTA.StopAnimation, CARTA.StopAnimation);
                let lastRasterImageData = await Connection.stream(14) as AckStream;
                // console.log(sequence);

            }, playImageTimeout);

            test(`Received image channels should be in sequence and then reverse:`, async () => {
                console.log(`Channel index in roundtrip: ${sequence}`);
                let previous: number = assertItem.startAnimation[0].lastFrame.channel;
                expect(Math.abs(sequence[sequence.length - 1] - previous)).toEqual(0);
            });
        });

    });

    test(`close file`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
    }, connectTimeout);

    afterAll(() => Connection.close());

});