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
let cubeHistogramTimeout = 200000;//config.timeout.cubeHistogram;
let messageReturnTimeout = config.timeout.readFile; //3000

interface AssertItem {
    register: CARTA.IRegisterViewer;
    file: CARTA.IOpenFile;
    imageChannels: CARTA.ISetImageChannels[];
    cursor: CARTA.ISetCursor;
    addRequiredTilesGroup: CARTA.IAddRequiredTiles;
    histogram: CARTA.ISetHistogramRequirements;
    regionGroup: CARTA.ISetRegion[];
    setSpectralRequirementsGroup: CARTA.ISetSpectralRequirements[];
    spatial: CARTA.ISetSpatialRequirements[];
    startAnimation: CARTA.IStartAnimation[];
};

let assertItem: AssertItem = {
    register:
    {
        sessionId: 0,
        // apiKey: "",
        clientFeatureFlags: 5,
    },
    file: {
        directory: testSubdirectory,
        file: "S255_IR_sci.spw29.cube.I.pbcor.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
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
    ],
    cursor: {
        fileId: 0,
        point: { x: 961, y: 961 },
    },
    addRequiredTilesGroup: {
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
    histogram: {
        fileId: 0,
        regionId: -2,
        histograms: [{ channel: -2, numBins: -1 }],
    },
    regionGroup: [
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
    ],
    setSpectralRequirementsGroup: [
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.NumPixels,
                        CARTA.StatsType.Sum,
                        CARTA.StatsType.Mean,
                        CARTA.StatsType.RMS,
                        CARTA.StatsType.Sigma,
                        CARTA.StatsType.SumSq,
                        CARTA.StatsType.Min,
                        CARTA.StatsType.Max
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
                        CARTA.StatsType.NumPixels,
                        CARTA.StatsType.Sum,
                        CARTA.StatsType.Mean,
                        CARTA.StatsType.RMS,
                        CARTA.StatsType.Sigma,
                        CARTA.StatsType.SumSq,
                        CARTA.StatsType.Min,
                        CARTA.StatsType.Max
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
                        CARTA.StatsType.NumPixels,
                        CARTA.StatsType.Sum,
                        CARTA.StatsType.Mean,
                        CARTA.StatsType.RMS,
                        CARTA.StatsType.Sigma,
                        CARTA.StatsType.SumSq,
                        CARTA.StatsType.Min,
                        CARTA.StatsType.Max
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
                        CARTA.StatsType.NumPixels,
                        CARTA.StatsType.Sum,
                        CARTA.StatsType.Mean,
                        CARTA.StatsType.RMS,
                        CARTA.StatsType.Sigma,
                        CARTA.StatsType.SumSq,
                        CARTA.StatsType.Min,
                        CARTA.StatsType.Max
                    ],
                }
            ],
        },
    ],
    spatial: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"],
    },
};

