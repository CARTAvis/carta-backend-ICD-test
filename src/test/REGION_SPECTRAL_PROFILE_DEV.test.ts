/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;
let mouseEventTimeout = config.timeout.mouseEvent;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testFileName = "S255_IR_sci.spw25.cube.I.pbcor.fits";

describe("REGION_SPECTRAL_PROFILE_DEV: Temporary test case of region spectral profile to assist backend development", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        // Establish a websocket connection in the binary form: arraybuffer 
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        // While open a Websocket
        Connection.onopen = () => {
            // Checkout if Websocket server is ready
            if (Connection.readyState === WebSocket.OPEN) {
                
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        
                        Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                            OpenFileAck => {
                                expect(OpenFileAck.success).toBe(true);

                                Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                    RasterImageData => {
                                        expect(RasterImageData.imageData.length).toBeGreaterThan(1);
                                        
                                        done();
                                });  
                                
                                Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView,
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
                            }  
                        );
                        
                        Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                            {
                                directory: testSubdirectoryName, 
                                file: testFileName, 
                                hdu: "0", 
                                fileId: 0, 
                                renderMode: CARTA.RenderMode.RASTER,
                            }
                        );

                    }
                );
                
                Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234",
                    }
                );

            } else {
                console.log(`Can not open a connection. @${new Date()}`);
                done();
            }
            
        };
    }, connectionTimeout);
 
    test(`Test to set a region.`, 
    done => {
        Utility.getEvent(Connection, "SET_REGION_ACK", CARTA.SetRegionAck, 
            SetRegionAck => {
                expect(SetRegionAck.success).toBe(true);
                expect(SetRegionAck.regionId).toEqual(1);
                
                done();
            }
        );  

        Utility.setEvent(Connection, "SET_REGION", CARTA.SetRegion, 
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
                    {x: 200, y: 300}
                ],
                rotation: 0,
            }
        );

    }, mouseEventTimeout);

    test(`Assert region spectral profile.`, 
    done => {

        Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
            SpectralProfileData => {
                expect(SpectralProfileData.fileId).toEqual(0);
                expect(SpectralProfileData.regionId).toEqual(1);
                expect(SpectralProfileData.stokes).toEqual(0);

                expect(SpectralProfileData.profiles[218]).toEqual(3.506743836071e-03);
                
                done();
            }
        ); 

        Utility.setEvent(Connection, "SET_SPECTRAL_REQUIREMENTS", CARTA.SetSpectralRequirements, 
            {
                fileId: 0, 
                regionId: 1, 
                spectralProfiles: [{
                    coordinate: "z", 
                    statsTypes: [CARTA.StatsType.Mean]
                }],
            }
        );
        
    }, mouseEventTimeout);

    afterAll( done => {
        Connection.close();
        done();
    });
});