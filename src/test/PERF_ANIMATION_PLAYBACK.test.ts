import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import * as Long from "long";
import config from "./config.json";
import { async } from "q";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let testSubdirectory2 = config.path.QA;
let connectTimeout: number = config.timeout.connection;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels[];
    cursor: CARTA.ISetCursor;
    startAnimation: CARTA.IStartAnimation[];
    imageDataInfo: CARTA.ISetImageView[];
    animationFlowControl: CARTA.IAnimationFlowControl;
    stopAnimation: CARTA.IStopAnimation;
    imageChannels: CARTA.ISetImageChannels[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z01000.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_04800_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_19200_z00100.fits",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER, //Problem getting tile layer =0 x=0 y=0
        // },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_02400_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_04800_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_19200_z00100.image",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_02400_z00100.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_04800_z00100.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_19200_z00100.hdf5",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
    ],
    setImageChannel: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
    cursor: {
        fileId: 0,
        point: { x: 0, y: 0 },
    },
    startAnimation:
        [
            {
                fileId: 0,
                startFrame: { channel: 1, stokes: 0 },
                firstFrame: { channel: 0, stokes: 0 },
                lastFrame: { channel: 999, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                imageView: {
                    fileId: 0,
                    imageBounds: { xMin: 0, xMax: 1600, yMin: 0, yMax: 1600 },
                    mip: 2,
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
                looping: true,
                reverse: false,
                frameRate: 15,
            },
        ],
    imageDataInfo:
        [
            {
                fileId: 0,
                imageBounds: { xMin: 0, xMax: 1600, yMin: 0, yMax: 1600 },
                mip: 2,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 9,
                numSubsets: 4,
            }
        ],
    animationFlowControl:
    {
        fileId: 0,
        animationId: 0,
    },
    stopAnimation:
    {
        fileId: 0,
        endFrame: { channel: 46, stokes: 0 },
    },
    imageChannels:
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
};

describe("PERF_CUBE_HISTOGRAM", () => {
    assertItem.fileOpen.map((fileOpen: CARTA.IOpenFile, index) => {
        let Connection: Client;
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        // test(`(Step 0) Connection Open?`, () => {
        //     expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        // });

        describe(`Go to "${assertItem.fileOpen[index].directory}" folder and open image "${assertItem.fileOpen[index].file}":": `, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1, });
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen[index]);
                await Connection.receive(CARTA.OpenFileAck);
                await Connection.receive(CARTA.RegionHistogramData); // return OpenFileAck | RegionHistogramData (not sure the sequence)
            });

            test(`(Step 0) Connection Open?`, () => {
                expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            });

            let RasterImageDataTemp1: any;
            test(`(Step 1) Open file and Set "image channels" & "cursor:`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                await Connection.send(CARTA.SetCursor, assertItem.cursor);
                RasterImageDataTemp1 = await Connection.receive(CARTA.RasterTileData);
                // console.log(RasterImageDataTemp1);
            });

            describe(`(Step 2) Animation: `, () => {
                let RasterImageData: CARTA.RasterImageData[] = [];
                let sequence: number[] = [];
                let Ack: any;
                let FirstChannelSpatialProfileData: any;
                let lastRasterImageData: any;
                let lastSpatialProfileData: any;
                let tt: any;
                let tt2: any;
                // let AnimationSetImageChannelsAck: any;
                test(`send start_animation`, async () => {
                    await Connection.send(CARTA.StartAnimation, assertItem.startAnimation[0]);
                    await Connection.send(CARTA.SetImageView, assertItem.imageDataInfo[0]);
                    Ack = await Connection.receive(CARTA.StartAnimationAck);
                    expect(Ack.success).toBe(true);

                    for (let i = 0; i < 46; i++) {
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
                    };

                    // console.log(RasterImageData);
                    // console.log(sequence);
                    expect(sequence[sequence.length - 1]).toBe(46);

                    await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation);
                }, 100000)

                let AnimationSetImageChannelsAck: any;
                let AnimationHistogramAck: any;
                test(`Check animation set image channels:`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.imageChannels[0]);
                    AnimationSetImageChannelsAck = await Connection.receive(CARTA.RasterTileData);
                    // AnimationHistogramAck = await Connection.receive(CARTA.RegionHistogramData);
                    console.log(AnimationSetImageChannelsAck);
                    // console.log(AnimationHistogramAck);
                }, 10000);

            });
        });
        afterAll(() => Connection.close());
    });
});