import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let cursorTimeout = config.timeout.mouseEvent;
interface AssertItem {
    fileName: string;
    hdu: string;
    fileId: number;
    renderMode: CARTA.RenderMode;
    imageBounds: {xMin: number, xMax: number, yMin: number, yMax: number};
    mip: number;
    compressionType: CARTA.CompressionType;
    compressionQuality: number;
    numSubsets: number;
    regionId: number;
    stokes: number;
    progress: number;
    spectralProfiles: CARTA.SetSpectralRequirements.ISpectralConfig[];
    assertProfile: {
        point: {x: number, y: number},
        profileLen: {z: number}, 
        oddPoint: {
            z: {idx: number, value: number}[],
        }
    }[];
    errorPoint: {point: {x: number, y: number}}[];
    precisionDigits: number;
}
let assertItems: AssertItem[] = [
    {
        fileName: "M17_SWex.image",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
        imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 480},
        mip: 2,
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 11,
        numSubsets: 4,
        regionId: 0,
        stokes: 0,
        progress: 1,
        spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.NumPixels]}],
        assertProfile: [
            {
                point: {x: 316.0, y: 401.0},
                profileLen: {z: 25}, 
                oddPoint: {
                    z: [{idx: 12, value: -2.194151791839e-02}],
                },
            },
        ],
        errorPoint: [],
        precisionDigits: 4,
    },
    {
        fileName: "M17_SWex.hdf5",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
        imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 480},
        mip: 2,
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 11,
        numSubsets: 4,
        regionId: 0,
        stokes: 0,
        progress: 1,
        spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.NumPixels]}],
        assertProfile: [
            {
                point: {x: 316.0, y: 401.0},
                profileLen: {z: 25}, 
                oddPoint: {
                    z: [{idx: 12, value: -2.194151791839e-02}],
                },
            },
        ],
        errorPoint: [],
        precisionDigits: 4,
    },
    {
        fileName: "HH211_IQU.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
        imageBounds: {xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
        mip: 2,
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 11,
        numSubsets: 4,
        regionId: 0,
        stokes: 0,
        progress: 1,
        spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.NumPixels]}],
        assertProfile: [
            {
                point: {x: 1006, y: 478},
                profileLen: {z: 5}, 
                oddPoint: {
                    z: [
                        {idx: 0, value: NaN},
                        {idx: 2, value:  -1.186280068476e-03},
                    ],
                },
            },
        ],
        errorPoint: [],
        precisionDigits: 4,
    },
    {
        fileName: "HH211_IQU.hdf5",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
        imageBounds: {xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
        mip: 2,
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 11,
        numSubsets: 4,
        regionId: 0,
        stokes: 0,
        progress: 1,
        spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.NumPixels]}],
        assertProfile: [
            {
                point: {x: 1006, y: 478},
                profileLen: {z: 5}, 
                oddPoint: {
                    z: [
                        {idx: 0, value: NaN},
                        {idx: 2, value:  -1.186280068476e-03},
                    ],
                },
            },
        ],
        errorPoint: [],
        precisionDigits: 4,
    },
]

describe("CURSOR_SPATIAL_PROFILE test: Testing if full resolution cursor spatial profiles are delivered correctly", () => {   
    let Connection: WebSocket;    

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: ""
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            await done();
        }
    }, connectTimeout);

    assertItems.map( function(assertItem) {
        describe(`read the file "${assertItem.fileName}" on folder "${testSubdirectoryName}"`, () => {
            beforeAll( async () => {
                await Utility.setEvent(Connection, CARTA.CloseFile, 
                    {
                        fileId: -1,
                    }
                );
                await Utility.setEvent(Connection, CARTA.OpenFile, 
                    {
                        directory: testSubdirectoryName, 
                        file: assertItem.fileName, 
                        hdu: assertItem.hdu, 
                        fileId: assertItem.fileId, 
                        renderMode: assertItem.renderMode,
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, CARTA.OpenFileAck, 
                        OpenFileAck => {
                            expect(OpenFileAck.success).toBe(true);
                            resolve();
                        }
                    );                
                });
                await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
                await Utility.setEventAsync(Connection, CARTA.SetImageChannels, 
                    {
                        fileId: assertItem.fileId,
                        channel: 0,
                        requiredTiles: {
                            fileId: assertItem.fileId,
                            tiles: [0],
                            compressionType: CARTA.CompressionType.NONE,
                        },
                    },
                );
                await Utility.setEvent(Connection, CARTA.SetSpectralRequirements, 
                    {
                        fileId: assertItem.fileId, 
                        regionId: assertItem.regionId, 
                        spectralProfiles: assertItem.spectralProfiles,
                    }
                );
                await Utility.getEventAsync(Connection, CARTA.RasterTileData);
            }, readFileTimeout);     
            
            assertItem.assertProfile.map( function(item) {
                describe(`set cursor on {${item.point.x}, ${item.point.y}}`, () => {
                        let SpectralProfileDataTemp: CARTA.SpectralProfileData;
                        test(`SPECTRAL_PROFILE_DATA should arrive within ${cursorTimeout} ms`, async () => {
                            await Utility.setEvent(Connection, CARTA.SetCursor, 
                                {
                                    fileId: assertItem.fileId, 
                                    point: item.point,
                                }
                            );
                            await new Promise( resolve => {                        
                                Utility.getEvent(Connection, CARTA.SpectralProfileData, 
                                    (SpectralProfileData: CARTA.SpectralProfileData) => {
                                        SpectralProfileDataTemp = SpectralProfileData;
                                        resolve();
                                    }
                                );
                            });
                        }, cursorTimeout);

                        test(`SPECTRAL_PROFILE_DATA.file_id = ${assertItem.fileId}`, () => {
                            expect(SpectralProfileDataTemp.fileId).toEqual(assertItem.fileId);
                        });

                        test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.regionId}`, () => {
                            expect(SpectralProfileDataTemp.regionId).toEqual(assertItem.regionId);
                        });

                        test(`SPECTRAL_PROFILE_DATA.stokes = ${assertItem.stokes}`, () => {
                            expect(SpectralProfileDataTemp.stokes).toEqual(assertItem.stokes);
                        });

                        test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.progress}`, () => {
                            expect(SpectralProfileDataTemp.progress).toEqual(assertItem.progress);
                        });

                        test("Assert SPECTRAL_PROFILE_DATA.profiles", () => {
                            expect(SpectralProfileDataTemp.profiles.find(f => f.coordinate === "z").coordinate).toEqual(assertItem.spectralProfiles.find(f => f.coordinate === "z").coordinate);
                            expect(SpectralProfileDataTemp.profiles.find(f => f.coordinate === "z").vals.length).toEqual(item.profileLen.z);
                            item.oddPoint.z.map( f => {
                                if (isNaN(f.value)) {
                                    expect(SpectralProfileDataTemp.profiles.find(f => f.coordinate === "z").vals[f.idx]).toEqual(NaN);
                                } else {                            
                                    expect(SpectralProfileDataTemp.profiles.find(f => f.coordinate === "z").vals[f.idx]).toBeCloseTo(f.value, assertItem.precisionDigits);
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