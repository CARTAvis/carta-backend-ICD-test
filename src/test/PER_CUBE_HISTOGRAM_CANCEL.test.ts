import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cubeHistogramTimeout = config.timeout.cubeHistogram;
let messageReturnTimeout = config.timeout.readLargeImage;
let cancelTimeout = config.timeout.cancel;

let baseDirectory: string;

describe("PER_CUBE_HISTOGRAM_CANCEL tests: Testing the cancellation capability of the calculations of the per-cube histogram", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            await Utility.setEvent(this, CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, CARTA.FileListResponse, 
                        FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        baseDirectory = FileListResponseBase.directory;
                        resolve();
                    }
                );                
            });
            done();   
        }
    }, connectionTimeout);

    describe(`test the files`, () => {
        [
         ["supermosaic.10.fits",                         0,     "0",    {xMin: 0, xMax:  4224, yMin: 0, yMax:  1824},               1,      CARTA.CompressionType.ZFP,  11,                 4],
        //  ["HH211_IQU_zoom_4ch.image.pbcor",              0,     "0",    {xMin: 0, xMax:   251, yMin: 0, yMax:   251},               1,      CARTA.CompressionType.ZFP,  11,                 4],
        ].map(
            function ([testFileName,                fileId,     hdu,    imageBounds,                                              mip,      compressionType,            compressionQuality, numSubsets]: 
                      [string,                      number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number,   CARTA.CompressionType,      number,             number]) {
                
                test(`assert file "${testFileName}" to be ready.`, 
                async () => {
                    await Utility.setEvent(Connection, CARTA.OpenFile, 
                        {
                            directory: baseDirectory + "/" + testSubdirectoryName, 
                            file: testFileName, 
                            hdu, 
                            fileId, 
                            renderMode: CARTA.RenderMode.RASTER,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.OpenFileAck, 
                            OpenFileAck => {
                                expect(OpenFileAck.success).toBe(true);
                                resolve();
                            }
                        );
                        
                    });
                    await Utility.setEvent(Connection, CARTA.SetImageView, 
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
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.RasterImageData, 
                            RasterImageData => {
                                expect(RasterImageData.fileId).toEqual(fileId);
                                resolve();
                            }
                        );                
                    });
                }, openFileTimeout);
                
                let regionHistogramProgress: number;
                test(`assert the first REGION_HISTOGRAM_DATA arrives.`, 
                async () => {
                    await Utility.setEvent(Connection, CARTA.SetHistogramRequirements, 
                        {
                            fileId, 
                            regionId: -2, 
                            histograms: [{channel: -2, numBins: -1}],
                        }
                    );
                    await new Promise( resolve => { 
                        Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                            RegionHistogramData => {
                                regionHistogramProgress = RegionHistogramData.progress;
                                console.log(`Region Histogram Progress = ${regionHistogramProgress}`);                                
                                expect(regionHistogramProgress).toBeGreaterThan(0);
                                expect(RegionHistogramData.regionId).toEqual(-2);                                
                                resolve();
                            }
                        );
                    });
                }, readFileTimeout);

                test(`assert the second REGION_HISTOGRAM_DATA arrives.`, 
                async () => {
                    await new Promise( resolve => {                        
                        Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                            RegionHistogramData => {
                                expect(RegionHistogramData.progress).toBeGreaterThan(regionHistogramProgress);
                                regionHistogramProgress = RegionHistogramData.progress;
                                console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                                resolve();
                            }
                        );
                    });
                }, readFileTimeout);

                test(`assert no more REGION_HISTOGRAM_DATA returns.`, 
                async () => {
                    /// After 10 seconds, the request of the per-cube histogram is cancelled.
                    await new Promise( resolve => {
                        setTimeout(() => {
                            resolve();
                        }, cancelTimeout);
                    });
                    await Utility.setEvent(Connection, CARTA.SetHistogramRequirements, 
                        {
                            fileId, 
                            regionId: -2, 
                            histograms: [],
                        }
                    );
                    await new Promise( (resolve, reject) => {                        
                        Connection.onmessage = (messageEvent: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                            expect(eventName).not.toEqual("REGION_HISTOGRAM_DATA");
                            resolve();
                        };
                        let failTimer = setTimeout(() => {
                            clearTimeout(failTimer);
                            reject();
                        }, messageReturnTimeout);
                    });
                }, readFileTimeout + messageReturnTimeout + cancelTimeout);

                test(`assert a renew REGION_HISTOGRAM_DATA as the progress be 1.0 .`, 
                async () => {
                    /// Then request to get the per-cube histogram again in 2 seconds.
                    await new Promise( resolve => {
                        setTimeout(() => {
                            resolve();
                        }, 2000);
                    });
                    await Utility.setEvent(Connection, CARTA.SetHistogramRequirements, 
                        {
                            fileId, 
                            regionId: -2, 
                            histograms: [{channel: -2, numBins: -1}],
                        }
                    ); 
                    while (regionHistogramProgress < 1.0) {
                        await new Promise( (resolve, reject) => {                        
                            Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                                (RegionHistogramData: CARTA.RegionHistogramData) => {
                                    regionHistogramProgress = RegionHistogramData.progress;
                                    console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                                    if (regionHistogramProgress === 1.0) {
                                        expect(RegionHistogramData.histograms[0].binWidth).toEqual(0.7235205769538879);
                                        expect(RegionHistogramData.histograms[0].bins.length).toEqual(2775);
                                        expect(RegionHistogramData.histograms[0].bins[2500]).toEqual(9359604);
                                        expect(RegionHistogramData.histograms[0].channel).toEqual(-2);
                                        expect(RegionHistogramData.histograms[0].firstBinCenter).toEqual(-1773.299860805273);
                                        expect(RegionHistogramData.histograms[0].numBins).toEqual(2775); 
                                        expect(RegionHistogramData.regionId).toEqual(-2);
                                    }
                                    resolve();
                                }
                            );
                            let failTimer = setTimeout(() => {
                                clearTimeout(failTimer);
                                reject();
                            }, messageReturnTimeout);
                        });
                    }
                }, cubeHistogramTimeout);
                
            }
        );
    }); // describe
    
    afterAll( () => {
        Connection.close();
    });
});