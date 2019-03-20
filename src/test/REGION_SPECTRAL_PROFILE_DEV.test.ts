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

        function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            Event1(this);
        }
        function Event1 (connection: WebSocket) {        
            Utility.getEvent(connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                RegisterViewerAck => {
                    expect(RegisterViewerAck.success).toBe(true);
                    Event2(connection);
                }
            );
            
            Utility.setEvent(connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "1234",
                }
            );
        } 
        function Event2 (connection: WebSocket) {
            Utility.getEvent(connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponseBase => {
                    expect(FileListResponseBase.success).toBe(true);
                    baseDirectory = FileListResponseBase.directory;
                    Event3(connection);
                }
            );      
            Utility.setEvent(connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );        
        }
        function Event3 (connection: WebSocket) {
            Utility.getEvent(connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                OpenFileAck => {
                    expect(OpenFileAck.success).toBe(true);
                    Event4(connection);
                }  
            );
            Utility.setEvent(connection, "OPEN_FILE", CARTA.OpenFile, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0", 
                    fileId: 0, 
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
        }
        function Event4 (connection: WebSocket) {
            Utility.getEvent(connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                RasterImageData => {
                    expect(RasterImageData.imageData.length).toBeGreaterThan(1);                    
                    done();
                }
            );  
            
            Utility.setEvent(connection, "SET_IMAGE_VIEW", CARTA.SetImageView,
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
    }, connectionTimeout);
 
    // test(`Test beforeAll().`,()=>{});

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
            (SpectralProfileData: CARTA.SpectralProfileData) => {
                expect(SpectralProfileData.fileId).toEqual(0);
                expect(SpectralProfileData.regionId).toEqual(1);
                expect(SpectralProfileData.stokes).toEqual(0);

                expect(SpectralProfileData.profiles.find(f => f.coordinate === "z").vals[218]).toBeCloseTo(1.5046331100165844e-03, 8);
                
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