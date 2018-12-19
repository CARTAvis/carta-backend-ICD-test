/// Manual
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let testSubdirectoryName = "set_QA";
let connectionTimeout = 1000;
let openFileTimeout = 2000;
let readFileTimeout = 2000;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let WebSocket = require("ws");

describe("OPEN_IMAGE_MULTIFRAME tests", () => {   
    let Connection: WebSocket;

    beforeEach( done => {
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
                
                                done();
                            }
                        };
                    }
                };
            } else {
                console.log(`Can not open a connection. @${new Date()}`);
                done();
            }            
        };
    }, connectionTimeout);

    describe(`read the files`, () => {
        [
         ["HH211_IQU_zoom_4ch.image.pbcor",             0,       "",        {xMin: 0, xMax:   251, yMin: 0, yMax:   251},  1],
         ["S255_IR_sci.spw25.cube.I.pbcor.fits",        1,      "0",        {xMin: 0, xMax:  1920, yMin: 0, yMax:  1920},  4],
         ["G34mm1_lsb_all.uv.part1.line.natwt.sml",     2,       "",        {xMin: 0, xMax:   129, yMin: 0, yMax:   129},  1],
        ].map(
            function ([testFileName,    fileId,     hdu,    imageBounds,                                              mip]: 
                      [string,          number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number]) {
                                   
                test(`assert the file "${testFileName}" to open.`, 
                done => { 
                    // Preapare the message
                    let message = CARTA.OpenFile.create({
                        directory: testSubdirectoryName, 
                        file: testFileName, hdu, fileId, 
                        renderMode: CARTA.RenderMode.RASTER
                    });
                    let payload = CARTA.OpenFile.encode(message).finish();
                    let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                    eventDataTx.set(Utility.stringToUint8Array("OPEN_FILE", 32));
                    eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                    eventDataTx.set(payload, 36);

                    Connection.send(eventDataTx);
   
                    // While receive a message
                    Connection.onmessage = (eventOpen: MessageEvent) => {
                        let eventName = Utility.getEventName(new Uint8Array(eventOpen.data, 0, 32));
                        if (eventName === "OPEN_FILE_ACK") {
                            let eventData = new Uint8Array(eventOpen.data, 36);
                            let openFileMessage = CARTA.OpenFileAck.decode(eventData);
                            // console.log(openFileMessage);
                            expect(openFileMessage.success).toBe(true);
                            expect(openFileMessage.fileId).toEqual(fileId);

                            done();
                        } // if
                    }; // onmessage
                }, openFileTimeout); // test

                describe(`read the file "${testFileName}"`, () => {
                    beforeEach( done => {
                        // Preapare the message
                        let message = CARTA.OpenFile.create({
                            directory: testSubdirectoryName, 
                            file: testFileName, hdu, fileId, 
                            renderMode: CARTA.RenderMode.RASTER
                        });
                        let payload = CARTA.OpenFile.encode(message).finish();
                        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                        eventDataTx.set(Utility.stringToUint8Array("OPEN_FILE", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);

                        Connection.send(eventDataTx);
    
                        // While receive a message
                        Connection.onmessage = (eventOpenFile: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(eventOpenFile.data, 0, 32));
                            if (eventName === "OPEN_FILE_ACK") {
                                // console.log(eventOpenFile);
                                done();
                            } // if
                        }; // onmessage
                    }, openFileTimeout);

                    test(`assert the file id of "${testFileName}" to be ${fileId}.`, 
                    done => { 
                        // Preapare the message
                        let messageSetImageView = CARTA.SetImageView.create({
                            fileId, 
                            imageBounds: {xMin: imageBounds.xMin, xMax: imageBounds.xMax, yMin: imageBounds.yMin, yMax: imageBounds.yMax}, 
                            mip, compressionType: CARTA.CompressionType.NONE,
                            compressionQuality: 0, numSubsets: 0, 
                        });
                        let payload = CARTA.SetImageView.encode(messageSetImageView).finish();
                        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_VIEW", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);

                        Connection.send(eventDataTx);

                        // While receive a message
                        Connection.onmessage = (eventRasterImage: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(eventRasterImage.data, 0, 32));
                            if (eventName === "RASTER_IMAGE_DATA") {
                                let eventRasterImageData = new Uint8Array(eventRasterImage.data, 36);
                                let rasterImageDataMessage = CARTA.RasterImageData.decode(eventRasterImageData);
                                expect(rasterImageDataMessage.fileId).toEqual(fileId);

                                done();
                            } // if
                        }; // onmessage "RASTER_IMAGE_DATA"
                    }, readFileTimeout); // test

                });      

            }
        );
    }); // describe

    afterEach( done => {
        Connection.close();
        done();
    });
});