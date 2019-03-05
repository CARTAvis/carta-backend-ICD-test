/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;
let openFileTimeout = 5000;
let receiveDataTimeout = 5000;
let userWaitTimeout = 35000;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let baseDirectory: string;

describe("PER_CUBE_HISTOGRAM tests: Testing calculations of the per-cube histogram", () => {   
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
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            FileListResponseBase => {
                                expect(FileListResponseBase.success).toBe(true);
                                baseDirectory = FileListResponseBase.directory;
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                            {
                                directory: expectBasePath
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
    }, connectionTimeout);

    describe(`test the files`, () => {
        [
         ["supermosaic.10.fits",                         0,     "0",    {xMin: 0, xMax:  4224, yMin: 0, yMax:  1824},               1,      CARTA.CompressionType.ZFP,  11,                 4],
        //  ["HH211_IQU_zoom_4ch.image.pbcor",              0,     "0",    {xMin: 0, xMax:   251, yMin: 0, yMax:   251},               1,      CARTA.CompressionType.ZFP,  11,                 4],
        ].map(
            function ([testFileName,                fileId,     hdu,    imageBounds,                                              mip,      compressionType,            compressionQuality, numSubsets]: 
                      [string,                      number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number,   CARTA.CompressionType,      number,             number]) {
                
                test(`assert file "${testFileName}" to be ready.`, 
                done => {
                    Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                        OpenFileAck => {
                            expect(OpenFileAck.success).toBe(true);
                            Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                RasterImageData => {
                                    expect(RasterImageData.fileId).toEqual(fileId);
                                    done();
                                }
                            );
                            Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                                {
                                    fileId, 
                                    imageBounds: {
                                        xMin: imageBounds.xMin, xMax: imageBounds.xMax, 
                                        yMin: imageBounds.yMin, yMax: imageBounds.yMax
                                    }, 
                                    mip, 
                                    compressionType,
                                    compressionQuality, 
                                    numSubsets,
                                }
                            );
                        }
                    );
                    Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                        {
                            directory: baseDirectory + "/" + testSubdirectoryName, 
                            file: testFileName, 
                            hdu, fileId, 
                            renderMode: CARTA.RenderMode.RASTER,
                        }
                    );

                }, openFileTimeout);
                
                let regionHistogramProgress: number;
                test(`assert the first REGION_HISTOGRAM_DATA arrives.`, 
                done => { 
                    Utility.getEvent(Connection, "REGION_HISTOGRAM_DATA", CARTA.RegionHistogramData, 
                        RegionHistogramData => {
                            regionHistogramProgress = RegionHistogramData.progress;
                            expect(regionHistogramProgress).toBeGreaterThan(0);
                            expect(RegionHistogramData.regionId).toEqual(-2);
                            done();
                        }
                    );
                    Utility.setEvent(Connection, "SET_HISTOGRAM_REQUIREMENTS", CARTA.SetHistogramRequirements, 
                        {
                            fileId, 
                            regionId: -2, 
                            histograms: [{channel: -2, numBins: -1}],
                        }
                    );

                }, receiveDataTimeout); // test

                test(`assert the second REGION_HISTOGRAM_DATA arrives.`, 
                done => {                    
                    Utility.getEvent(Connection, "REGION_HISTOGRAM_DATA", CARTA.RegionHistogramData, 
                        RegionHistogramData => {
                            expect(RegionHistogramData.progress).toBeGreaterThan(regionHistogramProgress);
                            done();
                        }
                    );
                }, receiveDataTimeout); // test

                test(`assert the REGION_HISTOGRAM_DATA as the progress be just greater than 0.5 .`, 
                done => {
                    let onRegionHistgram = (messageEvent: MessageEvent) => {
                        let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                        if (eventName === "REGION_HISTOGRAM_DATA") {
                            let messageRegionHistogramData = new Uint8Array(messageEvent.data, 36);
                            let regionHistogramData = CARTA.RegionHistogramData.decode(messageRegionHistogramData);
                            regionHistogramProgress = regionHistogramData.progress;
                            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                            if (regionHistogramProgress > 0.5) {
                                expect(regionHistogramData.histograms[0].binWidth).toEqual(0.7235205769538879);
                                expect(regionHistogramData.histograms[0].bins.length).toEqual(2775);
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

                test(`assert the REGION_HISTOGRAM_DATA as the progress be 1.0 .`, 
                done => {
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