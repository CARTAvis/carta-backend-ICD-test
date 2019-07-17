import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;
interface Profile {
    coordinate: string,
    lengthOfVals: number,
    statsTypes: CARTA.StatsType[],
    values: {index: number, value: number}[],
}
interface Region {
        regionId: number;
        regionType: CARTA.RegionType;
        controlPoints: CARTA.IPoint[];
        rotation: number;
        regionName: string;
        assert: {
            regionId: number,
            progress: number,
        };
        spectralConfig: CARTA.SetSpectralRequirements.ISpectralConfig[];
        profiles: Profile[];
}
interface ImageAssertItem {
    fileId: number;
    file: string;
    hdu: string;
    imageDataInfo: {
        compressionQuality: number;
        imageBounds: CARTA.IImageBounds;
        compressionType: CARTA.CompressionType;
        mip: number;
        numSubsets: number;
    }
    precisionDigits: number;
    regionGroup: Region[];
}
let imageAssertItem: ImageAssertItem = {
    fileId: 0,
    file: "M17_SWex.image",
    hdu: "",
    imageDataInfo: {
        compressionQuality: 11,
        imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
        compressionType: CARTA.CompressionType.ZFP,
        mip: 2,
        numSubsets: 4,
    },
    precisionDigits: 4,
    regionGroup: [
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 83, y: 489}, {x: 4, y: 6}],
            rotation: 0.0,
            regionName: "",
            assert: {
                regionId: 1,
                progress: 1,
            },
            spectralConfig: [
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
            profiles: [
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Sum],
                    values: [{index: 10, value: 0.86641663}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Mean],
                    values: [{index: 10, value: 0.05776111}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.RMS],
                    values: [{index: 10, value: 0.05839548}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Sigma],
                    values: [{index: 10, value: 0.00888533}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.SumSq],
                    values: [{index: 10, value: 0.05115047}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Min],
                    values: [{index: 10, value: 0.03859435}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Max],
                    values: [{index: 10, value: 0.0702243}],
                },
            ],
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 92, y: 522}, {x: 4, y: 6}],
            rotation: 50.0,
            regionName: "",
            assert: {
                regionId: 2,
                progress: 1,
            },
            spectralConfig: [
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
            profiles: [
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Sum],
                    values: [{index: 10, value: -0.3364888}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Mean],
                    values: [{index: 10, value: -0.02103055}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.RMS],
                    values: [{index: 10, value: 0.02322209}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Sigma],
                    values: [{index: 10, value: 0.01017089}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.SumSq],
                    values: [{index: 10, value: 0.00862825}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Min],
                    values: [{index: 10, value: -0.03209378}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Max],
                    values: [{index: 10, value: -0.00236961}],
                },
            ],
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 0, y: 522}, {x: 4, y: 6}],
            rotation: 50.0,
            regionName: "",
            assert: {
                regionId: 3,
                progress: 1,
            },
            spectralConfig: [
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
            profiles: [
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Sum],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Mean],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.RMS],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Sigma],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.SumSq],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Min],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Max],
                    values: [{index: 0, value: NaN}],
                },
            ],
        },
        {
            regionId: 1,
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{x: 89, y: 516}, {x: 5, y: 3}],
            rotation: 30.0,
            regionName: "",
            assert: {
                regionId: 1,
                progress: 1,
            },
            spectralConfig: [
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
            profiles: [
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Sum],
                    values: [{index: 10, value: 0.2515069}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Mean],
                    values: [{index: 10, value: 0.01143213}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.RMS],
                    values: [{index: 10, value: 0.01610695}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Sigma],
                    values: [{index: 10, value: 0.01161338}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.SumSq],
                    values: [{index: 10, value: 0.00570754}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Min],
                    values: [{index: 10, value: -0.01199045}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 25,
                    statsTypes: [CARTA.StatsType.Max],
                    values: [{index: 10, value: 0.02959144}],
                },
            ],
        },
        {
            regionId: 2,
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{x: 0, y: 516}, {x: 5, y: 3}],
            rotation: 30.0,
            regionName: "",
            assert: {
                regionId: 2,
                progress: 1,
            },
            spectralConfig: [
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
            profiles: [
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Sum],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Mean],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.RMS],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Sigma],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.SumSq],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Min],
                    values: [{index: 0, value: NaN}],
                },
                {
                    coordinate: "z",
                    lengthOfVals: 1,
                    statsTypes: [CARTA.StatsType.Max],
                    values: [{index: 0, value: NaN}],
                },
            ],
        },
    ],
}

