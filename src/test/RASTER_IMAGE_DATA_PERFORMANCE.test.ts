import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readLargeImage;
let testTimes = config.repeat.image;

let baseDirectory: string;

describe("RASTER_IMAGE_DATA_PERFORMANCE test: Testing performance of the generation of RASTER_IMAGE_DATA", () => {   
    let Connection: WebSocket;

    beforeEach( done => {
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

    let mean: number[] = [];
    let squareDiffs: number[][] = [];
    let SD: number[] = [];
    let count: number[][] = [];
    for (let idx = 0; idx < testTimes; idx++) {
        describe(`prepare the file`, () => {
            [ 
                [0,    "cluster_00128.fits",       {xMin: 0, xMax:   128, yMin: 0, yMax:   128},    1, CARTA.CompressionType.ZFP, 18, 4],
                [1,    "cluster_00256.fits",       {xMin: 0, xMax:   256, yMin: 0, yMax:   256},    1, CARTA.CompressionType.ZFP, 12, 4],
                [2,    "cluster_00512.fits",       {xMin: 0, xMax:   512, yMin: 0, yMax:   512},    2, CARTA.CompressionType.ZFP, 11, 4], 
                [3,    "cluster_01024.fits",       {xMin: 0, xMax:  1024, yMin: 0, yMax:  1024},    3, CARTA.CompressionType.ZFP, 11, 4],
                [4,    "cluster_02048.fits",       {xMin: 0, xMax:  2048, yMin: 0, yMax:  2048},    6, CARTA.CompressionType.ZFP, 11, 4],
                // [5,    "cluster_04096.fits",       {xMin: 0, xMax:  4096, yMin: 0, yMax:  4096},   12, CARTA.CompressionType.ZFP, 11, 4],  
                // [6,    "cluster_08192.fits",       {xMin: 0, xMax:  8192, yMin: 0, yMax:  8192},   23, CARTA.CompressionType.ZFP, 11, 4],
                // [7,    "cluster_16384.fits",       {xMin: 0, xMax: 16384, yMin: 0, yMax: 16384},   46, CARTA.CompressionType.ZFP, 11, 4],
                // [8,    "cluster_32768.fits",       {xMin: 0, xMax: 32768, yMin: 0, yMax: 32768},   92, CARTA.CompressionType.ZFP, 11, 4],
                // [9,    "hugeGaussian10k.fits",     {xMin: 0, xMax: 10000, yMin: 0, yMax: 10000},   28, CARTA.CompressionType.ZFP, 11, 4],
                // [10,   "hugeGaussian20k.fits",     {xMin: 0, xMax: 20000, yMin: 0, yMax: 20000},   56, CARTA.CompressionType.ZFP, 11, 4],
                // [11,   "hugeGaussian40k.fits",     {xMin: 0, xMax: 40000, yMin: 0, yMax: 40000},  112, CARTA.CompressionType.ZFP, 11, 4],
                // [12,   "hugeGaussian80k.fits",     {xMin: 0, xMax: 80000, yMin: 0, yMax: 80000},  223, CARTA.CompressionType.ZFP, 11, 4],
            ].map(
                function (
                    [fileIndex,     testFileName,   imageBounds,                                                mip,        compressionType,        compressionQuality, numSubsets]: 
                    [number,        string,         {xMin: number, xMax: number, yMin: number, yMax: number},   number,     CARTA.CompressionType,  number,             number]) {
                                    
                    if (idx === 0) {                        
                        // Initialize array
                        count.push(new Array(testTimes).fill(0));
                        squareDiffs.push(new Array(testTimes).fill(0));
                        mean.push(0);
                        SD.push(0);  
                    }                    
                    
                    let timer: number;
                    test(`assert image be read at round ${idx + 1} on the file "${testFileName}".`, 
                    async () => {
                        await Utility.setEvent(Connection, CARTA.OpenFile, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName, 
                                file: testFileName, 
                                hdu: "0", 
                                fileId: 0, 
                                renderMode: CARTA.RenderMode.RASTER
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
                                fileId: 0, 
                                imageBounds: {
                                    xMin: imageBounds.xMin, xMax: imageBounds.xMax, 
                                    yMin: imageBounds.yMin, yMax: imageBounds.xMax
                                }, 
                                mip, 
                                compressionType, 
                                compressionQuality, 
                                numSubsets,
                            }
                        );
                        timer = await new Date().getTime();
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, CARTA.RasterImageData, 
                                RasterImageData => {
                                    expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                                    resolve();
                                }
                            );
                        });
                        count[fileIndex][idx] = await new Date().getTime() - timer;

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
                    }, readFileTimeout); 
                    
                }
            );
        }); // describe

    }   

    afterEach( () => {
        Connection.close();
    });

});