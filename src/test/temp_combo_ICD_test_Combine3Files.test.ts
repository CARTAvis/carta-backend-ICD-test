import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
import { async } from "q";
import { AckStream } from "./testUtilityFunction";
import { AnyARecord } from "dns";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile; //3000
let regionTimeout = config.timeout.region;
let cubeHistogramTimeout = 800000;//config.timeout.cubeHistogram;
let messageReturnTimeout = config.timeout.readFile; //3000

interface AssertItem {
    register: CARTA.IRegisterViewer;
    file: CARTA.IOpenFile[];
    imageChannels: CARTA.ISetImageChannels[];
    cursor: CARTA.ISetCursor[];
    addRequiredTilesGroup: CARTA.IAddRequiredTiles[];
    histogram: CARTA.ISetHistogramRequirements[];
    regionGroup: CARTA.ISetRegion[];
    setSpectralRequirementsGroup: CARTA.ISetSpectralRequirements[];
    spatial: CARTA.ISetSpatialRequirements[];
    startAnimation: CARTA.IStartAnimation[];
    animationFlowControl: CARTA.IAnimationFlowControl[];
    stopAnimation: CARTA.IStopAnimation[];
    AnimationSetImageChannels: CARTA.ISetImageChannels[];
    imageDataInfo: CARTA.ISetImageView[];
    AnimateImageChannels: CARTA.ISetImageChannels[];
};

