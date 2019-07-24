import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;
interface ISpectralProfileDataExt extends CARTA.ISpectralProfileData {
    profileLength?: number; 
    assertProfile?: {idx: number, value: number}[],
}
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
    setImageChannelGroup: CARTA.ISetImageChannels[];
    setSpectralRequirementsGroup: CARTA.ISetSpectralRequirements[];
    setCursorGroups: CARTA.ISetCursor[][];
    spectralProfileDataGroups: ISpectralProfileDataExt[][];
    precisionDigits: number;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: {directory: testSubdirectory},     
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU.fits",
            hdu: "",
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
        {
            directory: testSubdirectory,
            file: "HH211_IQU.hdf5",
            hdu: "",
            fileId: 3,
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
    ],
    setImageChannelGroup: [
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
        {
            fileId: 1,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 2,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 2,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 3,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 3,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
    setSpectralRequirementsGroup: [
        {
            fileId: 0, 
            regionId: 0, 
            spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.Sum]}],
        },
        {
            fileId: 1, 
            regionId: 0, 
            spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.Sum]}],
        },
        {
            fileId: 2, 
            regionId: 0, 
            spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.Sum]}],
        },
        {
            fileId: 3, 
            regionId: 0, 
            spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.Sum]}],
        },
    ],
    setCursorGroups: [
        [
            {
                fileId: 0,
                point: {x: 316.0, y: 401.0},
            },
            {
                fileId: 0,
                point: {x: 106, y: 135},
            },
            {
                fileId: 0,
                point: {x: -10, y: -10},
            },
        ],
        [
            {
                fileId: 1,
                point: {x: 316.0, y: 401.0},
            },
            {
                fileId: 1,
                point: {x: 106, y: 135},
            },
            {
                fileId: 1,
                point: {x: -10, y: -10},
            },
        ],
        [
            {
                fileId: 2,
                point: {x: 1006, y: 478},
            },
        ],
        [
            {
                fileId: 3,
                point: {x: 1006, y: 478},
            },
        ],
    ],
    spectralProfileDataGroups: [
        [
            {
                fileId: 0,
                regionId: 0,
                stokes: 0,
                progress: 1,
                profiles: [{coordinate: "z", statsType: CARTA.StatsType.Sum}],
                profileLength: 25,
                assertProfile: [
                    {idx: 12, value: -2.194151791839e-02},
                ],
            },
            {
                fileId: 0,
                regionId: 0,
                stokes: 0,
                progress: 1,
                profiles: [{coordinate: "z", statsType: CARTA.StatsType.Sum}],
                profileLength: 25,
                assertProfile: [
                    {idx: 12, value: NaN},
                ],
            },
            {
                progress: -1,
            },
        ],
        [
            {
                fileId: 1,
                regionId: 0,
                stokes: 0,
                progress: 1,
                profiles: [{coordinate: "z", statsType: CARTA.StatsType.Sum}],
                profileLength: 25,
                assertProfile: [
                    {idx: 12, value: -2.194151791839e-02},
                ],
            },
            {
                fileId: 1,
                regionId: 0,
                stokes: 0,
                progress: 1,
                profiles: [{coordinate: "z", statsType: CARTA.StatsType.Sum}],
                profileLength: 25,
                assertProfile: [
                    {idx: 12, value: NaN},
                ],
            },
            {
                progress: -1,
            },
        ],
        [
            {
                fileId: 2,
                regionId: 0,
                progress: 1,
                profiles: [{coordinate: "z", statsType: CARTA.StatsType.Sum}],
                profileLength: 5,
                assertProfile: [
                    {idx: 0, value: NaN},
                    {idx: 2, value: -1.186280068476e-03},
                ],
            },
        ],
        [
            {
                fileId: 3,
                regionId: 0,
                progress: 1,
                profiles: [{coordinate: "z", statsType: CARTA.StatsType.Sum}],
                profileLength: 5,
                assertProfile: [
                    {idx: 0, value: NaN},
                    {idx: 2, value: -1.186280068476e-03},
                ],
            },
        ],
    ],
    precisionDigits: 4,
}

