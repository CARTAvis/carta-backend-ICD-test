import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let WebSocket = require("ws");
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let expectRootPath = "";
let testSubdirectoryName = "set_QA";
let connectionTimeout = 1000;
let testFileName = "G14.114-0.574.continuum.image.pbcor.fits";

describe("CHECK_RASTER_IMAGE_DATA_noCompression tests", () => {   
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

    test(`connect to CARTA "${testServerUrl}" & ...`, 
    done => {
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
    }, connectionTimeout);

    describe(`access directory`, () => {
        [[expectRootPath], [testSubdirectoryName]
        ].map(
            ([dir]) => {
                test(`assert the directory "${dir}" opens.`, 
                done => {
                    // Preapare the message
                    let message = CARTA.FileListRequest.create({directory: dir});
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
                            expect(event.data.byteLength).toBeGreaterThan(0);
                            let eventData = new Uint8Array(event.data, 36);
                            expect(CARTA.FileListResponse.decode(eventData).success).toBe(true);
            
                            done();
                        }
                    };
                }, connectionTimeout);
            }
        );
    });

    describe(`test the file "${testFileName}"`, () => {
        
        test(`assert the file "${testFileName}" loads info.`, 
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
                    message = CARTA.FileInfoRequest.create({
                        directory: testSubdirectoryName, file: testFileName, hdu: "0"});
                    payload = CARTA.FileInfoRequest.encode(message).finish();
                    eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                    eventDataTx.set(Utility.stringToUint8Array("FILE_INFO_REQUEST", 32));
                    eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                    eventDataTx.set(payload, 36);

                    Connection.send(eventDataTx);

                    // While receive a message
                    Connection.onmessage = (eventInfo: MessageEvent) => {
                        eventName = Utility.getEventName(new Uint8Array(eventInfo.data, 0, 32));
                        if (eventName === "FILE_INFO_RESPONSE") {
                            eventData = new Uint8Array(eventInfo.data, 36);
                            let fileInfoMessage = CARTA.FileInfoResponse.decode(eventData);
                            // console.log(fileInfoMessage.fileInfoExtended);
                            expect(fileInfoMessage.success).toBe(true);
                            done();
                        } // if
                    }; // onmessage
                } // if
            }; // onmessage "FILE_LIST_RESPONSE"
        }, connectionTimeout); // test

        test(`assert the file "${testFileName}" opens.`, 
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
                    message = CARTA.OpenFile.create({
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
                    Connection.onmessage = (eventOpen: MessageEvent) => {
                        eventName = Utility.getEventName(new Uint8Array(eventOpen.data, 0, 32));
                        if (eventName === "OPEN_FILE_ACK") {
                            eventData = new Uint8Array(eventOpen.data, 36);
                            let openFileMessage = CARTA.OpenFileAck.decode(eventData);
                            // console.log(openFileMessage);
                            expect(openFileMessage.success).toBe(true);

                            done();
                        } // if
                    }; // onmessage
                } // if
            }; // onmessage "FILE_LIST_RESPONSE"
        }, connectionTimeout); // test

        test(`assert the file "${testFileName}" reads image.`, 
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

                            // Preapare the message
                            let messageSetImageView = CARTA.SetImageView.create({
                                fileId: 0, imageBounds: {xMin: 0, xMax: openFileMessage.fileInfoExtended.width, yMin: 0, yMax: openFileMessage.fileInfoExtended.height}, 
                                mip: 3, compressionType: CARTA.CompressionType.ZFP, 
                                compressionQuality: 11, numSubsets: 4
                            });
                            payload = CARTA.SetImageView.encode(messageSetImageView).finish();
                            eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                            eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_VIEW", 32));
                            eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                            eventDataTx.set(payload, 36);

                            Connection.send(eventDataTx);

                            // While receive a message
                            Connection.onmessage = (eventRasterImageData: MessageEvent) => {
                                eventName = Utility.getEventName(new Uint8Array(eventRasterImageData.data, 0, 32));
                                if (eventName === "RASTER_IMAGE_DATA") {
                                    eventData = new Uint8Array(eventRasterImageData.data, 36);
                                    let rasterImageDataMessage = CARTA.RasterImageData.decode(eventData);
                                    expect(rasterImageDataMessage.imageData.length).toBeGreaterThan(0);

                                    done();
                                } // if
                            }; // onmessage "RASTER_IMAGE_DATA"
                        } // if
                    }; // onmessage "OPEN_FILE_ACK"
                } // if
            }; // onmessage "FILE_LIST_RESPONSE"
        }, connectionTimeout); // test
    }); // describe

    describe(`open the file "${testFileName} and ...`, 
    () => {
        beforeEach( 
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
            
            done();

        }, connectionTimeout);       
        
        test(`assert the return message.`, 
        done => {

            // While receive a message
            Connection.onmessage = (event: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));                
                if (eventName === "OPEN_FILE_ACK") {
                    let eventData = new Uint8Array(event.data, 36);
                    let openFileMessage = CARTA.OpenFileAck.decode(eventData);
                    
                    expect(openFileMessage.success).toBe(true);
                    expect(openFileMessage.fileId).toBe(0);

                    done();
                } // if
            }; // onmessage "FILE_LIST_RESPONSE"
        }, connectionTimeout); // test

        test(`assert "file info".`, 
        done => {
            // While receive a message
            Connection.onmessage = (event: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));                
                if (eventName === "OPEN_FILE_ACK") {
                    let eventData = new Uint8Array(event.data, 36);
                    let openFileMessage = CARTA.OpenFileAck.decode(eventData);

                    expect(openFileMessage.fileInfo.HDUList).toEqual(["0"]);
                    expect(openFileMessage.fileInfo.name).toBe(testFileName);

                    done();
                } // if
            }; // onmessage "FILE_LIST_RESPONSE"
        }, connectionTimeout); // test

        test(`assert "file info extended".`, 
        done => {
            // While receive a message
            Connection.onmessage = (event: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));                
                if (eventName === "OPEN_FILE_ACK") {
                    let eventData = new Uint8Array(event.data, 36);
                    let openFileMessage = CARTA.OpenFileAck.decode(eventData);
                    // console.log(openFileMessage.fileInfoExtended.headerEntries);

                    expect(openFileMessage.fileInfoExtended.depth).toEqual(1);
                    expect(openFileMessage.fileInfoExtended.height).toEqual(1024);
                    expect(openFileMessage.fileInfoExtended.width).toEqual(1024);
                    expect(openFileMessage.fileInfoExtended.stokes).toEqual(1);
                    expect(openFileMessage.fileInfoExtended.stokesVals).toEqual([""]);
                    expect(openFileMessage.fileInfoExtended.dimensions).toEqual(4);

                    done();
                } // if
            }; // onmessage "FILE_LIST_RESPONSE"
        }, connectionTimeout); // test

        test(`assert "file info extended headerEntries".`, 
        done => {
            // While receive a message
            Connection.onmessage = (event: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));                
                if (eventName === "OPEN_FILE_ACK") {
                    let eventData = new Uint8Array(event.data, 36);
                    let openFileMessage = CARTA.OpenFileAck.decode(eventData);
                    // console.log(openFileMessage.fileInfoExtended.headerEntries);

                    expect(parseInt(openFileMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS").value)).toEqual(4);
                    expect(parseInt(openFileMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS1").value)).toEqual(1024);
                    expect(parseInt(openFileMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS2").value)).toEqual(1024);
                    expect(parseInt(openFileMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS3").value)).toEqual(1);
                    expect(parseInt(openFileMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS4").value)).toEqual(1);

                    expect(openFileMessage.fileInfoExtended.headerEntries.find( f => f.name === "RADESYS").value).toEqual("ICRS");

                    done();
                } // if
            }; // onmessage "FILE_LIST_RESPONSE"
        }, connectionTimeout); // test

    });    

    describe(`open the file "${testFileName} and read image data ...`, 
    () => {
        beforeEach( 
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
                    expect(openFileMessage.success).toBe(true);
                    
                    done();
                }
            };

        }, connectionTimeout);

        describe(`test raster image data with extended info.`, () => {
            [[0, {xMin: 0, xMax: 1024, yMin: 0, yMax: 1024}, 3, CARTA.CompressionType.NONE, 0, 4, 465124, 0, 0, 
                    1024, 1024, 0.000010574989573797211, -0.0012399675051710801, {idx: 117, value: 11452}, 302412, 
                    {point: {x: 190, y: 156, xMax: 341}, value: 0.005836978}, {point: {x: 155, y: 127, xMax: 341}, value: 0.0002207166}],
             
            ].map(
                function([fileID, imageBounds, mip, compressionType, compressionQuality, numSubsets, imageDataLength, channel, stokes, 
                            numBins, binsLength, binWidth, firstBinCenter, binsValue, channelHistogramSum, 
                            assertPoint1, assertPoint2]: 
                         [number, {xMin: number, xMax: number, yMin: number, yMax: number}, number, CARTA.CompressionType, number, number, number, number, number, 
                            number, number, number, number, {idx: number, value: number}, number, 
                            {point: {x: number, y: number, xMax: number}, value: number}, {point: {x: number, y: number, xMax: number}, value: number}]) {
                    
                    test(`assert the file returns correct image info.`, 
                    done => {
                        // Preapare the message
                        let messageSetImageView = CARTA.SetImageView.create({
                            fileId: fileID, imageBounds, mip, 
                            compressionType, compressionQuality, numSubsets
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
                                // console.log(rasterImageDataMessage);

                                expect(rasterImageDataMessage.fileId).toEqual(fileID);
                                expect(rasterImageDataMessage.imageBounds).toEqual({xMax: imageBounds.xMax, yMax: imageBounds.yMax});
                                expect(rasterImageDataMessage.compressionType).toEqual(compressionType);
                                if (rasterImageDataMessage.compressionType !== CARTA.CompressionType.NONE) {
                                    expect(rasterImageDataMessage.compressionQuality).toEqual(compressionQuality);                                        
                                }
                                expect(rasterImageDataMessage.mip).toEqual(mip);
                                expect(rasterImageDataMessage.channel).toEqual(channel);
                                expect(rasterImageDataMessage.stokes).toEqual(stokes);

                                done();
                            } // if
                        }; // onmessage
                                         
                    } // done
                    , connectionTimeout); // test

                    test(`assert channel histogram data.`, 
                    done => {
                        // Preapare the message
                        let messageSetImageView = CARTA.SetImageView.create({
                            fileId: fileID, imageBounds, mip, 
                            compressionType, compressionQuality, numSubsets
                        });
                        let payload = CARTA.SetImageView.encode(messageSetImageView).finish();
                        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_VIEW", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);

                        Connection.send(eventDataTx);

                        // While receive a message
                        Connection.onmessage = (eventRasterImageData: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(eventRasterImageData.data, 0, 32));
                            if (eventName === "RASTER_IMAGE_DATA") {
                                let eventData = new Uint8Array(eventRasterImageData.data, 36);
                                let rasterImageDataMessage = CARTA.RasterImageData.decode(eventData);
                                let channelHistogram = rasterImageDataMessage.channelHistogramData.histograms[0];
                                // console.log(channelHistogram);

                                expect(channelHistogram.numBins).toEqual(numBins);
                                expect(channelHistogram.bins.length).toEqual(binsLength);
                                expect(channelHistogram.binWidth).toBeCloseTo(binWidth, 12);
                                expect(channelHistogram.firstBinCenter).toBeCloseTo(firstBinCenter, 9);
                                expect(channelHistogram.bins[binsValue.idx]).toEqual(binsValue.value);

                                let HistogramSum = 0;
                                channelHistogram.bins.forEach((x) => HistogramSum += x );
                                expect(HistogramSum).toEqual(channelHistogramSum);

                                done();
                            } // if
                        }; // onmessage
                                                               
                    } // done
                    , connectionTimeout); // test

                    test(`assert nan_encodings is empty.`, 
                    done => {
                        // Preapare the message
                        let messageSetImageView = CARTA.SetImageView.create({
                            fileId: fileID, imageBounds, mip, 
                            compressionType, compressionQuality, numSubsets
                        });
                        let payload = CARTA.SetImageView.encode(messageSetImageView).finish();
                        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_VIEW", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);

                        Connection.send(eventDataTx);

                        // While receive a message
                        Connection.onmessage = (eventRasterImageData: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(eventRasterImageData.data, 0, 32));
                            if (eventName === "RASTER_IMAGE_DATA") {
                                let eventData = new Uint8Array(eventRasterImageData.data, 36);
                                let rasterImageDataMessage = CARTA.RasterImageData.decode(eventData);
                                let nanEncodings = rasterImageDataMessage.nanEncodings;
                                // console.log(nanEncodings.length);

                                if (compressionType === CARTA.CompressionType.NONE) {
                                    expect(nanEncodings.length).toEqual(0);
                                } else {
                                    expect(nanEncodings.length).toBeGreaterThan(0);
                                }                                   

                                done();
                            } // if
                        }; // onmessage
                                                              
                    } // done
                    , connectionTimeout); // test

                    test(`assert data value at position (${assertPoint1.point.x}, ${assertPoint1.point.y}) & (${assertPoint2.point.x}, ${assertPoint2.point.y}).`, 
                    done => {
                        // Preapare the message
                        let messageSetImageView = CARTA.SetImageView.create({
                            fileId: fileID, imageBounds, mip, 
                            compressionType, compressionQuality, numSubsets
                        });
                        let payload = CARTA.SetImageView.encode(messageSetImageView).finish();
                        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_VIEW", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);

                        Connection.send(eventDataTx);

                        // While receive a message
                        Connection.onmessage = (eventRasterImageData: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(eventRasterImageData.data, 0, 32));
                            if (eventName === "RASTER_IMAGE_DATA") {
                                let eventData = new Uint8Array(eventRasterImageData.data, 36);
                                let rasterImageDataMessage = CARTA.RasterImageData.decode(eventData);
                                let imageData = rasterImageDataMessage.imageData;

                                let imageDataSum = 0;
                                imageData.forEach((x) => imageDataSum += x.length );
                                expect(imageDataSum).toEqual(imageDataLength);

                                if (compressionType === CARTA.CompressionType.NONE) {
                                    let movingIndex = 4 * ( assertPoint1.point.y * assertPoint1.point.xMax + assertPoint1.point.x );
                                    expect(Buffer.from(imageData[0].slice(movingIndex, movingIndex + 4)).readFloatLE(0)).toBeCloseTo(assertPoint1.value, 8);
                                    
                                    movingIndex = 4 * ( assertPoint2.point.y * assertPoint2.point.xMax + assertPoint2.point.x );
                                    expect(Buffer.from(imageData[0].slice(movingIndex, movingIndex + 4)).readFloatLE(0)).toBeCloseTo(assertPoint2.value, 8);
                                }
                                
                                done();
                            } // if
                        }; // onmessage
                                                                 
                    } // done
                    , connectionTimeout); // test


                } // function([ ])
            ); // map
        }); // describe

    });

    afterEach( done => {
        Connection.close();
        done();
    });
});