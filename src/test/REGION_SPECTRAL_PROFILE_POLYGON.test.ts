import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;
interface IProfilesExt extends CARTA.ISpectralProfile {
    profileLength?: number;
    assertValues?: { index: number, value: number }[];
}
interface ISpectralProfileData extends CARTA.ISpectralProfileData {
    profile?: IProfilesExt[];
}
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck[];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    spectralProfileData: ISpectralProfileData[];
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
            },
            {
                directory: testSubdirectory,
                file: "M17_SWex.hdf5",
                fileId: 0,
                hdu: "",
                renderMode: CARTA.RenderMode.RASTER,
            },
        ],
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: []
        },
    },
    addTilesRequire:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{x: 547, y: 284}, {x: 543, y: 279}, {x: 551, y: 275}],
                rotation: 0.0,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{x: 647, y: 272}, {x: 630, y: 262}, {x: 648, y: 253}],
                rotation: 0.0,
            }
        },
    ],
    regionAck: [
        {
            success: true,
            regionId: 1,
        },
        {
            success: true,
            regionId: 2,
        },
    ],
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.NumPixels,
                        CARTA.StatsType.Sum,
                        CARTA.StatsType.FluxDensity,
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
                        CARTA.StatsType.FluxDensity,
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
    spectralProfileData: [
        {
            regionId: 1,
            progress: 1,
            profile: [
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sum,
                    assertValues: [{ index: 10, value: 0.3020695  }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.FluxDensity,
                    assertValues: [{ index: 10, value: 0.01387782  }],
                },
                {
                    coordinate: "z",
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{ index: 10, value: 0.01313346 }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.RMS,
                    assertValues: [{ index: 10, value: 0.01345087 }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sigma,
                    assertValues: [{ index: 10, value: 0.00297016 }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.SumSq,
                    assertValues: [{ index: 10, value: 0.0041613 }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Min,
                    assertValues: [{ index: 10, value: 0.00871281 }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Max,
                    assertValues: [{ index: 10, value: 0.02121421 }],
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
                    assertValues: [{ index: 0, value: NaN }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.FluxDensity,
                    assertValues: [{ index: 0, value: NaN  }],
                },
                {
                    coordinate: "z",
                    profileLength: 25,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{ index: 0, value: NaN }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.RMS,
                    assertValues: [{ index: 0, value: NaN }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Sigma,
                    assertValues: [{ index: 0, value: NaN }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.SumSq,
                    assertValues: [{ index: 0, value: NaN }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Min,
                    assertValues: [{ index: 0, value: NaN }],
                },
                {
                    coordinate: "z",
                    statsType: CARTA.StatsType.Max,
                    assertValues: [{ index: 0, value: NaN }],
                },
            ],
        },
    ],
    precisionDigits: 4,
}

describe("REGION_SPECTRAL_PROFILE_POLYGON: Testing spectral profiler with polygon regions", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    assertItem.openFile.map(openFile => {
        describe(`Go to "${testSubdirectory}" folder and open image "${openFile.file}" to set image view`, () => {

            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1, });
                await Connection.openFile(openFile);
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesRequire);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            });

            assertItem.setRegion.map((region, index) => {
                describe(`${region.regionId < 0 ? "Creating" : "Modify"} ${CARTA.RegionType[region.regionInfo.regionType]} region #${assertItem.regionAck[index].regionId} on ${JSON.stringify(region.regionInfo.controlPoints)}`, () => {
                    let SetRegionAckTemp: CARTA.SetRegionAck;
                    test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetRegion, region);
                        SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck);
                    }, regionTimeout);

                    test(`SET_REGION_ACK.success = ${assertItem.regionAck[index].success}`, () => {
                        expect(SetRegionAckTemp.success).toBe(assertItem.regionAck[index].success);
                    });

                    test(`SET_REGION_ACK.region_id = ${assertItem.regionAck[index].regionId}`, () => {
                        expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAck[index].regionId);
                    });

                });

                describe(`SET SPECTRAL REQUIREMENTS on ${CARTA.RegionType[region.regionInfo.regionType]} region #${assertItem.regionAck[index].regionId}`, () => {
                    let SpectralProfileDataTemp: any;
                    test(`SPECTRAL_PROFILE_DATA should return within ${regionTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[index]);
                        SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                    }, regionTimeout);

                    test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData[index].regionId}`, () => {
                        expect(SpectralProfileDataTemp.regionId).toEqual(assertItem.spectralProfileData[index].regionId);
                    });

                    test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData[index].progress}`, () => {
                        expect(SpectralProfileDataTemp.progress).toEqual(assertItem.spectralProfileData[index].progress);
                    });

                    test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                        let _meanProfile = SpectralProfileDataTemp.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
                        let _assertProfile = assertItem.spectralProfileData[index].profile.find(f => f.statsType === CARTA.StatsType.Mean);
                        expect(_meanProfile.coordinate).toEqual(_assertProfile.coordinate);
                        expect(_meanProfile.values.length).toEqual(_assertProfile.profileLength);
                        expect(_meanProfile.statsType).toEqual(_assertProfile.statsType);
                        _assertProfile.assertValues.map(assertVal => {
                            if (isNaN(assertVal.value)) {
                                expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                            } else {
                                expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, assertItem.precisionDigits);
                            }
                        });
                        if (_assertProfile.profileLength > 0) {
                            expect(_meanProfile.values.length).toEqual(_assertProfile.profileLength);
                            _assertProfile.assertValues.map(assertVal => {
                                if (isNaN(assertVal.value)) {
                                    expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                                } else {
                                    expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, assertItem.precisionDigits);
                                }
                            });
                        }
                    });

                    test("Assert other SPECTRAL_PROFILE_DATA.profiles", () => {
                        assertItem.spectralProfileData[index].profile.map(profile => {
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

    afterAll(() => Connection.close);
});