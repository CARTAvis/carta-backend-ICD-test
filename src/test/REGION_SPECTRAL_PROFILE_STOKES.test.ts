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
    message?: string;
    severity?: number;
    tags?: string[];
}
interface ISpectralProfileData extends CARTA.ISpectralProfileData {
    profile?: IProfilesExt[];
}
interface AssertItem {
    register: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setImageChannels: CARTA.ISetImageChannels[];
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck[];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    spectralProfileData: ISpectralProfileData[];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    openFile: [
        {
            directory: testSubdirectory,
            file: "HH211_IQU.fits",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU.hdf5",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
    ],
    setImageChannels: [
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
        {
            fileId: 0,
            channel: 0,
            stokes: 1,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 522, y: 522 }, { x: 10, y: 10 }],
            rotation: 0.0,
        },
    ],
    regionAck: [
        {
            success: true,
            regionId: 1,
        },
    ],
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [CARTA.StatsType.Mean],
                }
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [CARTA.StatsType.Mean],
                }
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "Uz",
                    statsTypes: [CARTA.StatsType.Mean],
                }
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "Vz",
                    statsTypes: [CARTA.StatsType.Mean],
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
                    profileLength: 5,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{ index: 2, value: 0.035725489635913335 }],
                },
            ],
        },
        {
            regionId: 1,
            progress: 1,
            profile: [
                {
                    coordinate: "z",
                    profileLength: 5,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{ index: 2, value: -0.0004460110767806237 }],
                },
            ],
        },
        {
            regionId: 1,
            progress: 1,
            profile: [
                {
                    coordinate: "Uz",
                    profileLength: 5,
                    statsType: CARTA.StatsType.Mean,
                    assertValues: [{ index: 2, value: -0.00010940432089077795 }],
                },
            ],
        },
        {
            regionId: 1,
            progress: 1,
            profile: [
                {
                    coordinate: "Vz",
                    message: "Spectral requirements for region id 1 failed to validate ",
                    severity: 3,
                    tags: ["spectral"],
                },
            ],
        },
    ],
    precisionDigits: 4,
}

