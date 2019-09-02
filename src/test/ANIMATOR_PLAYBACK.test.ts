import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
import * as Long from "long";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let playTimeout = config.timeout.playImages;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    fileOpens: CARTA.IOpenFile;
    startAnimation: CARTA.IStartAnimation;
    startAnimationAck: CARTA.IStartAnimationAck;
    stopAnimation: CARTA.IStopAnimation;
    animationFlowControl: CARTA.IAnimationFlowControl;
}
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
    {
        fileId: 0,
        startFrame: {channel: 0, stokes: 0},
        firstFrame: {channel: 0, stokes: 0},
        lastFrame: {channel: 24, stokes: 0},
        deltaFrame: {channel: 1, stokes: 0},
        imageView: {
            fileId: 0,
            imageBounds: {xMax: 640, yMax: 800},
            mip: 4,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 16,
        },
    },
    startAnimationAck:
    {},
    stopAnimation:
    {
        fileId: 0,
        endFrame: {channel: 10, stokes: 0},
    },
    animationFlowControl:
    {
        fileId: 0,
        animationId: 0, 
    },
}

describe("ANIMATOR_PLAYBACK test: Testing animation playback", () => {   
    let Connection: WebSocket;
    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }        
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open images`, () => {

        beforeAll( async () => {            
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, assertItem.fileOpens);
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
        });

        describe(`Play all images`, () => {
            let RasterImageData: CARTA.RasterImageData[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await Utility.setEventAsync(Connection, CARTA.StartAnimation, assertItem.startAnimation);
                await Utility.getEventAsync(Connection, CARTA.StartAnimationAck);
                for(let i=assertItem.startAnimation.startFrame.channel;i<assertItem.startAnimation.lastFrame.channel;i++) {
                    RasterImageData.push(<CARTA.RasterImageData> await Utility.getEventAsync(Connection, CARTA.RasterImageData));
                    await Utility.setEventAsync(Connection, CARTA.AnimationFlowControl,
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
            }, playTimeout);

            test(`Received image channels should be in sequence`, async () => {
                RasterImageData.map((imageData, index) => {
                    expect(imageData.channel).toEqual(++index);
                });
                console.log(`Sequent channel index: ${sequence}`);
            });

            test(`Received image size should be ${JSON.stringify(assertItem.startAnimation.imageView.imageBounds)}`, async () => {
                RasterImageData.map((imageData, index) => {
                    expect(imageData.imageBounds).toEqual(assertItem.startAnimation.imageView.imageBounds);
                });
            });
        });

        describe(`Play some images until stop`, () => {
            let RasterImageData: CARTA.RasterImageData[] = [];
            test(`Image should return one after one`, async () => {
                await Utility.setEventAsync(Connection, CARTA.StartAnimation, assertItem.startAnimation);
                await Utility.getEventAsync(Connection, CARTA.StartAnimationAck);
                for(let i=assertItem.startAnimation.startFrame.channel;i<assertItem.stopAnimation.endFrame.channel;i++) {
                    RasterImageData.push(<CARTA.RasterImageData> await Utility.getEventAsync(Connection, CARTA.RasterImageData));
                    await Utility.setEventAsync(Connection, CARTA.AnimationFlowControl,
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
                await Utility.setEventAsync(Connection, CARTA.StopAnimation, assertItem.stopAnimation);
                let RasterImageData = <CARTA.RasterImageData> await Utility.getEventAsync(Connection, CARTA.RasterImageData);
                expect(RasterImageData.channel).toEqual(assertItem.stopAnimation.endFrame.channel);
            });
        });

        describe(`Play images round-trip`, () => {
            let RasterImageData: CARTA.RasterImageData[] = [];
            let sequence: number[] = [];
            test(`Image should return one after one`, async () => {
                await Utility.setEventAsync(Connection, CARTA.StartAnimation, 
                    {
                        ...assertItem.startAnimation, 
                        reverse: true,
                    }
                );
                await Utility.getEventAsync(Connection, CARTA.StartAnimationAck);
                for(let i=assertItem.startAnimation.startFrame.channel;i<assertItem.startAnimation.lastFrame.channel*2;i++) {
                    RasterImageData.push(<CARTA.RasterImageData> await Utility.getEventAsync(Connection, CARTA.RasterImageData));
                    await Utility.setEventAsync(Connection, CARTA.AnimationFlowControl,
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
            }, playTimeout);

            test(`Received image channels should be in sequence and then reverse`, async () => {
                RasterImageData.map((imageData, index) => {
                    expect(imageData.channel).toEqual(index<assertItem.startAnimation.lastFrame.channel?index:assertItem.startAnimation.lastFrame.channel*2-index);
                });
                console.log(`Channel index in roundtrip: ${sequence}`);
            });

            test(`Received image size should be ${JSON.stringify(assertItem.startAnimation.imageView.imageBounds)}`, async () => {
                RasterImageData.map((imageData, index) => {
                    expect(imageData.imageBounds).toEqual(assertItem.startAnimation.imageView.imageBounds);
                });
            });
        });
    });

    afterAll( () => Connection.close());
});