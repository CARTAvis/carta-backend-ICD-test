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
                // Preapare the message on a eventData
                let messageOpen = CARTA.RegisterViewer.create({sessionId: "", apiKey: "1234"});
                let payload = CARTA.RegisterViewer.encode(messageOpen).finish();
                let eventData = new Uint8Array(32 + 4 + payload.byteLength);

                eventData.set(Utility.stringToUint8Array("REGISTER_VIEWER", 32));
                eventData.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                eventData.set(payload, 36);

                Connection.send(eventData);
                
                // While receive a message in the form of arraybuffer
                Connection.onmessage = (event: MessageEvent) => {
                    let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                    if (eventName === "REGISTER_VIEWER_ACK") {
                        expect(event.data.byteLength).toBeGreaterThan(0);
                        eventData = new Uint8Array(event.data, 36);
                        expect(CARTA.RegisterViewerAck.decode(eventData).success).toBe(true);
                        
                        // Preapare the message
                        let messageFileList = CARTA.FileListRequest.create({directory: testSubdirectoryName});
                        payload = CARTA.FileListRequest.encode(messageFileList).finish();
                        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);
                
                        eventDataTx.set(Utility.stringToUint8Array("FILE_LIST_REQUEST", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);
                
                        Connection.send(eventDataTx);
                
                        // While receive a message
                        Connection.onmessage = (eventFileList: MessageEvent) => {
                            eventName = Utility.getEventName(new Uint8Array(eventFileList.data, 0, 32));
                            if (eventName === "FILE_LIST_RESPONSE") {
                                expect(eventFileList.data.byteLength).toBeGreaterThan(0);
                                let eventDataFileList = new Uint8Array(eventFileList.data, 36);
                                expect(CARTA.FileListResponse.decode(eventDataFileList).success).toBe(true);
                
                                // Preapare the message
                                let message = CARTA.OpenFile.create({
                                    directory: testSubdirectoryName, 
                                    file: testFileName, hdu: "0", fileId: 0, 
                                    renderMode: CARTA.RenderMode.RASTER
                                });
                                payload = CARTA.OpenFile.encode(message).finish();
                                eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                                eventDataTx.set(Utility.stringToUint8Array("OPEN_FILE", 32));
                                eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                                eventDataTx.set(payload, 36);

                                Connection.send(eventDataTx);

                                // While receive a message
                                Connection.onmessage = (eventOpenFile: MessageEvent) => {
                                    eventName = Utility.getEventName(new Uint8Array(eventOpenFile.data, 0, 32));
                                    if (eventName === "OPEN_FILE_ACK") {
                                        // Preapare the message
                                        let messageSetImageView = CARTA.SetImageView.create({
                                            fileId: 0, 
                                            imageBounds: {xMin: 0, xMax: 1920, yMin: 0, yMax: 1920}, 
                                            mip: 4, compressionType: CARTA.CompressionType.ZFP,
                                            compressionQuality: 11, numSubsets: 4, 
                                        });
                                        payload = CARTA.SetImageView.encode(messageSetImageView).finish();
                                        eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                                        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_VIEW", 32));
                                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                                        eventDataTx.set(payload, 36);

                                        Connection.send(eventDataTx);

                                        // While receive a message
                                        Connection.onmessage = (eventRasterImage: MessageEvent) => {
                                            eventName = Utility.getEventName(new Uint8Array(eventRasterImage.data, 0, 32));
                                            if (eventName === "RASTER_IMAGE_DATA") {
                                                let eventRasterImageData = new Uint8Array(eventRasterImage.data, 36);
                                                let rasterImageDataMessage = CARTA.RasterImageData.decode(eventRasterImageData);
                                                expect(rasterImageDataMessage.fileId).toEqual(0);

                                                done();
                                            } // if
                                        }; // onmessage "RASTER_IMAGE_DATA"
                                    } // if
                                }; // onmessage OPEN_FILE_ACK
                            }
                        }; // onmessage FILE_LIST_RESPONSE
                    }
                }; // onmessage REGISTER_VIEWER_ACK
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
            setTimeout( () => {
                // Preapare the message
                let messageSetImageChanne = CARTA.SetImageChannels.create({
                    fileId: 0, channel: idx, stokes: 0
                });
                let payload = CARTA.SetImageChannels.encode(messageSetImageChanne).finish();
                let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_CHANNELS", 32));
                eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                eventDataTx.set(payload, 36);

                Connection.send(eventDataTx);
            }, playPeriod);

            // While receive a message
            Connection.onmessage = (eventRasterImage: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(eventRasterImage.data, 0, 32));
                if (eventName === "RASTER_IMAGE_DATA") {
                    let eventRasterImageData = new Uint8Array(eventRasterImage.data, 36);
                    let rasterImageDataMessage = CARTA.RasterImageData.decode(eventRasterImageData);
                    expect(rasterImageDataMessage.fileId).toEqual(0);
                    expect(rasterImageDataMessage.channel).toEqual(idx);
                    expect(rasterImageDataMessage.stokes).toEqual(0);

                    if ( idx === playFrames) {
                        timeElapsed = new Date().getTime() - timer;
                    }

                    done();
                } // if
            }; // onmessage "RASTER_IMAGE_DATA"
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