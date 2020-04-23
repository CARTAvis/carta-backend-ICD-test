import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
import * as Long from "long";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = 7000;//config.timeout.openFile;
let readFileTimeout: number = 7000;//config.timeout.readFile; //5000
let playImageTimeout: number = config.timeout.playImages;
let sleepTimeout: number = config.timeout.sleep;
let playAnimatorTimeout = 5000000;//config.timeout.playAnimator

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    startAnimation: CARTA.IStartAnimation[];
    stopAnimation: CARTA.IStopAnimation[];
    animationFlowControl: CARTA.IAnimationFlowControl[];
    setImageChannel: CARTA.ISetImageChannels[];
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
            file: "cube_A_02400_z00100.fits",
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
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_19200_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
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
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_19200_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
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
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_19200_z00100.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 9,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 0, y: 0 },
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
                lastFrame: { channel: 999, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                requiredTiles: {
                    fileId: 0,
                    tiles: [0],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 9,
                },
            },
        ],
    stopAnimation:
        [
            {
                fileId: 0,
                endFrame: { channel: 46, stokes: 0 },
            },
        ],
    animationFlowControl:
        [
            {
                fileId: 0,
                animationId: 1,
            },
        ],
    setImageChannel:
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

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms)).then(() => { console.log('sleep!') });
        }

        describe(`Go to "${assertItem.fileOpen[index].directory}" folder and open image "${assertItem.fileOpen[index].file}":": `, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, connectTimeout);

            test(`(Step 1)"${assertItem.fileOpen[index].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                await Connection.send(CARTA.OpenFile, fileOpen);
                await Connection.receiveAny()
                await Connection.receiveAny() // OpenFileAck | RegionHistogramData
            }, openFileTimeout);

            let ack: AckStream;
            test(`(Step 1)"${assertItem.fileOpen[index].file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);

                ack = await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length + 2) as AckStream;
                // console.log(ack)
            }, readFileTimeout);

            describe(`(Step 2):Play some channels forwardly`, () => {
                let AnimateStreamData: AckStream[] = [];
                let sequence: number[] = [];
                test(`Image should return one after one and the last channel is correct:`, async () => {
                    await sleep(sleepTimeout);
                    await Connection.send(CARTA.StartAnimation, {
                        ...assertItem.startAnimation[0],
                        looping: true,
                        reverse: false,
                        frameRate: 15,
                    });
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
                    let SAAck = await Connection.receive(CARTA.StartAnimationAck);
                    expect(SAAck.success).toBe(true);

                    for (let i = 0; i < assertItem.stopAnimation[0].endFrame.channel; i++) {
                        AnimateStreamData.push(await Connection.stream(assertItem.startAnimation[0].requiredTiles.tiles.length + 5) as AckStream);
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
                    let lastRasterImageData = await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length + 2) as AckStream;
                    console.log(lastRasterImageData); // RasterTileData * 1 + RasterTileSync *2 (start & end)
                    console.log(AnimateStreamData[40]); // RasterTileData * 1 + SpatialProfileData * 2 + RegionHistogramData * 1 + RasterTileSync *2 (start & end)
                    console.log(sequence); // show looping sequence

                    expect(sequence[sequence.length - 1]).toEqual(assertItem.stopAnimation[0].endFrame.channel);

                }, playAnimatorTimeout);
            });

        });

        afterAll(() => Connection.close());
    });
});
