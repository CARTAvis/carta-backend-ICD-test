import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;
interface IProfilesExt extends CARTA.ISpectralProfile {
    profileLength?: number;
    assertValues?: {index: number, value: number}[];
}
interface ISpectralProfileData extends CARTA.ISpectralProfileData {
    profile?: IProfilesExt[];
}
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setImageChannels: CARTA.ISetImageChannels;
    setRegionGroup: CARTA.ISetRegion[];
    regionAckGroup: CARTA.ISetRegionAck[];
    setSpectralRequirementsGroup: CARTA.ISetSpectralRequirements[];
    spectralProfileDataGroup: ISpectralProfileData[];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0, 
        apiKey: "",
        clientFeatureFlags: 5,
    },
    openFile: 
    [
        {
            directory: testSubdirectory, 
            file: "M17_SWex.image",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
        {
            directory: testSubdirectory, 
            file: "M17_SWex.hdf5",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
    ],
    setImageChannels: {
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
    setRegionGroup: [
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 83, y: 489}, {x: 4, y: 6}],
            rotation: 0.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 92, y: 522}, {x: 4, y: 6}],
            rotation: 50.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 0, y: 522}, {x: 4, y: 6}],
            rotation: 50.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{x: 89, y: 516}, {x: 5, y: 3}],
            rotation: 30.0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{x: 0, y: 516}, {x: 5, y: 3}],
            rotation: 30.0,
        },
    ],
    regionAckGroup: [
        {
            success: true,
            regionId: 1,
        },
        {
            success: true,
            regionId: 2,
        },
        {
            success: true,
            regionId: 3,
        },
        {
            success: true,
            regionId: 4,
        },
        {
            success: true,
            regionId: 5,
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
        {
            fileId: 0,
            regionId: 5,
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
    spectralProfileDataGroup: [
        {
            regionId: 1,
            progress: 1,
            profile: [
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sum,
                    assertValues: [{index: 10, value: 0.86641663}],
                },
                {
                    coordinate: "z",
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{index: 10, value: 0.05776111}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.RMS,
                    assertValues: [{index: 10, value: 0.05839548}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sigma,
                    assertValues: [{index: 10, value: 0.00888533}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.SumSq,
                    assertValues: [{index: 10, value: 0.05115047}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Min,
                    assertValues: [{index: 10, value: 0.03859435}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Max,
                    assertValues: [{index: 10, value: 0.0702243}],
                },
            ],
        },
        {
            regionId: 2,
            progress: 1,
            profile: [
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sum,
                    assertValues: [{index: 10, value: -0.3364888}],
                },
                {
                    coordinate: "z",
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{index: 10, value: -0.02103055}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.RMS,
                    assertValues: [{index: 10, value: 0.02322209}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sigma,
                    assertValues: [{index: 10, value: 0.01017089}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.SumSq,
                    assertValues: [{index: 10, value: 0.00862825}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Min,
                    assertValues: [{index: 10, value: -0.03209378}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Max,
                    assertValues: [{index: 10, value: -0.00236961}],
                },
            ],
        },
        {
            regionId: 3,
            progress: 1,
            profile: [
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sum,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.RMS,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sigma,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.SumSq,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Min,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Max,
                    assertValues: [{index: 0, value: NaN}],
                },
            ],
        },
        {
            regionId: 4,
            progress: 1,
            profile: [
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sum,
                    assertValues: [{index: 10, value: 0.2515069}],
                },
                {
                    coordinate: "z",
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{index: 10, value: 0.01143213}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.RMS,
                    assertValues: [{index: 10, value: 0.01610695}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sigma,
                    assertValues: [{index: 10, value: 0.01161338}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.SumSq,
                    assertValues: [{index: 10, value: 0.00570754}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Min,
                    assertValues: [{index: 10, value: -0.01199045}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Max,
                    assertValues: [{index: 10, value: 0.02959144}],
                },
            ],
        },
        {
            regionId: 5,
            progress: 1,
            profile: [
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sum,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.RMS,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sigma,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.SumSq,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Min,
                    assertValues: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Max,
                    assertValues: [{index: 0, value: NaN}],
                },
            ],
        },
    ],
    precisionDigits: 4,
}

describe("REGION_SPECTRAL_PROFILE test: Testing spectral profiler with regions", () => {   
    let Connection: WebSocket;
    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.registerViewer);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);

    assertItem.openFile.map(openFile => {
        describe(`Go to "${testSubdirectory}" folder and open image "${openFile.file}" to set image view`, () => {

            beforeAll( async () => {
                await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1,});
                await Utility.setEventAsync(Connection, CARTA.OpenFile, openFile); 
                await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
                await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
                await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannels);
                await Utility.getEventAsync(Connection, CARTA.RasterTileData);
            });

            assertItem.setRegionGroup.map( (region, index) => {
                describe(`${region.regionId < 0 ? "Creating" : "Modify"} ${CARTA.RegionType[region.regionType]} region #${assertItem.regionAckGroup[index].regionId} on ${JSON.stringify(region.controlPoints)}`, () => {
                    let SetRegionAckTemp: CARTA.SetRegionAck;
                    test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                        await Utility.setEventAsync(Connection, CARTA.SetRegion, region);
                        SetRegionAckTemp = <CARTA.SetRegionAck>await Utility.getEventAsync(Connection, CARTA.SetRegionAck);
                    }, regionTimeout);

                    test(`SET_REGION_ACK.success = ${assertItem.regionAckGroup[index].success}`, () => {
                        expect(SetRegionAckTemp.success).toBe(assertItem.regionAckGroup[index].success);
                    });

                    test(`SET_REGION_ACK.region_id = ${assertItem.regionAckGroup[index].regionId}`, () => {
                        expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAckGroup[index].regionId);
                    });

                });
                
                describe(`SET SPECTRAL REQUIREMENTS on ${CARTA.RegionType[region.regionType]} region #${assertItem.regionAckGroup[index].regionId}`, () => {
                    let SpectralProfileDataTemp: any;
                    test(`SPECTRAL_PROFILE_DATA should return within ${regionTimeout} ms`, async () => {
                        await Utility.setEventAsync(Connection, CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[index]);
                        SpectralProfileDataTemp = await Utility.getEventAsync(Connection, CARTA.SpectralProfileData);
                    }, regionTimeout);
                    
                    test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileDataGroup[index].regionId}`, () => {
                        expect(SpectralProfileDataTemp.regionId).toEqual(assertItem.spectralProfileDataGroup[index].regionId);
                    });

                    test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileDataGroup[index].progress}`, () => {
                        expect(SpectralProfileDataTemp.progress).toEqual(assertItem.spectralProfileDataGroup[index].progress);
                    });

                    test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                        let _meanProfile = SpectralProfileDataTemp.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
                        let _assertProfile = assertItem.spectralProfileDataGroup[index].profile.find(f => f.statsType === CARTA.StatsType.Mean);
                        expect(_meanProfile.coordinate).toEqual(_assertProfile.coordinate);
                        expect(_meanProfile.values.length).toEqual(_assertProfile.profileLength);
                        expect(_meanProfile.statsType).toEqual(_assertProfile.statsType);
                        _assertProfile.assertValues.map( assertVal => {
                            if (isNaN(assertVal.value)) {
                                expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                            } else {
                                expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, assertItem.precisionDigits);
                            }
                        });
                        if (_assertProfile.profileLength > 0) {
                            expect(_meanProfile.values.length).toEqual(_assertProfile.profileLength);
                            _assertProfile.assertValues.map( assertVal => {
                                if (isNaN(assertVal.value)) {
                                    expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                                } else {
                                    expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, assertItem.precisionDigits);
                                }
                            });
                        }
                    });

                    test("Assert other SPECTRAL_PROFILE_DATA.profiles", () => {
                        assertItem.spectralProfileDataGroup[index].profile.map(profile => {
                            let _returnedProfile = SpectralProfileDataTemp.profiles.find(f => f.statsType === profile.statsType);
                            profile.assertValues.map(assertVal => {
                                if (isNaN(assertVal.value)) {
                                    expect(isNaN(_returnedProfile.values[assertVal.index])).toBe(true);
                                } else {
                                    expect(_returnedProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, assertItem.precisionDigits);
                                }
                            });
                        });
                    });

                });

            });

        });
    });

    afterAll( () => Connection.close);
});