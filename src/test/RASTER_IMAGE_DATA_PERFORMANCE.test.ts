import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import { array } from "prop-types";

let WebSocket = require("ws");
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let expectRootPath = "";
let testSubdirectoryName = "set_QA";
let connectionTimeout = 1000;
let disconnectionTimeout = 1000;
let openFileTimeout = 60000;
let readPeriod = 200;
let readFileTimeout = 180000;
let count: number[][];
let testTimes = 10;

describe("RASTER_IMAGE_DATA_PERFORMANCE tests", () => {   
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
                const message = CARTA.RegisterViewer.create({sessionId: "", apiKey: "1234"});
                let payload = CARTA.RegisterViewer.encode(message).finish();
                let eventData = new Uint8Array(32 + 4 + payload.byteLength);

                eventData.set(Utility.stringToUint8Array("REGISTER_VIEWER", 32));
                eventData.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                eventData.set(payload, 36);

                Connection.send(eventData);

                // While receive a message in the form of arraybuffer
                Connection.onmessage = (event: MessageEvent) => {
                    const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                    if (eventName === "REGISTER_VIEWER_ACK") {
                        expect(event.data.byteLength).toBeGreaterThan(0);
                        eventData = new Uint8Array(event.data, 36);
                        expect(CARTA.RegisterViewerAck.decode(eventData).success).toBe(true);
                        
                        done();
                    }
                };
            } else {
                console.log(`Can not open a connection.`);
                done();
            }
        };
    }, connectionTimeout);

    let mean: number[];
    let squareDiffs: number[][];
    let SD: number[];
    count = [];
    squareDiffs = [];
    SD = [];
    mean = [];
    for (let idx = 0; idx < testTimes; idx++) {
        describe(`test the files`, () => {
            [ 
             [0,    "cluster_00128.fits",       {xMin: 0, xMax:   128, yMin: 0, yMax:   128},    1, CARTA.CompressionType.ZFP, 18, 4],
             [1,    "cluster_00256.fits",       {xMin: 0, xMax:   256, yMin: 0, yMax:   256},    1, CARTA.CompressionType.ZFP, 12, 4],
             [2,    "cluster_00512.fits",       {xMin: 0, xMax:   512, yMin: 0, yMax:   512},    2, CARTA.CompressionType.ZFP, 11, 4], 
             [3,    "cluster_01024.fits",       {xMin: 0, xMax:  1024, yMin: 0, yMax:  1024},    3, CARTA.CompressionType.ZFP, 11, 4],
             [4,    "cluster_02048.fits",       {xMin: 0, xMax:  2048, yMin: 0, yMax:  2048},    6, CARTA.CompressionType.ZFP, 11, 4],
             [5,    "cluster_04096.fits",       {xMin: 0, xMax:  4096, yMin: 0, yMax:  4096},   12, CARTA.CompressionType.ZFP, 11, 4],  
             [6,    "cluster_08192.fits",       {xMin: 0, xMax:  8192, yMin: 0, yMax:  8192},   23, CARTA.CompressionType.ZFP, 11, 4],
             [7,    "cluster_16384.fits",       {xMin: 0, xMax: 16384, yMin: 0, yMax: 16384},   46, CARTA.CompressionType.ZFP, 11, 4],
             [8,    "cluster_32768.fits",       {xMin: 0, xMax: 32768, yMin: 0, yMax: 32768},   92, CARTA.CompressionType.ZFP, 11, 4],
             [9,    "hugeGaussian10k.fits",     {xMin: 0, xMax: 10000, yMin: 0, yMax: 10000},   28, CARTA.CompressionType.ZFP, 11, 4],
             [10,   "hugeGaussian20k.fits",     {xMin: 0, xMax: 20000, yMin: 0, yMax: 20000},   56, CARTA.CompressionType.ZFP, 11, 4],
             [11,   "hugeGaussian40k.fits",     {xMin: 0, xMax: 40000, yMin: 0, yMax: 40000},  112, CARTA.CompressionType.ZFP, 11, 4],
            //  [12,   "hugeGaussian80k.fits",     {xMin: 0, xMax: 80000, yMin: 0, yMax: 80000},  223, CARTA.CompressionType.ZFP, 11, 4],
            ].map(
                function ([fileIndex, testFileName, imageBounds, mip, compressionType, compressionQuality, numSubsets]: 
                        [number, string, {xMin: number, xMax: number, yMin: number, yMax: number}, number, CARTA.CompressionType, number, number]) {
                                    
                    if (idx === 0) {
                        test.skip(`assert the file "${testFileName}" opens.`, 
                        done => {
                            
                            // Preapare the message
                            let message = CARTA.OpenFile.create({
                                directory: testSubdirectoryName, 
                                file: testFileName, hdu: "0", fileId: 0, 
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

                                    done();
                                } // if
                            }; // onmessage
                        }, openFileTimeout); // test

                        count.push(new Array(testTimes).fill(0));
                        squareDiffs.push(new Array(testTimes).fill(0));
                        mean.push(0);
                        SD.push(0);  
                    }                    
                    
                    let timer: number;
                    test(`assert the file "${testFileName}" reads image at round ${idx + 1}.`, 
                    done => {

                        // Preapare the message
                        let message = CARTA.FileListRequest.create({directory: testSubdirectoryName});
                        let payload = CARTA.FileListRequest.encode(message).finish();
                        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);
                
                        eventDataTx.set(Utility.stringToUint8Array("FILE_LIST_REQUEST", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);
                
                        Connection.send(eventDataTx);
                
                        // While receive a message
                        Connection.onmessage = (event: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                            if (eventName === "FILE_LIST_RESPONSE") {
                                let eventData = new Uint8Array(event.data, 36);
                                expect(CARTA.FileListResponse.decode(eventData).success).toBe(true);

                                // Preapare the message
                                let messageOpenFile = CARTA.OpenFile.create({
                                    directory: testSubdirectoryName, 
                                    file: testFileName, hdu: "0", fileId: 0, 
                                    renderMode: CARTA.RenderMode.RASTER
                                });
                                payload = CARTA.OpenFile.encode(messageOpenFile).finish();
                                eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                                eventDataTx.set(Utility.stringToUint8Array("OPEN_FILE", 32));
                                eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                                eventDataTx.set(payload, 36);

                                Connection.send(eventDataTx);

                                // While receive a message
                                Connection.onmessage = (eventOpen: MessageEvent) => {
                                    eventName = Utility.getEventName(new Uint8Array(eventOpen.data, 0, 32));
                                    if (eventName === "OPEN_FILE_ACK") {
                                        eventData = new Uint8Array(eventOpen.data, 36);
                                        let openFileMessage = CARTA.OpenFileAck.decode(eventData);
                                        expect(openFileMessage.success).toBe(true);                                        

                                        Utility.sleep(readPeriod);

                                        // Preapare the message
                                        let messageSetImageView = CARTA.SetImageView.create({
                                            fileId: 0, imageBounds: {xMin: 0, xMax: openFileMessage.fileInfoExtended.width, yMin: 0, yMax: openFileMessage.fileInfoExtended.height}, 
                                            mip, compressionType, 
                                            compressionQuality, numSubsets
                                        });
                                        payload = CARTA.SetImageView.encode(messageSetImageView).finish();
                                        eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                                        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_VIEW", 32));
                                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                                        eventDataTx.set(payload, 36);

                                        Connection.send(eventDataTx);

                                        timer = new Date().getTime();

                                        // While receive a message
                                        Connection.onmessage = (eventRasterImageData: MessageEvent) => {
                                            eventName = Utility.getEventName(new Uint8Array(eventRasterImageData.data, 0, 32));
                                            if (eventName === "RASTER_IMAGE_DATA") {
                                                eventData = new Uint8Array(eventRasterImageData.data, 36);
                                                let rasterImageDataMessage = CARTA.RasterImageData.decode(eventData);
                                                expect(rasterImageDataMessage.imageData.length).not.toEqual(0);

                                                if (rasterImageDataMessage.imageData.length > 0) {
                                                    count[fileIndex][idx] = new Date().getTime() - timer;
                                                }

                                                if (idx + 1 === testTimes) {
                                                    mean[fileIndex] = count[fileIndex].reduce((a, b) => a + b, 0) / testTimes;
                                                    squareDiffs[fileIndex] = count[fileIndex].map(function(value: number) {
                                                            let diff = value - mean[fileIndex];
                                                            return diff * diff;
                                                        });
                                                    SD[fileIndex] = Math.sqrt(squareDiffs[fileIndex].reduce((a, b) => a + b, 0) / squareDiffs[fileIndex].length);
                                                    console.log(`for "${testFileName}": returning time = ${count[fileIndex]} ms. mean = ${mean[fileIndex]} ms. deviation = ${SD[fileIndex]} ms. @${Date.now()}`);
                            
                                                }

                                                done();
                                            } // if
                                        }; // onmessage "RASTER_IMAGE_DATA"
                                    } // if
                                }; // onmessage "OPEN_FILE_ACK"
                            } // if
                        }; // onmessage "FILE_LIST_RESPONSE"
                    }, readFileTimeout); // test 
                    
                }
            );
        }); // describe

    }   

    afterEach( done => {
        Connection.close();
        done();
    }, disconnectionTimeout);

});