describe("REGION_SPECTRAL_PROFILE test: Testing spectral profiler with regions", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: ""
                }
            );
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);
    
    describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.file}" to set image view`, () => {

        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1,});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, 
                {
                    directory: testSubdirectory, 
                    file: imageAssertItem.file,
                    fileId: imageAssertItem.fileId,
                    hdu: imageAssertItem.hdu,
                    renderMode: CARTA.RenderMode.RASTER,
                }
            ); 
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            await Utility.setEventAsync(Connection, CARTA.SetImageChannels, 
                {
                    fileId: 0,
                    channel: 0,
                    requiredTiles: {
                        fileId: 0,
                        tiles: [0],
                        compressionType: CARTA.CompressionType.ZFP,
                        compressionQuality: 11,
                    },
                },
            );
            await Utility.getEventAsync(Connection, CARTA.RasterTileData);
        });

        imageAssertItem.regionGroup.map( function( region: Region) {

            describe(`${region.regionId < 0?"Creating":"Modify"} ${CARTA.RegionType[region.regionType]} region #${region.assert.regionId} on ${JSON.stringify(region.controlPoints)}`, () => {
                let SetRegionAckTemp: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.SetRegion, region);
                    SetRegionAckTemp = <CARTA.SetRegionAck>await Utility.getEventAsync(Connection, CARTA.SetRegionAck);
                }, regionTimeout);

                test("SET_REGION_ACK.success = True", () => {
                    expect(SetRegionAckTemp.success).toBe(true);
                });

                test(`SET_REGION_ACK.region_id = ${region.assert.regionId}`, () => {
                    expect(SetRegionAckTemp.regionId).toEqual(region.assert.regionId);
                });

            });
            
            describe(`SET SPECTRAL REQUIREMENTS on ${CARTA.RegionType[region.regionType]} region #${region.assert.regionId}`, () => {
                let SpectralProfileDataTemp: any;
                test(`SPECTRAL_PROFILE_DATA should return within ${regionTimeout} ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.SetSpectralRequirements, 
                        {
                            fileId: imageAssertItem.fileId,
                            regionId: region.assert.regionId,
                            spectralProfiles: region.spectralConfig,
                        }
                    );
                    SpectralProfileDataTemp = await Utility.getEventAsync(Connection, CARTA.SpectralProfileData);
                }, regionTimeout);
                
                test(`SPECTRAL_PROFILE_DATA.region_id = ${region.assert.regionId}`, () => {
                    expect(SpectralProfileDataTemp.regionId).toEqual(region.assert.regionId);
                });

                test(`SPECTRAL_PROFILE_DATA.progress = ${region.assert.progress}`, () => {
                    expect(SpectralProfileDataTemp.progress).toEqual(region.assert.progress);
                });

                test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                    let _meanProfile = SpectralProfileDataTemp.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
                    let _assertProfile = region.profiles.find(f => f.statsTypes[0] === CARTA.StatsType.Mean);
                    expect(_meanProfile.coordinate).toEqual(_assertProfile.coordinate);
                    expect(_meanProfile.values.length).toEqual(_assertProfile.lengthOfVals);
                    expect(_meanProfile.statsType).toEqual(_assertProfile.statsTypes[0]);
                    _assertProfile.values.map( assertVal => {
                        if (isNaN(assertVal.value)) {
                            expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                        } else {
                            expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, imageAssertItem.precisionDigits);
                        }
                    });
                    if (_assertProfile.lengthOfVals > 0) {
                        expect(_meanProfile.values.length).toEqual(_assertProfile.lengthOfVals);
                        _assertProfile.values.map( assertVal => {
                            if (isNaN(assertVal.value)) {
                                expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                            } else {
                                expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, imageAssertItem.precisionDigits);
                            }
                        });
                    }
                });

                test("Assert other SPECTRAL_PROFILE_DATA.profiles", () => {
                    region.profiles.map(profile => {
                        let _returnedProfile = SpectralProfileDataTemp.profiles.find(f => f.statsType === profile.statsTypes[0]);
                        profile.values.map(assertVal => {
                            if (isNaN(assertVal.value)) {
                                expect(isNaN(_returnedProfile.values[assertVal.index])).toBe(true);
                            } else {
                                expect(_returnedProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, imageAssertItem.precisionDigits);
                            }
                        });
                    });
                });

            });

        });

    }); 

    afterAll( () => {
        Connection.close();
    });
});