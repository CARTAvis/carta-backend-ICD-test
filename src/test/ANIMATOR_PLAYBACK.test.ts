import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let readFileTimeout = config.timeout.readFile;
let playTimeout = config.timeout.playImages;

let baseDirectory: string;
let testFileName = "S255_IR_sci.spw25.cube.I.pbcor.fits";
let playFrames = 150; // image

describe("ANIMATOR_PLAYBACK test: Testing if full resolution cursor xy profiles are delivered correctly", () => {   
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
    }, readFileTimeout);
    
    let timer: number;
    let timeElapsed: number;
    test(`play ${playFrames} images.`,
    async () => {
        timer = await new Date().getTime();
        for (let idx = 1; idx < playFrames + 1; idx++) {
            await Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels,  
                {
                    fileId: 0, 
                    channel: idx, 
                    stokes: 0,
                }
            );
            await new Promise( (resolve, reject) => {
                Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                    RasterImageData => {
                        expect(RasterImageData.fileId).toEqual(0);
                        expect(RasterImageData.channel).toEqual(idx);
                        expect(RasterImageData.stokes).toEqual(0);
                        resolve();
                    }
                );
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, readFileTimeout);                
            });
        }
        timeElapsed = await new Date().getTime() - timer;
    }, playTimeout); // test

    test(`assert playing time within ${playTimeout} ms.`,
    () => {
        expect(timeElapsed).toBeLessThan(playTimeout);
        expect(timeElapsed).not.toEqual(0);
        console.log(`FPS = ${(timeElapsed ? playFrames * 1000 / timeElapsed : 0)}Hz. @${new Date()}`);
    });   

    afterAll( async () => {
        await Connection.close();
        await expect(Connection.readyState).toBe(WebSocket.CLOSED);
    });
});