import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;
let mouseEventTimeout = config.timeout.mouseEvent;

let baseDirectory: string;
let testFileName = "S255_IR_sci.spw25.cube.I.pbcor.fits";

describe("REGION_SPECTRAL_PROFILE_DEV: Temporary test case of region spectral profile to assist backend development", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEvent(this, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            await Utility.setEvent(this, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                        FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        baseDirectory = FileListResponseBase.directory;
                        resolve();
                    }
                );                
            });
            await Utility.setEvent(this, "OPEN_FILE", CARTA.OpenFile, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0", 
                    fileId: 0, 
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                    OpenFileAck => {
                        expect(OpenFileAck.success).toBe(true);
                        resolve();
                    }
                );                
            });
            await Utility.setEvent(this, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                {
                    fileId: 0, 
                    imageBounds: {
                        xMin: 0, xMax: 1920, 
                        yMin: 0, yMax: 1920
                    }, 
                    mip: 4, 
                    compressionType: CARTA.CompressionType.ZFP,
                    compressionQuality: 11, 
                    numSubsets: 4,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                    RasterImageData => {
                        expect(RasterImageData.fileId).toEqual(0);
                        resolve();
                    }
                );                
            });
            done();
        }
    }, connectionTimeout);

    test(`Test to set a region.`, 
    async done => {
        await Utility.setEvent(Connection, "SET_REGION", CARTA.SetRegion, 
            {
                fileId: 0, 
                regionId: -1, 
                regionName: "a box",
                regionType: CARTA.RegionType.RECTANGLE, 
                channelMin: -1, 
                channelMax: -1, 
                stokes: [],
                controlPoints: [
                    {x: 1000, y: 1300}, 
                    {x: 300, y: 200}
                ],
                rotation: 0,
            }
        );
        await new Promise( resolve => {
            Utility.getEvent(Connection, "SET_REGION_ACK", CARTA.SetRegionAck, 
                SetRegionAck => {
                    expect(SetRegionAck.success).toBe(true);
                    expect(SetRegionAck.regionId).toEqual(1);
                    
                    resolve();
                }
            );  
        });
        done();
    }, mouseEventTimeout);

    test(`Assert region spectral profile.`, 
    async done => {
        await Utility.setEvent(Connection, "SET_SPECTRAL_REQUIREMENTS", CARTA.SetSpectralRequirements, 
            {
                fileId: 0, 
                regionId: 1, 
                spectralProfiles: [{
                    coordinate: "z", 
                    statsTypes: [CARTA.StatsType.Mean]
                }],
            }
        );
        await new Promise( resolve => {
            Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
                (SpectralProfileData: CARTA.SpectralProfileData) => {
                    expect(SpectralProfileData.fileId).toEqual(0);
                    expect(SpectralProfileData.regionId).toEqual(1);
                    expect(SpectralProfileData.stokes).toEqual(0);

                    expect(SpectralProfileData.profiles.find(f => f.coordinate === "z").vals[218]).toBeCloseTo(3.506743836071e-03, 6);
                    
                    resolve();
                }
            ); 
        });
        done();        
    }, mouseEventTimeout);

    afterAll( done => {
        Connection.close();
        done();
    });
});