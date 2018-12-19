/// Manual
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let testSubdirectoryName = "set_QA";
let connectionTimeout = 500;
let openFileTimeout = 1000;
let readFileTimeout = 1000;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let WebSocket = require("ws");
let messageReturnTimeout = 200;

describe("ANIMATOR_NAVIGATION tests", () => {   
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
                
                                done();
                            }
                        };
                    }
                };
            } else {
                console.log(`Can not open a connection.`);
                done();
            }            
        };
    }, connectionTimeout);

    describe(`read the files`, () => {
        [
         ["HH211_IQU_zoom_4ch.image.pbcor",             0,       "",        {xMin: 0, xMax:   251, yMin: 0, yMax:   251},  1],
         ["S255_IR_sci.spw25.cube.I.pbcor.fits",        1,      "0",        {xMin: 0, xMax:  1920, yMin: 0, yMax:  1920},  4],
        ].map(
            function ([testFileName,    fileId,     hdu,    imageBounds,                                              mip]: 
                      [string,          number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number]) {
                
                test(`assert file name ${testFileName} with file id: ${fileId} ready.`, done => { 
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
                            // Preapare the message
                            let messageSetImageView = CARTA.SetImageView.create({
                                fileId, 
                                imageBounds: {xMin: imageBounds.xMin, xMax: imageBounds.xMax, yMin: imageBounds.yMin, yMax: imageBounds.yMax}, 
                                mip, compressionType: CARTA.CompressionType.NONE,
                                compressionQuality: 0, numSubsets: 0, 
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
                                    expect(rasterImageDataMessage.fileId).toEqual(fileId);

                                    done();
                                } // if
                            }; // onmessage "RASTER_IMAGE_DATA"
                        } // if
                    }; // onmessage
                }, openFileTimeout);
                
            }
        );
    }); // describe

    test(`assert image channel to be 0 on file ID 0.`, 
    done => { 
        // Preapare the message
        let messageSetImageChanne = CARTA.SetImageChannels.create({
            fileId: 0, channel: 1, stokes: 1
        });
        let payload = CARTA.SetImageChannels.encode(messageSetImageChanne).finish();
        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_CHANNELS", 32));
        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
        eventDataTx.set(payload, 36);

        Connection.send(eventDataTx);

        // While receive a message
        Connection.onmessage = (eventRasterImage: MessageEvent) => {
            let eventName = Utility.getEventName(new Uint8Array(eventRasterImage.data, 0, 32));
            if (eventName === "RASTER_IMAGE_DATA") {
                let eventRasterImageData = new Uint8Array(eventRasterImage.data, 36);
                let rasterImageDataMessage = CARTA.RasterImageData.decode(eventRasterImageData);
                expect(rasterImageDataMessage.fileId).toEqual(0);
                expect(rasterImageDataMessage.channel).toEqual(1);
                expect(rasterImageDataMessage.stokes).toEqual(1);
                expect(rasterImageDataMessage.imageBounds).toEqual({xMax:   251, yMax:   251});
                expect(rasterImageDataMessage.mip).toEqual(1);

                done();
            } // if
        }; // onmessage "RASTER_IMAGE_DATA"
    }, readFileTimeout); // test

    test(`assert image channel to be 100 on file ID 1.`, 
    done => { 
        // Preapare the message
        let messageSetImageChanne = CARTA.SetImageChannels.create({
            fileId: 1, channel: 100
        });
        let payload = CARTA.SetImageChannels.encode(messageSetImageChanne).finish();
        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_CHANNELS", 32));
        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
        eventDataTx.set(payload, 36);

        Connection.send(eventDataTx);

        // While receive a message
        Connection.onmessage = (eventRasterImage: MessageEvent) => {
            let eventName = Utility.getEventName(new Uint8Array(eventRasterImage.data, 0, 32));
            if (eventName === "RASTER_IMAGE_DATA") {
                let eventRasterImageData = new Uint8Array(eventRasterImage.data, 36);
                let rasterImageDataMessage = CARTA.RasterImageData.decode(eventRasterImageData);
                expect(rasterImageDataMessage.fileId).toEqual(1);
                expect(rasterImageDataMessage.channel).toEqual(100);
                expect(rasterImageDataMessage.stokes).toEqual(0);
                expect(rasterImageDataMessage.imageBounds).toEqual({xMax:   1920, yMax:   1920});
                expect(rasterImageDataMessage.mip).toEqual(4);

                done();
            } // if
        }; // onmessage "RASTER_IMAGE_DATA"
    }, readFileTimeout); // test

    afterAll( done => {
        Connection.close();
        done();
    });
});

