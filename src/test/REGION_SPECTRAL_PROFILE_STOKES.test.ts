import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
import { isNumber } from "util";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;
interface Profile {
    coordinate: string,
    lengthOfVals: number,
    statsTypes: CARTA.StatsType[],
    values: {index: number, value: number}[],
    channel?: number;
    stokes?: number;
    message?: string;
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
        profiles: Profile[];
        errorProfiles: any[];
}
interface ImageAssertItem {
    fileId: number;
    fileName: string;
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
let imageAssertItems: ImageAssertItem[] = [
    {
        fileId: 0,
        fileName: "HH211_IQU.fits",
        hdu: "0",
        imageDataInfo: {
            compressionQuality: 11,
            imageBounds: {xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
            compressionType: CARTA.CompressionType.ZFP,
            mip: 2,
            numSubsets: 4,
        },
        precisionDigits: 4,
        regionGroup: [
            {
                regionId: -1,
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{x: 522, y: 522}, {x: 10, y: 10}],
                rotation: 0.0,
                regionName: "",
                assert: {
                    regionId: 1,
                    progress: 1,
                },
                profiles: [
                    {
                        coordinate: "z",
                        lengthOfVals: 5,
                        statsTypes: [CARTA.StatsType.Mean],
                        values: [{index: 2, value: 0.035725489635913335}],
                    },
                    {
                        coordinate: "z",
                        lengthOfVals: 5,
                        statsTypes: [CARTA.StatsType.Mean],
                        values: [{index: 2, value: -0.0004460110767806237}],
                        channel: 0,
                        stokes: 1,
                    },
                    {
                        coordinate: "Uz",
                        lengthOfVals: 5,
                        statsTypes: [CARTA.StatsType.Mean],
                        values: [{index: 2, value: -0.00010940432089077795}],
                    },
                ],
                errorProfiles: [
                    {
                        coordinate: "Vz",
                        message: "Spectral requirements for region id 1 failed to validate ",
                        severity: 3,
                        tags: ["spectral"],
                    },
                ],
            },
        ],
    },
    {
        fileId: 0,
        fileName: "HH211_IQU.hdf5",
        hdu: "0",
        imageDataInfo: {
            compressionQuality: 11,
            imageBounds: {xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
            compressionType: CARTA.CompressionType.ZFP,
            mip: 2,
            numSubsets: 4,
        },
        precisionDigits: 4,
        regionGroup: [
            {
                regionId: -1,
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{x: 522, y: 522}, {x: 10, y: 10}],
                rotation: 0.0,
                regionName: "",
                assert: {
                    regionId: 1,
                    progress: 1,
                },
                profiles: [
                    {
                        coordinate: "z",
                        lengthOfVals: 5,
                        statsTypes: [CARTA.StatsType.Mean],
                        values: [{index: 2, value: 0.035725489635913335}],
                    },
                    {
                        coordinate: "z",
                        lengthOfVals: 0,
                        statsTypes: [CARTA.StatsType.Mean],
                        values: [{index: 2, value: -0.0004460110767806237}],
                        channel: 0,
                        stokes: 1,
                    },
                    {
                        coordinate: "Uz",
                        lengthOfVals: 0,
                        statsTypes: [CARTA.StatsType.Mean],
                        values: [{index: 2, value: -0.00010940432089077795}],
                    },
                ],
                errorProfiles: [
                    {
                        coordinate: "Vz",
                        message: "Spectral requirements for region id 1 failed to validate ",
                        severity: 3,
                        tags: ["spectral"],
                    },
                ],
            },
        ],
    },
]

describe("REGION_SPECTRAL_PROFILE_STOKES test: Testing spectral profiler with regions and Stokes", () => {   
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
    
    imageAssertItems.map( imageAssertItem => {
        describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.fileName}" to set image view`, () => {

            beforeAll( async () => {
                await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1,});
                await Utility.setEventAsync(Connection, CARTA.OpenFile, 
                    {
                        directory: testSubdirectory, 
                        file: imageAssertItem.fileName,
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
                await Utility.setEventAsync(Connection, CARTA.SetCursor, // For getting a SpectralProfileData after changing channel# or stokes#
                    {
                        fileId: imageAssertItem.fileId,
                        point: {x: 0, y:0},
                        spectralProfiles: [],
                    }
                );
            });

            imageAssertItem.regionGroup.map( (region: Region) => {

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

                region.profiles.map( profile => {
                    describe(`${isNumber(profile.stokes)?`Switch to stokes ${profile.stokes} on`:`SET SPECTRAL REQUIREMENTS on ${CARTA.RegionType[region.regionType]}`} region #${region.assert.regionId} with coordinate "${profile.coordinate}"`, () => {
                        let SpectralProfileDataTemp: any;
                        test(`SPECTRAL_PROFILE_DATA should return within ${regionTimeout} ms`, async () => {
                            if (isNumber(profile.stokes)) {
                                await Utility.setEventAsync(Connection, CARTA.SetImageChannels, 
                                    {
                                        fileId: imageAssertItem.fileId,
                                        channel: profile.channel,
                                        stokes: profile.stokes,
                                    }
                                );
                                const ack = await Utility.getStreamAsync(Connection, 2);
                                SpectralProfileDataTemp = ack.SpectralProfileData;
                            } else {
                                await Utility.setEventAsync(Connection, CARTA.SetSpectralRequirements, 
                                    {
                                        fileId: imageAssertItem.fileId,
                                        regionId: region.assert.regionId,
                                        spectralProfiles: [profile],
                                    }
                                );
                                SpectralProfileDataTemp = await Utility.getEventAsync(Connection, CARTA.SpectralProfileData);
                            }
                        }, regionTimeout);
                        
                        test(`SPECTRAL_PROFILE_DATA.region_id = ${region.assert.regionId}`, () => {
                            expect(SpectralProfileDataTemp.regionId).toEqual(region.assert.regionId);
                        });

                        test(`SPECTRAL_PROFILE_DATA.progress = ${region.assert.progress}`, () => {
                            expect(SpectralProfileDataTemp.progress).toEqual(region.assert.progress);
                        });
                        
                        if (isNumber(profile.stokes)) {
                            test(`SPECTRAL_PROFILE_DATA.stokes = ${profile.stokes}`, () => {
                                expect(SpectralProfileDataTemp.stokes).toEqual(profile.stokes);
                            });
                        }

                        test("Assert SPECTRAL_PROFILE_DATA.profiles of CARTA.StatsType.Mean", () => {
                            let _meanProfile = SpectralProfileDataTemp.profiles.find(f => f.statsType === CARTA.StatsType.Mean);
                            expect(_meanProfile.coordinate).toEqual(profile.coordinate);
                            expect(_meanProfile.values.length).toEqual(profile.lengthOfVals);
                            expect(_meanProfile.statsType).toEqual(profile.statsTypes[0]);
                            profile.values.map( assertVal => {
                                if (isNaN(assertVal.value)) {
                                    expect(isNaN(_meanProfile.values[assertVal.index])).toBe(true);
                                } else {
                                    expect(_meanProfile.values[assertVal.index]).toBeCloseTo(assertVal.value, imageAssertItem.precisionDigits);
                                }
                            });
                        });

                    });
                });

                region.errorProfiles.map( profile => {
                    describe(`SET error SPECTRAL REQUIREMENTS on ${CARTA.RegionType[region.regionType]} region #${region.assert.regionId} with coordinate "${profile.coordinate}"`, () => {
                        let ErrorDataTemp: CARTA.ErrorData;
                        test(`ERROR_DATA should return within ${regionTimeout} ms`, async () => {
                            await Utility.setEventAsync(Connection, CARTA.SetSpectralRequirements, 
                                {
                                    fileId: imageAssertItem.fileId,
                                    regionId: region.assert.regionId,
                                    spectralProfiles: [profile],
                                }
                            );
                            ErrorDataTemp = <CARTA.ErrorData>await Utility.getEventAsync(Connection, CARTA.ErrorData);
                        }, regionTimeout);

                        test(`ERROR_DATA.message = "${profile.message}"`, () => {
                            expect(ErrorDataTemp.message).toEqual(profile.message);
                        });

                        test(`ERROR_DATA.severity = ${profile.severity}`, () => {
                            expect(ErrorDataTemp.severity).toEqual(profile.severity);
                        });

                        test(`ERROR_DATA.tags = ["${profile.tags.join(`", "`)}"]`, () => {
                            expect(ErrorDataTemp.tags).toEqual(profile.tags);
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