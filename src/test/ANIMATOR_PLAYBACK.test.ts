import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
import * as Long from "long";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let playTimeout = config.timeout.playImages;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    fileOpens: CARTA.IOpenFile;
    startAnimation: CARTA.IStartAnimation[];
    stopAnimation: CARTA.IStopAnimation;
    animationFlowControl: CARTA.IAnimationFlowControl;
    reverseAnimation: CARTA.IStartAnimation[];
    blinkAnimation: CARTA.IStartAnimation;
};
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    fileOpens:
    {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    startAnimation:
    [
        {
            fileId: 0,
            startFrame: { channel: 10, stokes: 0 },
            firstFrame: { channel: 10, stokes: 0 },
            lastFrame: { channel: 20, stokes: 0 },
            deltaFrame: { channel: 1, stokes: 0 },
            imageView: {
                fileId: 0,
                imageBounds: { xMax: 640, yMax: 800 },
                mip: 4,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 16,
            },
        },
        {
            fileId: 0,
            startFrame: { channel: 19, stokes: 0 },
            firstFrame: { channel: 9, stokes: 0 },
            lastFrame: { channel: 19, stokes: 0 },
            deltaFrame: { channel: -1, stokes: 0 },
            imageView: {
                fileId: 0,
                imageBounds: { xMax: 640, yMax: 800 },
                mip: 4,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 16,
            },
        },
    ],
    stopAnimation:
    {
        fileId: 0,
        endFrame: { channel: 18, stokes: 0 },
    },
    animationFlowControl:
    {
        fileId: 0,
        animationId: 0,
    },
    reverseAnimation:
    [
        {
            fileId: 0,
            startFrame: { channel: 20, stokes: 0 },
            firstFrame: { channel: 10, stokes: 0 },
            lastFrame: { channel: 20, stokes: 0 },
            deltaFrame: { channel: 1, stokes: 0 },
            imageView: {
                fileId: 0,
                imageBounds: { xMax: 640, yMax: 800 },
                mip: 4,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 16,
            },
            reverse: true,
        },
        {
            fileId: 0,
            startFrame: { channel: 20, stokes: 0 },
            firstFrame: { channel: 10, stokes: 0 },
            lastFrame: { channel: 20, stokes: 0 },
            deltaFrame: { channel: -1, stokes: 0 },
            imageView: {
                fileId: 0,
                imageBounds: { xMax: 640, yMax: 800 },
                mip: 4,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 16,
            },
        },
    ],
    blinkAnimation:
    {
        fileId: 0,
        startFrame: { channel: 3, stokes: 0 },
        firstFrame: { channel: 3, stokes: 0 },
        lastFrame: { channel: 10, stokes: 0 },
        deltaFrame: { channel: 7, stokes: 0 },
        imageView: {
            fileId: 0,
            imageBounds: { xMax: 640, yMax: 800 },
            mip: 4,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 16,
        },
        looping: true,
    },
};

