/// Manual
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let expectRootPath = "";
let testSubdirectoryName = "set_QA";
let connectionTimeout = 1000;
let disconnectionTimeout = 1000;
let openFileTimeout = 60000;
let readFileTimeout = 180000;
let testTimes = 10;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let count: number[][];
let readPeriod = 500;

describe("CURSOR_XY_PROFILE_PERFORMANCE tests", () => {   
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
                console.log(`Can not open a connection. @${new Date()}`);
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
                }, openFileTimeout);
            }
        );
    });
    
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
            [0,     "hugeGaussian10k.fits",  28, CARTA.CompressionType.ZFP, 11, 4],
            [1,     "hugeGaussian20k.fits",  56, CARTA.CompressionType.ZFP, 11, 4],
            [2,     "hugeGaussian40k.fits", 112, CARTA.CompressionType.ZFP, 11, 4],
            [3,     "hugeGaussian80k.fits", 223, CARTA.CompressionType.ZFP, 11, 4],
            ].map(
                function ([fileIndex, testFileName, mip, compressionType, compressionQuality, numSubsets]: 
                        [number, string, number, CARTA.CompressionType, number, number]) {
                                        
                    if (idx === 0) {

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
                        }, openFileTimeout); // test

                        count.push(new Array(testTimes).fill(0));
                        squareDiffs.push(new Array(testTimes).fill(0));
                        mean.push(0);
                        SD.push(0);  
                    }

                    let timer: number;
                    test(`assert a random cursor at round ${idx + 1}.`, 
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
                                            mip, compressionType, 
                                            compressionQuality, numSubsets
                                        });
                                        payload = CARTA.SetImageView.encode(messageSetImageView).finish();
                                        eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                                        eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_VIEW", 32));
                                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                                        eventDataTx.set(payload, 36);

                                        Connection.send(eventDataTx);

                                        // Preapare the message
                                        let messageSetSpatialReq = CARTA.SetSpatialRequirements.create({fileId: 0, regionId: 0, spatialProfiles: ["x", "y"]});
                                        payload = CARTA.SetSpatialRequirements.encode(messageSetSpatialReq).finish();
                                        eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                                        eventDataTx.set(Utility.stringToUint8Array("SET_SPATIAL_REQUIREMENTS", 32));
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

                                                let randPoint = {
                                                    x: Math.floor(Math.random() * rasterImageDataMessage.imageBounds.xMax), 
                                                    y: Math.floor(Math.random() * rasterImageDataMessage.imageBounds.yMax)};
                                                
                                                Utility.sleep(readPeriod);
                                                
                                                // Preapare the message
                                                const setCursorMessage = CARTA.SetCursor.create({fileId: 0, point: randPoint});
                                                payload = CARTA.SetCursor.encode(setCursorMessage).finish();
                                                eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);
                    
                                                eventDataTx.set(Utility.stringToUint8Array("SET_CURSOR", 32));
                                                eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                                                eventDataTx.set(payload, 36);
                    
                                                Connection.send(eventDataTx);
                                                
                                                timer = new Date().getTime();                                        

                                                // While receive a message
                                                Connection.onmessage = (eventInfo: MessageEvent) => {
                                                    eventName = Utility.getEventName(new Uint8Array(eventInfo.data, 0, 32));
                                                    if (eventName === "SPATIAL_PROFILE_DATA") {
                                                        eventData = new Uint8Array(eventInfo.data, 36);
                                                        let spatialProfileDataMessage = CARTA.SpatialProfileData.decode(eventData);
                                                        // console.log(spatialProfileDataMessage);

                                                        expect(spatialProfileDataMessage.profiles.length).not.toEqual(0);                                                        
                                                        if (spatialProfileDataMessage.profiles.length > 0) {
                                                            count[fileIndex][idx] = new Date().getTime() - timer;                                                        
                                                        }
        
                                                        if (idx + 1 === testTimes) {
                                                            let naturalCount = count[fileIndex].filter(e => e !== 0);
                                                            mean[fileIndex] = naturalCount.reduce((a, b) => a + b, 0) / testTimes;
                                                            squareDiffs[fileIndex] = naturalCount.map(function(value: number) {
                                                                    let diff = value - mean[fileIndex];
                                                                    return diff * diff;
                                                                });
                                                            SD[fileIndex] = Math.sqrt(squareDiffs[fileIndex].reduce((a, b) => a + b, 0) / squareDiffs[fileIndex].length);
                                                            console.log(`for "${testFileName}": returning time = ${naturalCount} ms.  mean = ${mean[fileIndex]} ms.  deviation = ${SD[fileIndex]} ms. @${new Date()}`); 

                                                        }          
                                                        
                                                        done();
                                                    } // if
                                                }; // onmessage
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