describe(`One user, One backend, Multiple heavy actions (Step 1):`, () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.file.file}" (Step 2)": `, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            await Connection.send(CARTA.OpenFile, assertItem.file);
            await Connection.receive(CARTA.OpenFileAck);
            await Connection.receive(CARTA.RegionHistogramData); // return OpenFileAck | RegionHistogramData (not sure the sequence)
        });

        test(`Set "image channels" & "cursor (Step 3):`, async () => {
            await Connection.send(CARTA.SetImageChannels, assertItem.imageChannels[0]);
            let RasterTileDataTempTotal = await Connection.stream(assertItem.imageChannels[0].requiredTiles.tiles.length);
            expect(RasterTileDataTempTotal.RasterTileData.length).toEqual(assertItem.imageChannels[0].requiredTiles.tiles.length)

            await Connection.send(CARTA.SetCursor, assertItem.cursor);
            await Connection.receive(CARTA.SpatialProfileData);
        });

        describe(`Add required tiles (Step 4):`, () => {
            let Ack: AckStream;
            test(`Receive RASTER_TILE_DATA x ${assertItem.addRequiredTilesGroup.tiles.length}`, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTilesGroup);
                let art_total = await Connection.stream(assertItem.addRequiredTilesGroup.tiles.length);
                expect(art_total.RasterTileData.length).toBe(assertItem.addRequiredTilesGroup.tiles.length)
            }, readFileTimeout)
        });

        describe(`Set histogram requirements (Step 5)`, () => {
            test(`REGION_HISTOGRAM_DATA should arrive completely within ${cubeHistogramTimeout} ms:`, async () => {
                await Connection.send(CARTA.SetHistogramRequirements, assertItem.histogram);
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
                // console.log(region)
                let SetRegionAckTemp: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should arrive within ${regionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetRegion, assertItem.regionGroup[index]);
                    SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck) as CARTA.SetRegionAck;
                    expect(SetRegionAckTemp.regionId).toBe(index + 1);
                }, regionTimeout);
            });
        });

        describe(`set spectral requirement 1 (Step 7)`, () => {
            let SpectralProfileDataTemp: CARTA.ISetSpectralRequirements;
            test(`Step 7 should return`, async () => {
                await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[0]);
                SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                let ReceiveProgress: number = SpectralProfileDataTemp.progress;

                if (ReceiveProgress != 1) {
                    while (ReceiveProgress < 1) {
                        SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                        ReceiveProgress = SpectralProfileDataTemp.progress
                        console.warn('Step 7 SpectralProfileData progress :', ReceiveProgress)
                    };
                    expect(ReceiveProgress).toEqual(1);
                };

            }, 10000);
        });

        describe(`set spectral requirement 2 (Step 8)`, () => {
            let SpectralProfileDataTemp: CARTA.ISetSpectralRequirements;
            test(`Step 8 should return`, async () => {
                await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[1]);
                SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                let ReceiveProgress: number = SpectralProfileDataTemp.progress;

                if (ReceiveProgress != 1) {
                    while (ReceiveProgress < 1) {
                        SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                        ReceiveProgress = SpectralProfileDataTemp.progress;
                        console.warn('Step 8 SpectralProfileData progress :', ReceiveProgress)
                    };
                    expect(ReceiveProgress).toEqual(1);
                };

            }, 15000);
        });

        describe(`set spectral requirement 3 (Step 9)`, () => {
            let SpectralProfileDataTemp: CARTA.ISetSpectralRequirements;
            test(`Step 9 should return`, async () => {
                await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[2]);
                SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                let ReceiveProgress1: number = SpectralProfileDataTemp.progress;
                let Step9Requiest2ReceiveComplete: boolean = false;

                if (ReceiveProgress1 != 1) {
                    while (ReceiveProgress1 < 1) {
                        SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                        ReceiveProgress1 = SpectralProfileDataTemp.progress;
                        console.warn('Step 9 request 1 for region ' + SpectralProfileDataTemp.regionId + ' progress:', ReceiveProgress1);

                        let SpectralProfileDataTemp2: CARTA.ISetSpectralRequirements;
                        if ((Step9Requiest2ReceiveComplete === false) && (ReceiveProgress1 > 0.5)) {
                            await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[3]);
                            let ReceiveProgress2: number = 0;
                            while (ReceiveProgress2 < 1) {
                                SpectralProfileDataTemp2 = await Connection.receive(CARTA.SpectralProfileData);
                                if (SpectralProfileDataTemp2.regionId == assertItem.setSpectralRequirementsGroup[3].regionId) {
                                    ReceiveProgress2 = SpectralProfileDataTemp2.progress;
                                };
                                console.log('Step 9 request 2 for region ' + SpectralProfileDataTemp2.regionId + ' progress:', ReceiveProgress2)
                            };
                            if (ReceiveProgress2 === 1) {
                                console.log('Step 9 request 2 for region ' + SpectralProfileDataTemp2.regionId + ' complete!')
                                Step9Requiest2ReceiveComplete = true;
                                break;
                            }
                        };
                    };
                };
                // console.warn('Step 9 request 1 for region ' + SpectralProfileDataTemp.regionId + ' progress: ', ReceiveProgress1)
            }, 30000);
        });

        describe(`Set spatial requirements (Step 10)`, () => {
            test(`SPATIAL_PROFILE_DATA should arrive within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetSpatialRequirements, assertItem.spatial)
                let SpatialProfileDataTempStep10 = await Connection.receive(CARTA.SpatialProfileData);
            }, regionTimeout);
        });


    });
    afterAll(() => Connection.close());
});