describe("ANIMATOR_NAVIGATION_ERROR tests", () => {   
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
                
                                done();
                            }
                        };
                    }
                };
            } else {
                console.log(`Can not open a connection.`);
                done();
            }            
        };
    }, connectionTimeout);

    describe(`read the files`, () => {
        [
         ["HH211_IQU_zoom_4ch.image.pbcor",             0,       "",        {xMin: 0, xMax:   251, yMin: 0, yMax:   251},  1],
         ["S255_IR_sci.spw25.cube.I.pbcor.fits",        1,      "0",        {xMin: 0, xMax:  1920, yMin: 0, yMax:  1920},  4],
        ].map(
            function ([testFileName,    fileId,     hdu,    imageBounds,                                              mip]: 
                      [string,          number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number]) {
                
                test(`assert file name ${testFileName} with file id: ${fileId} ready.`, done => { 
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
                            // Preapare the message
                            let messageSetImageView = CARTA.SetImageView.create({
                                fileId, 
                                imageBounds: {xMin: imageBounds.xMin, xMax: imageBounds.xMax, yMin: imageBounds.yMin, yMax: imageBounds.yMax}, 
                                mip, compressionType: CARTA.CompressionType.NONE,
                                compressionQuality: 0, numSubsets: 0, 
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
                                    expect(rasterImageDataMessage.fileId).toEqual(fileId);

                                    done();
                                } // if
                            }; // onmessage "RASTER_IMAGE_DATA"
                        } // if
                    }; // onmessage
                }, openFileTimeout);
                                
            }
        );
    }); // describe

    test(`assert not returns (image channel: 1000 & stokes: 3 on file ID 0).`, 
    done => { 
        // Preapare the message
        let messageSetImageChanne = CARTA.SetImageChannels.create({
            fileId: 0, channel: 100, stokes: 3
        });
        let payload = CARTA.SetImageChannels.encode(messageSetImageChanne).finish();
        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_CHANNELS", 32));
        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
        eventDataTx.set(payload, 36);

        Connection.send(eventDataTx);

        setTimeout( () => { 
            expect.assertions(1);
            // While receive a message
            Connection.onmessage = (eventRasterImage: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(eventRasterImage.data, 0, 32));
                return expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
            }; // onmessage "RASTER_IMAGE_DATA"

            expect(Connection.readyState).toBe(1);

            done();
        }, messageReturnTimeout);
        
    }, readFileTimeout); // test

    test(`assert not returns (image channel: 3000 & stokes: 1 on file ID 1).`, 
    done => { 
        // Preapare the message
        let messageSetImageChanne = CARTA.SetImageChannels.create({
            fileId: 1, channel: 3000, stokes: 1
        });
        let payload = CARTA.SetImageChannels.encode(messageSetImageChanne).finish();
        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_CHANNELS", 32));
        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
        eventDataTx.set(payload, 36);

        Connection.send(eventDataTx);

        setTimeout( () => {
            expect.assertions(2); 
            // While receive a message
            Connection.onmessage = (eventRasterImage: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(eventRasterImage.data, 0, 32));
                return expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
            }; // onmessage "RASTER_IMAGE_DATA"

            expect(Connection.readyState).toBe(1);

            done();
        }, messageReturnTimeout);
        
    }, readFileTimeout); // test

    test(`assert not returns (image channel: 0 & stokes: 0 on file ID 2).`, 
    done => { 
        // Preapare the message
        let messageSetImageChanne = CARTA.SetImageChannels.create({
            fileId: 2, channel: 0, stokes: 0
        });
        let payload = CARTA.SetImageChannels.encode(messageSetImageChanne).finish();
        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_CHANNELS", 32));
        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
        eventDataTx.set(payload, 36);

        Connection.send(eventDataTx);

        setTimeout( () => { 
            expect.assertions(2);
            // While receive a message
            Connection.onmessage = (eventRasterImage: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(eventRasterImage.data, 0, 32));
                return expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
            }; // onmessage "RASTER_IMAGE_DATA"

            expect(Connection.readyState).toBe(1);

            done();
        }, messageReturnTimeout);
        
    }, readFileTimeout); // test

    afterAll( done => {
        Connection.close();
        done();
    });
});