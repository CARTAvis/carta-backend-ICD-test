/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let readFileTimeout = config.timeout.readFile;
let prepareTimeout = 1000; // ms
let playTimeout = 15000; // ms

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testFileName = "S255_IR_sci.spw25.cube.I.pbcor.fits";
let playFrames = 150; // image
let playPeriod = 10; // ms

describe("ANIMATOR_PLAYBACK tests", () => {   
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
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(true);
                        Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            (FileListResponse: CARTA.FileListResponse) => {
                                expect(FileListResponse.success).toBe(true);
                                Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                    (OpenFileAck: CARTA.OpenFileAck) => {
                                        expect(OpenFileAck.success).toBe(true);
                                        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                            (RasterImageData: CARTA.RasterImageData) => {
                                                expect(RasterImageData.fileId).toEqual(0);
                                                done();
                                            }
                                        );
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
                        Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                            {
                                directory: testSubdirectoryName
                            }
                        );
                    }
                );
                Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234"
                    }
                );
            } else {
                console.log(`Can not open a connection. @${new Date()}`);
                done();
            }            
        };
    }, prepareTimeout);
   
    let timer: number = 0;
    timer = new Date().getTime();
    let timeElapsed: number = 0;
    for (let idx = 1; idx < playFrames + 1; idx++) {
        test(`assert image${idx} to play.`,
        done => {
            Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                (RasterImageData: CARTA.RasterImageData) => {
                    expect(RasterImageData.fileId).toEqual(0);
                    expect(RasterImageData.channel).toEqual(idx);
                    expect(RasterImageData.stokes).toEqual(0);

                    if ( idx === playFrames) {
                        timeElapsed = new Date().getTime() - timer;
                    }
                    done();
                }
            );
            setTimeout( () => {
                Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
                {
                    fileId: 0, 
                    channel: idx, 
                    stokes: 0,
                });
            }, playPeriod);

        }, readFileTimeout); // test
    
    }

    test(`assert playing time within ${playTimeout} ms.`,
    () => {
        expect(timeElapsed).toBeLessThan(playTimeout);
        expect(timeElapsed).not.toEqual(0);
        console.log(`FPS = ${(timeElapsed ? playFrames * 1000 / timeElapsed : 0)} Hz. @${new Date()}`);
    }); // test    

    afterAll( done => {
        Connection.close();
        done();
    });
});