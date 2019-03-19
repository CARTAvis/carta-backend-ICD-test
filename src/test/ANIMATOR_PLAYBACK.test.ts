/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let readFileTimeout = config.timeout.readFile;
let prepareTimeout = 1000; // ms
let playTimeout = 20000; // ms

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let baseDirectory: string;
let testFileName = "S255_IR_sci.spw25.cube.I.pbcor.fits";
let playFrames = 150; // image
let playPeriod = 1; // ms

describe("ANIMATOR_PLAYBACK tests", () => {   
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
                    apiKey: "1234"
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
                    expect(RasterImageData.fileId).toEqual(0);
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

    }, prepareTimeout);
   
    let timer: number = 0;
    timer = new Date().getTime();
    let timeElapsed: number = 0;
    for (let idx = 1; idx < playFrames + 1; idx++) {
        test(`assert image${idx} to play.`,
        done => {
            Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                RasterImageData => {
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