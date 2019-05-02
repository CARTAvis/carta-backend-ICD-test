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
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "1234"
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
            await Utility.setEvent(this, CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, CARTA.FileListResponse, 
                        FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        baseDirectory = FileListResponseBase.directory;
                        resolve();
                    }
                );                
            });
            await Utility.setEvent(this, CARTA.OpenFile, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0", 
                    fileId: 0, 
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, CARTA.OpenFileAck, 
                    OpenFileAck => {
                        expect(OpenFileAck.success).toBe(true);
                        resolve();
                    }
                );                
            });
            await Utility.setEvent(this, CARTA.SetImageView, 
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
                Utility.getEvent(this, CARTA.RasterImageData, 
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
        await Utility.setEvent(Connection, CARTA.SetRegion, 
            {
                fileId: 0, 
                regionId: -1, 
                regionName: "a box",
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [
                    {x: 1000, y: 1300}, 
                    {x: 300, y: 200}
                ],
                rotation: 0,
            }
        );
        await new Promise( resolve => {
            Utility.getEvent(Connection, CARTA.SetRegionAck, 
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
        await Utility.setEvent(Connection, CARTA.SetSpectralRequirements, 
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
            Utility.getEvent(Connection, CARTA.SpectralProfileData, 
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