describe("REGION_SPECTRAL_PROFILE_STOKES test: Testing spectral profiler with regions and Stokes", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    assertItem.openFile.map((openFile, index) => {
        describe(`Go to "${testSubdirectory}" folder and open image "${openFile.file}" to set image view`, () => {

            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1, });
                await Connection.send(CARTA.OpenFile, openFile);
                await Connection.receiveAny();
                await Connection.receiveAny(); // OpenFileAck | RegionHistogramData
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannels[0]);
                await Connection.receive(CARTA.RasterTileData);
            });

            describe(`${assertItem.setRegion[0].regionId < 0 ? "Creating" : "Modify"} ${CARTA.RegionType[assertItem.setRegion[0].regionType]} region #${assertItem.regionAck[0].regionId} on ${JSON.stringify(assertItem.setRegion[0].controlPoints)}`, () => {
                let SetRegionAckTemp: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
                    SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck) as CARTA.SetRegionAck;
                }, regionTimeout);

                test(`SET_REGION_ACK.success = ${assertItem.regionAck[0].success}`, () => {
                    expect(SetRegionAckTemp.success).toBe(assertItem.regionAck[0].success);
                });

                test(`SET_REGION_ACK.region_id = ${assertItem.regionAck[0].regionId}`, () => {
                    expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAck[0].regionId);
                });

                let SpectralProfileDataTemp: CARTA.SpectralProfileData;
                test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData[0].progress}`, async () => {
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[0]);
                    SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData) as CARTA.SpectralProfileData;
                    expect(SpectralProfileDataTemp.progress).toEqual(assertItem.spectralProfileData[0].progress);
                });

                test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData[0].regionId}`, () => {
                    expect(SpectralProfileDataTemp.regionId).toEqual(assertItem.spectralProfileData[0].regionId);
                });

                test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                    let _meanProfile = SpectralProfileDataTemp.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
                    expect(_meanProfile.coordinate).toEqual(assertItem.spectralProfileData[0].profile[0].coordinate);
                    expect(_meanProfile.values.length).toEqual(assertItem.spectralProfileData[0].profile[0].profileLength);
                    expect(_meanProfile.statsType).toEqual(assertItem.spectralProfileData[0].profile[0].statsType);
                    assertItem.spectralProfileData[0].profile[0].assertValues.map(assertVal => {
                        if (isNaN(assertVal.value)) {
                            expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                        } else {
                            expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, assertItem.precisionDigits);
                        }
                    });
                });

                describe(`Change to stokes = ${assertItem.setImageChannels[1].stokes}`, () => {
                    beforeAll(async () => {
                        await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannels[1]);
                        SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData) as CARTA.SpectralProfileData;
                    });

                    test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData[1].regionId}`, () => {
                        expect(SpectralProfileDataTemp.regionId).toEqual(assertItem.spectralProfileData[1].regionId);
                    });

                    test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData[1].progress}`, () => {
                        expect(SpectralProfileDataTemp.progress).toEqual(assertItem.spectralProfileData[1].progress);
                    });

                    test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                        let _meanProfile = SpectralProfileDataTemp.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
                        expect(_meanProfile.coordinate).toEqual(assertItem.spectralProfileData[1].profile[0].coordinate);
                        expect(_meanProfile.values.length).toEqual(assertItem.spectralProfileData[1].profile[0].profileLength);
                        expect(_meanProfile.statsType).toEqual(assertItem.spectralProfileData[1].profile[0].statsType);
                        assertItem.spectralProfileData[1].profile[0].assertValues.map(assertVal => {
                            if (isNaN(assertVal.value)) {
                                expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                            } else {
                                expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, assertItem.precisionDigits);
                            }
                        });
                    });
                });

                describe(`Set coordinate = ${assertItem.setSpectralRequirements[2].spectralProfiles[0].coordinate}`, () => {
                    test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData[2].regionId}`, async () => {
                        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[2]);
                        SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData) as CARTA.SpectralProfileData;
                        expect(SpectralProfileDataTemp.regionId).toEqual(assertItem.spectralProfileData[2].regionId);
                    });

                    test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData[2].progress}`, () => {
                        expect(SpectralProfileDataTemp.progress).toEqual(assertItem.spectralProfileData[2].progress);
                    });

                    test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                        let _meanProfile = SpectralProfileDataTemp.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
                        expect(_meanProfile.coordinate).toEqual(assertItem.spectralProfileData[2].profile[0].coordinate);
                        expect(_meanProfile.values.length).toEqual(assertItem.spectralProfileData[2].profile[0].profileLength);
                        expect(_meanProfile.statsType).toEqual(assertItem.spectralProfileData[2].profile[0].statsType);
                        assertItem.spectralProfileData[2].profile[0].assertValues.map(assertVal => {
                            if (isNaN(assertVal.value)) {
                                expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                            } else {
                                expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, assertItem.precisionDigits);
                            }
                        });
                    });

                });

                describe(`Set coordinate = ${assertItem.setSpectralRequirements[3].spectralProfiles[0].coordinate}`, () => {
                    let ErrorDataTemp: CARTA.ErrorData;
                    test(`ERROR_DATA should return within ${regionTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[3]);
                        ErrorDataTemp = await Connection.receive(CARTA.ErrorData) as CARTA.ErrorData;
                    }, regionTimeout);

                    test(`ERROR_DATA.message = "${assertItem.spectralProfileData[3].profile[0].message}"`, () => {
                        expect(ErrorDataTemp.message).toEqual(assertItem.spectralProfileData[3].profile[0].message);
                    });

                    test(`ERROR_DATA.severity = ${assertItem.spectralProfileData[3].profile[0].severity}`, () => {
                        expect(ErrorDataTemp.severity).toEqual(assertItem.spectralProfileData[3].profile[0].severity);
                    });

                    test(`ERROR_DATA.tags = ["${assertItem.spectralProfileData[3].profile[0].tags.join(`", "`)}"]`, () => {
                        expect(ErrorDataTemp.tags).toEqual(assertItem.spectralProfileData[3].profile[0].tags);
                    });
                });

            });

        });
    });

    afterAll(() => Connection.close());
});