import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;
interface ISpectralProfileDataExt extends CARTA.ISpectralProfileData {
    profileLength?: number;
    assertProfile?: { idx: number, value: number }[],
}
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[][];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    spectralProfileData: ISpectralProfileDataExt[][];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
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
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addRequiredTiles: [
        {
            fileId: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
    ],
    setCursor: [
        [
            {
                fileId: 0,
                point: { x: 1006, y: 478 },
            },
        ],
        [
            {
                fileId: 1,
                point: { x: 1006, y: 478 },
            },
        ],
    ],
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 0,
            spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
        },
        {
            fileId: 1,
            regionId: 0,
            spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
        },
    ],
    spectralProfileData: [
        [
            {
                fileId: 0,
                regionId: 0,
                progress: 1,
                profiles: [{ coordinate: "z", statsType: CARTA.StatsType.Sum }],
                profileLength: 5,
                assertProfile: [
                    { idx: 0, value: NaN },
                    { idx: 2, value: -1.186280068476e-03 },
                ],
            },
        ],
        [
            {
                fileId: 1,
                regionId: 0,
                progress: 1,
                profiles: [{ coordinate: "z", statsType: CARTA.StatsType.Sum }],
                profileLength: 5,
                assertProfile: [
                    { idx: 0, value: NaN },
                    { idx: 2, value: -1.186280068476e-03 },
                ],
            },
        ],
    ],
    precisionDigits: 4,
}

describe("CURSOR_SPECTRAL_PROFILE_NaN: Testing if full resolution cursor z profile with NaN channels is delivered correctly", () => {
    let Connection: Client;

    assertItem.openFile.map((openFile, index) => {
        describe(`Read the file "${openFile.file}"`, () => {
            beforeAll(async () => {
                Connection = new Client(testServerUrl);
                await Connection.open();
                await Connection.registerViewer(assertItem.registerViewer);
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
                await Connection.openFile(openFile);
            }, readFileTimeout);

            assertItem.spectralProfileData[index].map((spectralProfile, idx) => {
                describe(`set cursor on {${assertItem.setCursor[index][idx].point.x}, ${assertItem.setCursor[index][idx].point.y}}`, () => {
                    beforeAll(async () => {
                        await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[index]);
                        await Connection.send(CARTA.SetCursor, assertItem.setCursor[index][idx]);
                        await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                    }, cursorTimeout);

                    let SpectralProfileData: CARTA.SpectralProfileData;
                    test(`SPECTRAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[index]);
                        SpectralProfileData = await Connection.receive(CARTA.SpectralProfileData);
                        expect(SpectralProfileData.progress).toEqual(spectralProfile.progress);
                    }, cursorTimeout);

                    test(`SPECTRAL_PROFILE_DATA.file_id = ${spectralProfile.fileId}`, () => {
                        expect(SpectralProfileData.fileId).toEqual(spectralProfile.fileId);
                    });

                    test(`SPECTRAL_PROFILE_DATA.region_id = ${spectralProfile.regionId}`, () => {
                        expect(SpectralProfileData.regionId).toEqual(spectralProfile.regionId);
                    });

                    if (spectralProfile.stokes) {
                        test(`SPECTRAL_PROFILE_DATA.stokes = ${spectralProfile.stokes}`, () => {
                            expect(SpectralProfileData.stokes).toEqual(spectralProfile.stokes);
                        });
                    }

                    test(`Length of SPECTRAL_PROFILE_DATA.profiles = ${spectralProfile.profiles.length}`, () => {
                        expect(SpectralProfileData.profiles.length).toEqual(spectralProfile.profiles.length);
                    });

                    test(`SPECTRAL_PROFILE_DATA.profiles.coordinate = "${spectralProfile.profiles[0].coordinate}"`, () => {
                        expect(SpectralProfileData.profiles.find(f => f.coordinate === "z").coordinate).toEqual(spectralProfile.profiles.find(f => f.coordinate === "z").coordinate);
                    });

                    test(`SPECTRAL_PROFILE_DATA.profiles.statsType = ${CARTA.StatsType[spectralProfile.profiles[0].statsType]}`, () => {
                        expect(SpectralProfileData.profiles.find(f => f.coordinate === "z").statsType).toEqual(spectralProfile.profiles.find(f => f.coordinate === "z").statsType);
                    });

                    test(`Length of SPECTRAL_PROFILE_DATA.profiles.values = ${spectralProfile.profileLength}`, () => {
                        expect(SpectralProfileData.profiles.find(f => f.coordinate === "z").values.length).toEqual(spectralProfile.profileLength);
                    });

                    test("Assert SPECTRAL_PROFILE_DATA.profiles.values", () => {
                        spectralProfile.assertProfile.map(profile => {
                            if (isNaN(profile.value)) {
                                expect(SpectralProfileData.profiles.find(f => f.coordinate === "z").values[profile.idx]).toEqual(NaN);
                            } else {
                                expect(SpectralProfileData.profiles.find(f => f.coordinate === "z").values[profile.idx]).toBeCloseTo(profile.value, assertItem.precisionDigits);
                            }
                        });
                    });

                });
            });
            afterAll(() => Connection.close());
        });
    });

});