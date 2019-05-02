import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;
let testTimes = config.repeat.cursor;
let readLargeImageTimeout = config.timeout.readLargeImage;

let baseDirectory: string;
let count: number[][];

describe("CURSOR_Z_PROFILE_PERFORMANCE test: Testing the performance of cursor z profile generation", () => {   
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
            await Utility.setEvent(this, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
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
                [0, "SgrB2-N.spw0.line.fits", 2, CARTA.CompressionType.ZFP, 11, 4],
                // [1, "OrionKL_sci.spw19.cube.I.pbcor.fits", 7, CARTA.CompressionType.ZFP, 11, 4],
            ].map(
                function ([fileIndex, testFileName, mip, compressionType, compressionQuality, numSubsets]: 
                        [number, string, number, CARTA.CompressionType, number, number]) {
                            
                    if (idx === 0) {
                        // Initialize array
                        count.push(new Array(testTimes).fill(0));
                        squareDiffs.push(new Array(testTimes).fill(0));
                        mean.push(0);
                        SD.push(0);  
                    }                    
                    
                    let timer: number;
                    test(`set a random cursor at round ${idx + 1} on the file "${testFileName}".`, 
                    async () => {
                        await Utility.setEvent(Connection, CARTA.OpenFile, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName, 
                                file: testFileName, 
                                hdu: "0", 
                                fileId: 0, 
                                renderMode: CARTA.RenderMode.RASTER,
                            }
                        );
                        let OpenFileAckTemp: CARTA.OpenFileAck; 
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, CARTA.OpenFileAck, 
                                OpenFileAck => {
                                    expect(OpenFileAck.success).toBe(true);
                                    OpenFileAckTemp = OpenFileAck;
                                    resolve();
                                }
                            );                
                        });
                        await Utility.setEvent(Connection, CARTA.SetImageView, 
                            {
                                fileId: 0, 
                                imageBounds: {
                                    xMin: 0, xMax: OpenFileAckTemp.fileInfoExtended.width, 
                                    yMin: 0, yMax: OpenFileAckTemp.fileInfoExtended.height,
                                }, 
                                mip, 
                                compressionType, 
                                compressionQuality, 
                                numSubsets,
                            }
                        );
                        await Utility.setEvent(Connection, CARTA.SetSpectralRequirements, 
                            {
                                fileId: 0, 
                                regionId: 0, 
                                spectralProfiles: [
                                    {
                                        coordinate: "z", 
                                        statsTypes: [CARTA.StatsType.None]
                                    }
                                ],
                            }
                        );
                        let RasterImageDataTemp: CARTA.RasterImageData;
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, CARTA.RasterImageData, 
                                RasterImageData => {
                                    expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                                    RasterImageDataTemp = RasterImageData;
                                    resolve();
                                }
                            );                
                        });
                        timer = await new Date().getTime();
                        await Utility.setEvent(Connection, CARTA.SetCursor, 
                            {
                                fileId: 0, 
                                point: {
                                    x: Math.floor(Math.random() * RasterImageDataTemp.imageBounds.xMax), 
                                    y: Math.floor(Math.random() * RasterImageDataTemp.imageBounds.yMax)
                                },
                            }
                        );
                        await new Promise( resolve => {                        
                            Utility.getEvent(Connection, CARTA.SpectralProfileData, 
                                    SpectralProfileData => {
                                    expect(SpectralProfileData.profiles.length).not.toEqual(0); 
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
                    }, readLargeImageTimeout); // test
                    
                }
            );
        }); // describe
    }

    afterEach( () => {
        Connection.close();
    });

});