describe("CURSOR_SPATIAL_PROFILE test: Testing if full resolution cursor spatial profiles are delivered correctly", () => {   
    let Connection: WebSocket;    

    assertItem.fileOpenGroup.map( (fileOpen, index) => {
    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeEach( done => {
            Connection = new WebSocket(testServerUrl);
            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;

            async function OnOpen (this: WebSocket, ev: Event) {
                await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
                await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
                await Utility.setEventAsync(this, CARTA.CloseFile, {fileId: -1});
                await Utility.setEventAsync(this, CARTA.OpenFile, fileOpen);
                await Utility.getEventAsync(this, CARTA.OpenFileAck);
                await Utility.getEventAsync(this, CARTA.RegionHistogramData);
                await Utility.setEventAsync(this, CARTA.SetImageChannels, assertItem.setImageChannelGroup[index]);
                await Utility.setEventAsync(this, CARTA.SetSpectralRequirements, assertItem.setSpectralRequirementsGroup[index]);
                await Utility.getEventAsync(this, CARTA.RasterTileData);
                done();
            }
        }, readFileTimeout);

        describe(`read the file "${fileOpen.file}"`, () => {

            assertItem.spectralProfileDataGroups[index].map( (spectralProfileData, idx) => {
                describe(`set cursor on {${assertItem.setCursorGroups[index][idx].point.x}, ${assertItem.setCursorGroups[index][idx].point.y}}`, () => {
                    let SpectralProfileDataTemp: any;
                    if (spectralProfileData.progress < 0) {
                        test(`SPECTRAL_PROFILE_DATA should not arrive within ${cursorTimeout} ms`, async () => {
                            await Utility.setEventAsync(Connection, CARTA.SetCursor, assertItem.setCursorGroups[index][idx]);
                            await Utility.getEventAsync(Connection, CARTA.SpectralProfileData, cursorTimeout * .5);
                        }, cursorTimeout);

                        test("Backend still alive", async () => {
                            expect(Connection.readyState).toEqual(WebSocket.OPEN);
                            await Utility.setEventAsync(Connection, CARTA.SetCursor, {x: 0, y: 0});
                            await Utility.getEventAsync(Connection, CARTA.SpectralProfileData);
                        }, connectTimeout);

                    } else {
                        test(`SPECTRAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                            await Utility.setEventAsync(Connection, CARTA.SetCursor, assertItem.setCursorGroups[index][idx]);
                            SpectralProfileDataTemp = await Utility.getEventAsync(Connection, CARTA.SpectralProfileData);
                            expect(SpectralProfileDataTemp.progress).toEqual(spectralProfileData.progress);
                        }, cursorTimeout);

                        test(`SPECTRAL_PROFILE_DATA.file_id = ${spectralProfileData.fileId}`, () => {
                            expect(SpectralProfileDataTemp.fileId).toEqual(spectralProfileData.fileId);
                        });

                        test(`SPECTRAL_PROFILE_DATA.region_id = ${spectralProfileData.regionId}`, () => {
                            expect(SpectralProfileDataTemp.regionId).toEqual(spectralProfileData.regionId);
                        });

                        if (spectralProfileData.stokes) {
                            test(`SPECTRAL_PROFILE_DATA.stokes = ${spectralProfileData.stokes}`, () => {
                                expect(SpectralProfileDataTemp.stokes).toEqual(spectralProfileData.stokes);
                            });
                        }

                        test("Assert SPECTRAL_PROFILE_DATA.profiles", () => {
                            expect(SpectralProfileDataTemp.profiles.find(f => f.coordinate === "z").coordinate).toEqual(spectralProfileData.profiles.find(f => f.coordinate === "z").coordinate);
                            expect(SpectralProfileDataTemp.profiles.find(f => f.coordinate === "z").values.length).toEqual(spectralProfileData.profileLength);
                        });

                        test("Assert SPECTRAL_PROFILE_DATA.profiles.values", () => {
                            spectralProfileData.assertProfile.map( profile => {
                                if (isNaN(profile.value)) {
                                    expect(SpectralProfileDataTemp.profiles.find(f => f.coordinate === "z").values[profile.idx]).toEqual(NaN);
                                } else {                            
                                    expect(SpectralProfileDataTemp.profiles.find(f => f.coordinate === "z").values[profile.idx]).toBeCloseTo(profile.value, assertItem.precisionDigits);
                                }
                            });
                        });
                    }
                });
            });
        });

        afterEach(() => Connection.close());
    });
    });

});