import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let expectBasePath = config.path.base;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;

let testFileName = "S255_IR_sci.spw25.cube.I.pbcor.fits";
let baseDirectory: string;

describe("CURSOR_Z_PROFILE test: Testing if full resolution cursor z profile is delivered correctly", () => {   
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
            done();
        }
    }, connectionTimeout);

    describe(`open the file "${testFileName} to `, 
    () => {
        beforeAll( async () => {
            await Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0", 
                    fileId: 0, 
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
            let OpenFileAckTemp: CARTA.OpenFileAck; 
            await new Promise( resolve => {
                Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                    OpenFileAck => {
                        expect(OpenFileAck.success).toBe(true);
                        OpenFileAckTemp = OpenFileAck;
                        resolve();
                    }
                );                
            });
            await Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                {
                    fileId: 0, 
                    imageBounds: {
                        xMin: 0, xMax: OpenFileAckTemp.fileInfoExtended.width, 
                        yMin: 0, yMax: OpenFileAckTemp.fileInfoExtended.height
                    }, 
                    mip: 6, 
                    compressionType: CARTA.CompressionType.ZFP, 
                    compressionQuality: 11, 
                    numSubsets: 4
                }
            );
            await Utility.setEvent(Connection, "SET_SPECTRAL_REQUIREMENTS", CARTA.SetSpectralRequirements,  
                {
                    fileId: 0, 
                    regionId: 0, 
                    spectralProfiles: [{coordinate: "z", statsTypes: [CARTA.StatsType.None]}],
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                    RasterImageData => {
                        expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                        resolve();
                    }
                );                
            }); 
        }, connectionTimeout);       
        
        describe(`set a cursor to test the z profiles`, () => {
            [
                [0, {x: 989, y: 1274}, 0, 0, 1, "z", 478, {idx: 300, value: -2.301968207024e-03}],
            ].map(
                function([fileId, point, regionID, stokes, progress, coordinate, profileLen, assertPoint]: 
                        [number, {x: number, y: number}, number, number, number, string, number, {idx: number, value: number}]) {
                    
                    let SpectralProfileDataTemp: CARTA.SpectralProfileData;
                    test(`assert the fileId "${fileId}" returns within ${connectionTimeout}ms, as point {${point.x}, ${point.y}}.`, 
                    async () => {
                        await Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                            {
                                fileId, 
                                point,
                            }
                        );  
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
                                SpectralProfileData => {
                                    SpectralProfileDataTemp = SpectralProfileData;
                                    resolve();
                                }
                            );
                        });                    
                    }, connectionTimeout);

                    test(`assert the fileId "${fileId}" returns: fileId = ${fileId}, as point {${point.x}, ${point.y}}.`, 
                    () => {
                        expect(SpectralProfileDataTemp.fileId).toEqual(fileId);
                    }, connectionTimeout);

                    test(`assert the fileId "${fileId}" returns: regionId = ${regionID},  as point {${point.x}, ${point.y}}.`, 
                    () => {
                        expect(SpectralProfileDataTemp.regionId).toEqual(regionID);
                        
                    } , connectionTimeout);

                    test(`assert the fileId "${fileId}" returns: stokes = ${stokes}, as point {${point.x}, ${point.y}}.`, 
                    () => {
                        expect(SpectralProfileDataTemp.stokes).toEqual(stokes);
                        
                    } , connectionTimeout);

                    test(`assert the fileId "${fileId}" returns: progress = ${progress},  as point {${point.x}, ${point.y}}.`, 
                    () => {
                        expect(SpectralProfileDataTemp.progress).toEqual(progress);

                    } , connectionTimeout);

                    test(`assert the fileId "${fileId}" returns: 
                        coordinate = "${coordinate}", length = "${profileLen}", 
                        vals[${assertPoint.idx}] = "${assertPoint.value}" as point {${point.x}, ${point.y}}.`, 
                    () => {
                        let spectralProfileDataMessageProfile = 
                            SpectralProfileDataTemp.profiles.find(f => f.coordinate === coordinate).vals;
                        expect(spectralProfileDataMessageProfile.length).toEqual(profileLen);
                        expect(spectralProfileDataMessageProfile[assertPoint.idx]).toBeCloseTo(assertPoint.value, 8);
                                      
                    } , connectionTimeout);

                } // function([ ])
            ); // map
        }); // describe

    });

    afterAll( () => {
        Connection.close();
    });
});