let assertItem: AssertItem = {
    register:
    {
        sessionId: 0,
        // apiKey: "",
        clientFeatureFlags: 5,
    },
    file: [
        {
            directory: testSubdirectory,
            file: "S255_IR_sci.spw29.cube.I.pbcor.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "IRAS_17150-3224_sci.spw27.cube.I.manual.image.pbcor.fits",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "GV_Tau_sci.spw0.cube.I.manual.image.pbcor.fits",
            hdu: "",
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    imageChannels: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [16777216, 16781312, 16777217, 16781313], //???
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
                tiles: [16777216, 16781312, 16777217, 16781313], //???
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 2,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [16777216, 16781312, 16777217, 16781313], //???
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
    cursor: [
        {
            fileId: 0,
            point: { x: 961, y: 961 },
        },
        {
            fileId: 1,
            point: { x: 961, y: 961 },
        },
        {
            fileId: 2,
            point: { x: 961, y: 961 },
        },
    ],
    addRequiredTilesGroup: [
        {
            fileId: 0,
            tiles: [
                33554432, 33554433, 33554434, 33554435,
                33558528, 33558529, 33558530, 33558531,
                33562624, 33562625, 33562626, 33562627,
                33566720, 33566721, 33566722, 33566723
            ],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 1,
            tiles: [
                33554432, 33554433, 33554434,
                33558528, 33558529, 33558530,
                33562624, 33562625, 33562626
            ],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 2,
            tiles: [
                33554432, 33554433, 33554434,
                33558528, 33558529, 33558530,
                33562624, 33562625, 33562626
            ],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    ],
    histogram: [
        {
            fileId: 0,
            regionId: -2,
            histograms: [{ channel: -2, numBins: -1 }],
        },
        {
            fileId: 1,
            regionId: -2,
            histograms: [{ channel: -2, numBins: -1 }],
        },
        {
            fileId: 2,
            regionId: -2,
            histograms: [{ channel: -2, numBins: -1 }],
        },
    ],
    regionGroup:
        [
            {
                fileId: 0,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 1560 }, { x: 400, y: 400 }],
                rotation: 0,
            },
            {
                fileId: 0,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 1160 }, { x: 400, y: 400 }],
                rotation: 0,
            },
            {
                fileId: 0,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 760 }, { x: 400, y: 400 }],
                rotation: 0,
            },
            {
                fileId: 0,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 360 }, { x: 400, y: 400 }],
                rotation: 0,
            },

            {
                fileId: 1,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 1560 }, { x: 400, y: 400 }],
                rotation: 0,
            },
            {
                fileId: 1,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 1160 }, { x: 400, y: 400 }],
                rotation: 0,
            },
            {
                fileId: 1,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 760 }, { x: 400, y: 400 }],
                rotation: 0,
            },
            {
                fileId: 1,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 360 }, { x: 400, y: 400 }],
                rotation: 0,
            },

            {
                fileId: 2,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 1560 }, { x: 400, y: 400 }],
                rotation: 0,
            },
            {
                fileId: 2,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 1160 }, { x: 400, y: 400 }],
                rotation: 0,
            },
            {
                fileId: 2,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 760 }, { x: 400, y: 400 }],
                rotation: 0,
            },
            {
                fileId: 2,
                regionId: -1,
                regionName: "",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 960, y: 360 }, { x: 400, y: 400 }],
                rotation: 0,
            },
        ],

    setSpectralRequirementsGroup: [
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 0,
            regionId: 2,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 0,
            regionId: 3,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 0,
            regionId: 4,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },

        {
            fileId: 1,
            regionId: 5,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 1,
            regionId: 6,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 1,
            regionId: 7,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 1,
            regionId: 8,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },

        {
            fileId: 2,
            regionId: 9,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 2,
            regionId: 10,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 2,
            regionId: 11,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 2,
            regionId: 12,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
    ],

    spatial: [
        {
            fileId: 0,
            regionId: 0,
            spatialProfiles: ["x", "y"],
        },
        {
            fileId: 1,
            regionId: 0,
            spatialProfiles: ["x", "y"],
        },
        {
            fileId: 2,
            regionId: 0,
            spatialProfiles: ["x", "y"],
        },
    ],
    startAnimation:
        [
            {
                fileId: 0,
                startFrame: { channel: 1, stokes: 0 },
                firstFrame: { channel: 0, stokes: 0 },
                lastFrame: { channel: 1916, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                looping: true,
                reverse: false,
                frameRate: 15,
                imageView: {
                    fileId: 0,
                    imageBounds: { xMin: 0, xMax: 1920, yMin: 0, yMax: 1920 },
                    mip: 4,
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 16,
                    numSubsets: 4,
                },
            },
            {
                fileId: 1,
                startFrame: { channel: 1, stokes: 0 },
                firstFrame: { channel: 0, stokes: 0 },
                lastFrame: { channel: 1919, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                looping: true,
                reverse: false,
                frameRate: 15,
                imageView: {
                    fileId: 0,
                    imageBounds: { xMin: 0, xMax: 2800, yMin: 0, yMax: 2800 },
                    mip: 4,
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 16,
                    numSubsets: 4,
                },
            },
            {
                fileId: 2,
                startFrame: { channel: 1, stokes: 0 },
                firstFrame: { channel: 0, stokes: 0 },
                lastFrame: { channel: 249, stokes: 0 },
                deltaFrame: { channel: 1, stokes: 0 },
                looping: true,
                reverse: false,
                frameRate: 15,
                imageView: {
                    fileId: 0,
                    imageBounds: { xMin: 0, xMax: 8400, yMin: 0, yMax: 8400 },
                    mip: 4,
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 16,
                    numSubsets: 4,
                },
            },
        ],
    animationFlowControl:
        [
            {
                fileId: 0,
                animationId: 0,
            },
            {
                fileId: 1,
                animationId: 0,
            },
            {
                fileId: 2,
                animationId: 0,
            },
        ],
    stopAnimation:
        [
            {
                fileId: 0,
                endFrame: { channel: 21, stokes: 0 },
            },
            {
                fileId: 1,
                endFrame: { channel: 21, stokes: 0 },
            },
            {
                fileId: 2,
                endFrame: { channel: 21, stokes: 0 },
            },
        ],
    AnimationSetImageChannels:
        [
            {
                fileId: 0,
                channel: 21,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [16777216, 16781312, 16777217, 16781313],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
            {
                fileId: 1,
                channel: 21,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [16777216, 16781312, 16777217, 16781313],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
            {
                fileId: 2,
                channel: 21,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [16777216, 16781312, 16777217, 16781313],
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
        ],
    imageDataInfo:
        [
            {
                fileId: 0,
                imageBounds: { xMin: 0, xMax: 1920, yMin: 0, yMax: 1920 },
                mip: 4,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 16,
                numSubsets: 4,
            },
            {
                fileId: 1,
                imageBounds: { xMin: 0, xMax: 2800, yMin: 0, yMax: 2800 },
                mip: 4,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 16,
                numSubsets: 4,
            },
            {
                fileId: 2,
                imageBounds: { xMin: 0, xMax: 8400, yMin: 0, yMax: 8400 },
                mip: 4,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 16,
                numSubsets: 4,
            },
        ],
    AnimateImageChannels:
        [
            {
                fileId: 0,
                channel: 21,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [16777216, 16781312, 16777217, 16781313], //???
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
            {
                fileId: 1,
                channel: 21,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [16777216, 16781312, 16777217, 16781313], //???
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
            {
                fileId: 2,
                channel: 21,
                stokes: 0,
                requiredTiles: {
                    fileId: 0,
                    tiles: [16777216, 16781312, 16777217, 16781313], //???
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11,
                },
            },
        ],
};

describe(`One user, One backend, Multiple heavy actions with Multiple large-size data:`, () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`check connection readystate is open`, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    assertItem.file.map((file, FileIndex) => {
        console.log('Deal with:', file.file);
        describe(`Go to "${testSubdirectory}" folder and open image "${file.file}" (Step 2)": `, () => {
            beforeAll(async () => {
                if (FileIndex === 0) {
                    await Connection.send(CARTA.CloseFile, { fileId: -1, });
                };
                await Connection.send(CARTA.OpenFile, file);
                await Connection.receive(CARTA.OpenFileAck);
                await Connection.receive(CARTA.RegionHistogramData); // return OpenFileAck | RegionHistogramData (not sure the sequence)
            });

            test(`check connection readystate is open`, () => {
                expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            });

            let RasterTileDataTempTotal: any;
            test(`Set "image channels" & "cursor (Step 3):`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.imageChannels[FileIndex]);
                RasterTileDataTempTotal = await Connection.stream(assertItem.imageChannels[FileIndex].requiredTiles.tiles.length);
                expect(RasterTileDataTempTotal.RasterTileData.length).toEqual(assertItem.imageChannels[FileIndex].requiredTiles.tiles.length)

                await Connection.send(CARTA.SetCursor, assertItem.cursor[FileIndex]);
                await Connection.receive(CARTA.SpatialProfileData);
            });

            describe(`Add required tiles (Step 4):`, () => {
                let art_total: any;
                test(`Receive RASTER_TILE_DATA x ${assertItem.addRequiredTilesGroup[FileIndex].tiles.length}`, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTilesGroup[FileIndex]);
                    art_total = await Connection.stream(assertItem.addRequiredTilesGroup[FileIndex].tiles.length);
                    expect(art_total.RasterTileData.length).toBe(assertItem.addRequiredTilesGroup[FileIndex].tiles.length)
                }, readFileTimeout)
            });

            describe(`Set histogram requirements (Step 5)`, () => {
                test(`REGION_HISTOGRAM_DATA should arrive completely within ${cubeHistogramTimeout} ms:`, async () => {
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.histogram[FileIndex]);
                    let RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                    let ReceiveProgress: number = RegionHistogramDataTemp.progress;

                    if (ReceiveProgress != 1) {
                        while (ReceiveProgress < 1) {
                            RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                            ReceiveProgress = RegionHistogramDataTemp.progress
                            console.warn('Step 5 Region Histogram progress :', ReceiveProgress)
                        };
                        expect(ReceiveProgress).toEqual(1);
                    };
                }, cubeHistogramTimeout);
            });

            describe(`Set multi regions (Step 6)`, () => {
                assertItem.regionGroup.map((region, index) => {
                    if (region.fileId === FileIndex) {
                        let SetRegionAckTemp: CARTA.SetRegionAck;
                        test(`SET_REGION_ACK should arrive within ${regionTimeout} ms`, async () => {
                            await Connection.send(CARTA.SetRegion, assertItem.regionGroup[index]);
                            SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck) as CARTA.SetRegionAck;
                            expect(SetRegionAckTemp.regionId).toBe(index + 1);
                        }, regionTimeout);
                    }
                });
            });

            describe(`set spectral requirement 1 (Step 7)`, () => {
                let SpectralProfileDataTemp: CARTA.ISetSpectralRequirements;
                test(`Step 7 should return`, async () => {
                    if (assertItem.setSpectralRequirementsGroup[FileIndex * 4].fileId === FileIndex) {
                        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[FileIndex * 4]);
                        SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);

                        let ReceiveProgress: number = SpectralProfileDataTemp.progress;

                        if (ReceiveProgress != 1) {
                            while (ReceiveProgress < 1) {
                                SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                                ReceiveProgress = SpectralProfileDataTemp.progress
                                console.warn('File #' + FileIndex + ' Step 7 SpectralProfileData progress :', ReceiveProgress)
                            };
                            expect(ReceiveProgress).toEqual(1);
                        };

                    };
                }, cubeHistogramTimeout);
            });

            describe(`set spectral requirement 2 (Step 8)`, () => {
                let SpectralProfileDataTemp: CARTA.ISetSpectralRequirements;
                test(`Step 8 should return`, async () => {
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[FileIndex * 4 + 1]);
                    SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                    let ReceiveProgress: number = SpectralProfileDataTemp.progress;

                    if (ReceiveProgress != 1) {
                        while (ReceiveProgress < 1) {
                            SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                            ReceiveProgress = SpectralProfileDataTemp.progress;
                            console.warn('File #' + FileIndex + ' Step 8 SpectralProfileData progress :', ReceiveProgress)
                        };
                        expect(ReceiveProgress).toEqual(1);
                    };

                }, cubeHistogramTimeout);
            });

            describe(`set spectral requirement 3 (Step 9)`, () => {
                let SpectralProfileDataTemp: CARTA.ISetSpectralRequirements;
                test(`Step 9 should return`, async () => {
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[FileIndex * 4 + 2]);
                    SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                    let ReceiveProgress1: number = SpectralProfileDataTemp.progress;
                    let Step9Requiest2ReceiveComplete: boolean = false;

                    if (ReceiveProgress1 != 1) {
                        while (ReceiveProgress1 < 1) {
                            SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                            ReceiveProgress1 = SpectralProfileDataTemp.progress;
                            console.warn('File #' + FileIndex + ' Step 9 request 1 for region ' + SpectralProfileDataTemp.regionId + ' progress:', ReceiveProgress1);

                            let SpectralProfileDataTemp2: CARTA.ISetSpectralRequirements;
                            if ((Step9Requiest2ReceiveComplete === false) && (ReceiveProgress1 > 0.5)) {
                                await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[FileIndex * 4 + 3]);
                                let ReceiveProgress2: number = 0;
                                while (ReceiveProgress2 < 1) {
                                    SpectralProfileDataTemp2 = await Connection.receive(CARTA.SpectralProfileData);
                                    if (SpectralProfileDataTemp2.regionId == assertItem.setSpectralRequirementsGroup[FileIndex * 4 + 3].regionId) {
                                        ReceiveProgress2 = SpectralProfileDataTemp2.progress;
                                    };
                                    console.log('File #' + FileIndex + ' Step 9 request 2 for region ' + SpectralProfileDataTemp2.regionId + ' progress:', ReceiveProgress2)
                                };
                                if (ReceiveProgress2 === 1) {
                                    console.log('File #' + FileIndex + ' Step 9 request 2 for region' + SpectralProfileDataTemp2.regionId + ' complete!')
                                    Step9Requiest2ReceiveComplete = true;
                                    break;
                                }
                            };
                        };
                    };
                    // console.warn('Step 9 request 1 for region ' + SpectralProfileDataTemp.regionId + ' progress: ', ReceiveProgress1)
                }, 1000000);
            });

            describe(`Set spatial requirements (Step 10)`, () => {
                test(`SPATIAL_PROFILE_DATA should arrive within ${regionTimeout} ms`, async () => {
                    console.log(assertItem.spatial[FileIndex]);
                    await Connection.send(CARTA.SetSpatialRequirements, assertItem.spatial[FileIndex])
                    let SpatialProfileDataTempStep10 = await Connection.receive(CARTA.SpatialProfileData);
                }, regionTimeout);
            });

            describe(`Start Animation: Play all images forwardly with looping (Step 11)`, () => {
                let RasterImageData: CARTA.RasterImageData[] = [];
                let sequence: number[] = [];
                let Ack: any;
                let lastRasterImageData: any;
                let lastSpatialProfileData: any;
                test(`Start animation?`, async () => {
                    await Connection.send(CARTA.StartAnimation, assertItem.startAnimation[FileIndex]);
                    Ack = await Connection.receive(CARTA.StartAnimationAck);
                    expect(Ack.success).toBe(true);

                    for (let i = 0; i < 20; i++) {
                        RasterImageData.push(await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData);
                        sequence.push(RasterImageData[i].channel);
                    };

                    console.log(RasterImageData);
                    console.log(sequence);

                    await Connection.send(CARTA.StopAnimation, assertItem.stopAnimation[FileIndex]);
                    lastRasterImageData = await Connection.receive(CARTA.RasterImageData) as CARTA.RasterImageData;
                    lastSpatialProfileData = await Connection.receive(CARTA.SpatialProfileData) as CARTA.SpectralProfileData;

                    console.log(lastRasterImageData.channel); // lastRasterImage, channel: 20
                    console.log(lastSpatialProfileData)

                }, 60000);

                test(`Check the channel of last RasterImageData`, () => {
                    expect(lastRasterImageData.channel).toEqual(21);
                });

                let RasterTileDataTempTotal: any;
                test(`Check animation set image channels:`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.AnimationSetImageChannels[FileIndex]);
                    RasterTileDataTempTotal = await Connection.stream(assertItem.AnimationSetImageChannels[FileIndex].requiredTiles.tiles.length);
                    expect(RasterTileDataTempTotal.RasterTileData.length).toEqual(assertItem.AnimationSetImageChannels[FileIndex].requiredTiles.tiles.length);
                }, 10000);

            });


        });

    });
    afterAll(() => Connection.close());
});