describe("ANIMATOR_PLAYBACK test: Testing animation playback", () => {
    let Connection: Client;
    beforeAll( async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open images`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpens);
            await Connection.receive(CARTA.OpenFileAck);
            await Connection.receive(CARTA.RegionHistogramData);
        });

        describe(`Play all images forwardly with looping`, () => {
            let RasterImageData: CARTA.RasterImageData[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[0],
                    looping: true,
                });
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < 2 * Math.abs(assertItem.startAnimation[0].lastFrame.channel - assertItem.startAnimation[0].firstFrame.channel) + 1; i++) {
                    RasterImageData.push(await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl,
                            receivedFrame: {
                                channel: RasterImageData[i].channel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(RasterImageData[i].channel);
                }
                await Connection.send(CARTA.StopAnimation, CARTA.StopAnimation);
                let lastRasterImageData = await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData;
                sequence.push(lastRasterImageData.channel);
            }, playTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.log(`Sequent channel index: ${sequence}`);
                let i = 0;
                RasterImageData.map((imageData, index) => {
                    let j = i++ % Math.abs(1 + assertItem.startAnimation[0].lastFrame.channel - assertItem.startAnimation[0].firstFrame.channel) + assertItem.startAnimation[0].firstFrame.channel;
                    expect(imageData.channel).toEqual(j);
                });
            });

            test(`Received image size should be ${JSON.stringify(assertItem.startAnimation[0].imageView.imageBounds)}`, async () => {
                RasterImageData.map((imageData, index) => {
                    expect(imageData.imageBounds).toEqual(assertItem.startAnimation[0].imageView.imageBounds);
                });
            });
        });

        describe(`Play all images backwardly with looping`, () => {
            let RasterImageData: CARTA.RasterImageData[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation, {
                    ...assertItem.startAnimation[1],
                    looping: true,
                });
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < 2 * Math.abs(assertItem.startAnimation[1].lastFrame.channel - assertItem.startAnimation[1].firstFrame.channel) + 1; i++) {
                    RasterImageData.push(await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl,
                            receivedFrame: {
                                channel: RasterImageData[i].channel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(RasterImageData[i].channel);
                }
                await Connection.send(CARTA.StopAnimation, CARTA.StopAnimation);
                let lastRasterImageData = await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData;
                sequence.push(lastRasterImageData.channel);
            }, playTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.log(`Sequent channel index: ${sequence}`);
                let i = 2 * Math.abs(assertItem.startAnimation[1].lastFrame.channel - assertItem.startAnimation[1].firstFrame.channel) + 1;
                RasterImageData.map((imageData, index) => {
                    let j = i-- % Math.abs(1 + assertItem.startAnimation[1].lastFrame.channel - assertItem.startAnimation[1].firstFrame.channel) + assertItem.startAnimation[1].firstFrame.channel;
                    expect(imageData.channel).toEqual(j);
                });
            });

            test(`Received image size should be ${JSON.stringify(assertItem.startAnimation[1].imageView.imageBounds)}`, async () => {
                RasterImageData.map((imageData, index) => {
                    expect(imageData.imageBounds).toEqual(assertItem.startAnimation[1].imageView.imageBounds);
                });
            });
        });
    
        describe(`Play some images until stop`, () => {
            let RasterImageData: CARTA.RasterImageData[] = [];
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation, assertItem.startAnimation[0]);
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < Math.abs(assertItem.stopAnimation.endFrame.channel-assertItem.startAnimation[0].firstFrame.channel); i++) {
                    RasterImageData.push(await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl,
                            receivedFrame: {
                                channel: RasterImageData[i].channel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                }
            }, playTimeout);

            test(`Last image on channel${JSON.stringify(assertItem.stopAnimation.endFrame)} should receive after stop`, async () => {
                await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation);
                let RasterImageData = await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData;
                expect(RasterImageData.channel).toEqual(assertItem.stopAnimation.endFrame.channel);
            });
        });

        describe(`Play images round-trip`, () => {
            let RasterImageData: CARTA.RasterImageData[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation,
                    {
                        ...assertItem.startAnimation[0],
                        reverse: true,
                    }
                );
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < 3 * Math.abs(assertItem.startAnimation[0].lastFrame.channel-assertItem.startAnimation[0].firstFrame.channel); i++) {
                    RasterImageData.push(await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl,
                            receivedFrame: {
                                channel: RasterImageData[i].channel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(RasterImageData[i].channel);
                }
                await Connection.send(CARTA.StopAnimation, CARTA.StopAnimation);
                let lastRasterImageData = await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData;
                sequence.push(lastRasterImageData.channel);
            }, playTimeout);

            test(`Received image channels should be in sequence and then reverse`, async () => {
                console.log(`Channel index in roundtrip: ${sequence}`);
                let previous: number = assertItem.startAnimation[0].startFrame.channel - 1;
                RasterImageData.map((imageData, index) => {
                    expect(Math.abs(imageData.channel - previous)).toEqual(1);
                    previous = imageData.channel;
                });
            });

            test(`Received image size should be ${JSON.stringify(assertItem.startAnimation[0].imageView.imageBounds)}`, async () => {
                RasterImageData.map((imageData, index) => {
                    expect(imageData.imageBounds).toEqual(assertItem.startAnimation[0].imageView.imageBounds);
                });
            });
        });

        assertItem.reverseAnimation.map( (animation, index) => {
            describe(`Play all images backwardly using method${index+1}`, () => {
                let RasterImageData: CARTA.RasterImageData[] = [];
                let sequence: number[] = [];
                test(`Image should return one after one`, async () => {
                    await Connection.send(CARTA.StartAnimation, animation);
                    await Connection.receive(CARTA.StartAnimationAck);
                    for (let i = 0; i < Math.abs(animation.lastFrame.channel - animation.firstFrame.channel); i++) {
                        RasterImageData.push(await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData);
                        await Connection.send(CARTA.AnimationFlowControl,
                            {
                                ...assertItem.animationFlowControl,
                                receivedFrame: {
                                    channel: RasterImageData[i].channel,
                                    stokes: 0
                                },
                                timestamp: Long.fromNumber(Date.now()),
                            }
                        );
                        sequence.push(RasterImageData[i].channel);
                    }
                    await Connection.send(CARTA.StopAnimation, CARTA.StopAnimation);
                    let lastRasterImageData = await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData;
                    sequence.push(lastRasterImageData.channel);
                }, playTimeout);

                test(`Received image channels should be in sequence`, async () => {
                    console.log(`Reverse channel index: ${sequence}`);
                    RasterImageData.map((imageData, index) => {
                        expect(imageData.channel).toEqual(animation.startFrame.channel-index);
                    });
                });

                test(`Received image size should be ${JSON.stringify(animation.imageView.imageBounds)}`, async () => {
                    RasterImageData.map((imageData, index) => {
                        expect(imageData.imageBounds).toEqual(animation.imageView.imageBounds);
                    });
                });
            });
        });

        describe(`Blink images bewteen ${assertItem.blinkAnimation.firstFrame.channel} and ${assertItem.blinkAnimation.lastFrame.channel}`, () => {
            let RasterImageData: CARTA.RasterImageData[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await Connection.send(CARTA.StartAnimation, assertItem.blinkAnimation);
                await Connection.receive(CARTA.StartAnimationAck);
                for (let i = 0; i < 11; i++) {
                    RasterImageData.push(await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData);
                    await Connection.send(CARTA.AnimationFlowControl,
                        {
                            ...assertItem.animationFlowControl,
                            receivedFrame: {
                                channel: RasterImageData[i].channel,
                                stokes: 0
                            },
                            timestamp: Long.fromNumber(Date.now()),
                        }
                    );
                    sequence.push(RasterImageData[i].channel);
                }
                await Connection.send(CARTA.StopAnimation, CARTA.StopAnimation);
                let lastRasterImageData = await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData;
                sequence.push(lastRasterImageData.channel);
            }, playTimeout);

            test(`Received image channels should be in sequence`, async () => {
                console.log(`Blink channel index: ${sequence}`);
                RasterImageData.map((imageData, index) => {
                    expect(imageData.channel === assertItem.blinkAnimation.firstFrame.channel || imageData.channel === assertItem.blinkAnimation.lastFrame.channel).toBe(true);
                });
            });

            test(`Received image size should be ${JSON.stringify(assertItem.blinkAnimation.imageView.imageBounds)}`, async () => {
                RasterImageData.map((imageData, index) => {
                    expect(imageData.imageBounds).toEqual(assertItem.blinkAnimation.imageView.imageBounds);
                });
            });
        });
    });

    afterAll(async () => await Connection.close());
});