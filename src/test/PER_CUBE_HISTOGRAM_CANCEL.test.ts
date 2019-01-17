/// Manual
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let testSubdirectoryName = "set_QA";
let connectionTimeout = 1000;
let openFileTimeout = 8000;
let receiveDataTimeout = 6000;
let userWaitTimeout = 85000;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let messageReturnTimeout = 4000;
let waitCancelTimeout = 10000;

describe("PER_CUBE_HISTOGRAM_CANCEL tests: Testing the cancellation capability of the calculations of the per-cube histogram", () => {   
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
                console.log(`Can not open a connection. @${new Date()}`);
                done();
            }            
        };
    }, connectionTimeout);

    describe(`test the files`, () => {
        [
         ["supermosaic.10.fits",                         0,     "0",    {xMin: 0, xMax:  4224, yMin: 0, yMax:  1824},               1,      CARTA.CompressionType.ZFP,  11,                 4],
        //  ["HH211_IQU_zoom_4ch.image.pbcor",              0,     "0",    {xMin: 0, xMax:   251, yMin: 0, yMax:   251},               1,      CARTA.CompressionType.ZFP,  11,                 4],
        ].map(
            function ([testFileName,                fileId,     hdu,    imageBounds,                                              mip,      compressionType,            compressionQuality, numSubsets]: 
                      [string,                      number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number,   CARTA.CompressionType,      number,             number]) {
                
                test(`assert file "${testFileName}" to be ready.`, done => { 
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

                    // While receive a message
                    Connection.onmessage = (eventOpenFile: MessageEvent) => {
                        let eventName = Utility.getEventName(new Uint8Array(eventOpenFile.data, 0, 32));
                        if (eventName === "OPEN_FILE_ACK") {
                            // Preapare the message
                            let messageSetImageView = CARTA.SetImageView.create({
                                fileId, 
                                imageBounds: {xMin: imageBounds.xMin, xMax: imageBounds.xMax, yMin: imageBounds.yMin, yMax: imageBounds.yMax}, 
                                mip, compressionType,
                                compressionQuality, numSubsets, 
                            });
                            payload = CARTA.SetImageView.encode(messageSetImageView).finish();
                            eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                            eventDataTx.set(Utility.stringToUint8Array("SET_IMAGE_VIEW", 32));
                            eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                            eventDataTx.set(payload, 36);

                            // While receive a message
                            Connection.onmessage = (eventRasterImage: MessageEvent) => {
                                eventName = Utility.getEventName(new Uint8Array(eventRasterImage.data, 0, 32));
                                if (eventName === "RASTER_IMAGE_DATA") {
                                    let eventRasterImageData = new Uint8Array(eventRasterImage.data, 36);
                                    let rasterImageDataMessage = CARTA.RasterImageData.decode(eventRasterImageData);
                                    expect(rasterImageDataMessage.fileId).toEqual(fileId);

                                    done();
                                } // if
                            }; // onmessage

                            Connection.send(eventDataTx);

                        } // if
                    }; // onmessage

                    Connection.send(eventDataTx);

                }, openFileTimeout);
                
                let regionHistogramProgress: number;
                test(`assert the first REGION_HISTOGRAM_DATA arrives.`, 
                done => { 
                    
                    // While receive a message
                    Connection.onmessage = (messageEvent: MessageEvent) => {
                        let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                        if (eventName === "REGION_HISTOGRAM_DATA") {
                            let messageRegionHistogramData = new Uint8Array(messageEvent.data, 36);
                            let regionHistogramData = CARTA.RegionHistogramData.decode(messageRegionHistogramData);
                            regionHistogramProgress = regionHistogramData.progress;
                            expect(regionHistogramProgress).toBeGreaterThan(0);
                            expect(regionHistogramData.regionId).toEqual(-2);
                            
                            done();
                        } // if
                    }; // onmessage "REGION_HISTOGRAM_DATA"

                    // Preapare the message
                    let messageSetHistogramReq = CARTA.SetHistogramRequirements.create({
                        fileId, regionId: -2, histograms: [{channel: -2, numBins: -1}]
                    });
                    let payload = CARTA.SetHistogramRequirements.encode(messageSetHistogramReq).finish();
                    let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                    eventDataTx.set(Utility.stringToUint8Array("SET_HISTOGRAM_REQUIREMENTS", 32));
                    eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                    eventDataTx.set(payload, 36);

                    Connection.send(eventDataTx); 

                }, receiveDataTimeout); // test

                test(`assert the second REGION_HISTOGRAM_DATA arrives.`, 
                done => {
                    // While receive a message
                    Connection.onmessage = (messageEvent: MessageEvent) => {
                        let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                        if (eventName === "REGION_HISTOGRAM_DATA") {
                            let messageRegionHistogramData = new Uint8Array(messageEvent.data, 36);
                            let regionHistogramData = CARTA.RegionHistogramData.decode(messageRegionHistogramData);
                            expect(regionHistogramData.progress).toBeGreaterThan(regionHistogramProgress);
                            
                            done();

                        } // if
                    }; // onmessage "REGION_HISTOGRAM_DATA"
                }, receiveDataTimeout + waitCancelTimeout); // test

                test(`assert no more REGION_HISTOGRAM_DATA returns.`, 
                done => {
                    
                    setTimeout( () => {
                        // Preapare the message
                        let messageSetHistogramReq = CARTA.SetHistogramRequirements.create({
                            fileId, regionId: -2, histograms: []
                        });
                        let payload = CARTA.SetHistogramRequirements.encode(messageSetHistogramReq).finish();
                        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                        eventDataTx.set(Utility.stringToUint8Array("SET_HISTOGRAM_REQUIREMENTS", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);

                        Connection.send(eventDataTx);

                    }, waitCancelTimeout);

                    setTimeout( () => {
                        // While receive a message
                        Connection.onmessage = (messageEvent: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                            expect(eventName).not.toEqual("REGION_HISTOGRAM_DATA");
                        };
                        expect(Connection.readyState).toBe(1);

                        done();

                    }, messageReturnTimeout + waitCancelTimeout);

                }, receiveDataTimeout + messageReturnTimeout + waitCancelTimeout * 2); // test

                test(`assert a renew REGION_HISTOGRAM_DATA as the progress be 1.0 .`, 
                done => {
                    setTimeout( () => {
                        let messageSetHistogramReq = CARTA.SetHistogramRequirements.create({
                            fileId, regionId: -2, histograms: [{channel: -2, numBins: -1}]
                        });
                        let payload = CARTA.SetHistogramRequirements.encode(messageSetHistogramReq).finish();
                        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                        eventDataTx.set(Utility.stringToUint8Array("SET_HISTOGRAM_REQUIREMENTS", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);

                        Connection.send(eventDataTx);
                    }, messageReturnTimeout + waitCancelTimeout);  
                    
                    let onRegionHistgram = (messageEvent: MessageEvent) => {
                        let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                        if (eventName === "REGION_HISTOGRAM_DATA") {
                            let messageRegionHistogramData = new Uint8Array(messageEvent.data, 36);
                            let regionHistogramData = CARTA.RegionHistogramData.decode(messageRegionHistogramData);
                            regionHistogramProgress = regionHistogramData.progress;
                            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                            
                            if (regionHistogramProgress === 1.0) {
                                expect(regionHistogramData.histograms[0].binWidth).toEqual(0.7235205769538879);
                                expect(regionHistogramData.histograms[0].bins.length).toEqual(2775);
                                expect(regionHistogramData.histograms[0].bins[2500]).toEqual(9359604);
                                expect(regionHistogramData.histograms[0].channel).toEqual(-2);
                                expect(regionHistogramData.histograms[0].firstBinCenter).toEqual(-1773.299860805273);
                                expect(regionHistogramData.histograms[0].numBins).toEqual(2775); 
                                expect(regionHistogramData.regionId).toEqual(-2);
                                
                                done(); 
                            } else {  
                                Connection.onmessage = onRegionHistgram; 
                            }      
                            
                        } // if
                    }; // onmessage "REGION_HISTOGRAM_DATA"
                    Connection.onmessage = onRegionHistgram;

                }, userWaitTimeout); // test
                
            }
        );
    }); // describe
    
    afterAll( done => {
        Connection.close();
        done();
    });
});