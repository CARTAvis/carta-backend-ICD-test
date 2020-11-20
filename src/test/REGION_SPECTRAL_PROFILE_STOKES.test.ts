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
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setImageChannels: CARTA.ISetImageChannels[];
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
    openFile: [
        {
            directory: testSubdirectory,
            file: "HH211_IQU.fits",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU.hdf5",
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
    addRequiredTiles:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
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
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 522, y: 522 }, { x: 10, y: 10 }],
                rotation: 0.0,
            },
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
                    message: "Spectral requirements not valid for region id 1",
                    severity: 3,
                    tags: ["spectral"],
                },
            ],
        },
    ],
    precisionDigits: 4,
}

describe("REGION_SPECTRAL_PROFILE_STOKES: Testing spectral profiler with regions and Stokes", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    assertItem.openFile.map((openFile, index) => {
        describe(`Go to "${testSubdirectory}" folder and open image "${openFile.file}" to set image view`, () => {

            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
                await Connection.openFile(openFile);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles);
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            });

            describe(`${assertItem.setRegion[0].regionId < 0 ? "Creating" : "Modify"} ${CARTA.RegionType[assertItem.setRegion[0].regionInfo.regionType]} region #${assertItem.regionAck[0].regionId} on ${JSON.stringify(assertItem.setRegion[0].regionInfo.controlPoints)}`, () => {
                let SetRegionAck: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
                    SetRegionAck = await Connection.receive(CARTA.SetRegionAck);
                }, regionTimeout);

                test(`SET_REGION_ACK.success = ${assertItem.regionAck[0].success}`, () => {
                    expect(SetRegionAck.success).toBe(assertItem.regionAck[0].success);
                });

                test(`SET_REGION_ACK.region_id = ${assertItem.regionAck[0].regionId}`, () => {
                    expect(SetRegionAck.regionId).toEqual(assertItem.regionAck[0].regionId);
                });

                let SpectralProfileData: CARTA.SpectralProfileData;
                test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData[0].progress}`, async () => {
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[0]);
                    SpectralProfileData = await Connection.receive(CARTA.SpectralProfileData);
                    expect(SpectralProfileData.progress).toEqual(assertItem.spectralProfileData[0].progress);
                });

                test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData[0].regionId}`, () => {
                    expect(SpectralProfileData.regionId).toEqual(assertItem.spectralProfileData[0].regionId);
                });

                test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                    let _meanProfile = SpectralProfileData.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
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
                        SpectralProfileData = await Connection.receive(CARTA.SpectralProfileData);
                    });

                    test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData[1].regionId}`, () => {
                        expect(SpectralProfileData.regionId).toEqual(assertItem.spectralProfileData[1].regionId);
                    });

                    test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData[1].progress}`, () => {
                        expect(SpectralProfileData.progress).toEqual(assertItem.spectralProfileData[1].progress);
                    });

                    test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                        let _meanProfile = SpectralProfileData.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
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
                        SpectralProfileData = await Connection.receive(CARTA.SpectralProfileData);
                        expect(SpectralProfileData.regionId).toEqual(assertItem.spectralProfileData[2].regionId);
                    });

                    test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData[2].progress}`, () => {
                        expect(SpectralProfileData.progress).toEqual(assertItem.spectralProfileData[2].progress);
                    });

                    test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                        let _meanProfile = SpectralProfileData.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
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
                    let ErrorData: CARTA.ErrorData;
                    test(`ERROR_DATA should return within ${regionTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[3]);
                        ErrorData = await Connection.receive(CARTA.ErrorData);
                    }, regionTimeout);

                    test(`ERROR_DATA.message = "${assertItem.spectralProfileData[3].profile[0].message}"`, () => {
                        expect(ErrorData.message).toEqual(assertItem.spectralProfileData[3].profile[0].message);
                    });

                    test(`ERROR_DATA.severity = ${assertItem.spectralProfileData[3].profile[0].severity}`, () => {
                        expect(ErrorData.severity).toEqual(assertItem.spectralProfileData[3].profile[0].severity);
                    });

                    test(`ERROR_DATA.tags = ["${assertItem.spectralProfileData[3].profile[0].tags.join(`", "`)}"]`, () => {
                        expect(ErrorData.tags).toEqual(assertItem.spectralProfileData[3].profile[0].tags);
                    });
                });

            });

        });
    });

    afterAll(() => Connection.close());
});