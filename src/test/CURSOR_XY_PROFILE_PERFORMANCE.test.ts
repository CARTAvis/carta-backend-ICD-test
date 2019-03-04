/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;
let readFileTimeout = 180000;
let testTimes = 10;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let baseDirectory: string;
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
                // [2,     "hugeGaussian40k.fits", 112, CARTA.CompressionType.ZFP, 11, 4],
                // [3,     "hugeGaussian80k.fits", 223, CARTA.CompressionType.ZFP, 11, 4],
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
                    test(`assert a random cursor at round ${idx + 1} on the file "${testFileName}".`, 
                    done => {
                        Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                            OpenFileAck => {
                                expect(OpenFileAck.success).toBe(true);
                                Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                    RasterImageData => {
                                        expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                                        let randPoint = {
                                            x: Math.floor(Math.random() * RasterImageData.imageBounds.xMax), 
                                            y: Math.floor(Math.random() * RasterImageData.imageBounds.yMax)};
                                        
                                        Utility.getEvent(Connection, "SPATIAL_PROFILE_DATA", CARTA.SpatialProfileData, 
                                            SpatialProfileData => {
                                                expect(SpatialProfileData.profiles.length).not.toEqual(0);                                                        
                                                if (SpatialProfileData.profiles.length > 0) {
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
                                            }
                                        );
                                        Utility.sleep(readPeriod);
                                        Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                                            {
                                                fileId: 0, 
                                                point: randPoint,
                                            }
                                        );
                                        timer = new Date().getTime();
                                    }
                                );
                                Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                                    {
                                        fileId: 0, 
                                        imageBounds: {
                                            xMin: 0, xMax: OpenFileAck.fileInfoExtended.width, 
                                            yMin: 0, yMax: OpenFileAck.fileInfoExtended.height,
                                        }, 
                                        mip, 
                                        compressionType, 
                                        compressionQuality, 
                                        numSubsets,
                                    }
                                );
                                Utility.setEvent(Connection, "SET_SPATIAL_REQUIREMENTS", CARTA.SetSpatialRequirements, 
                                    {
                                        fileId: 0, 
                                        regionId: 0, 
                                        spatialProfiles: ["x", "y"],
                                    }
                                );
                            }
                        );
                        Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName, 
                                file: testFileName, 
                                hdu: "0", 
                                fileId: 0, 
                                renderMode: CARTA.RenderMode.RASTER
                            }
                        ); 
                    }, readFileTimeout); // test

                }
            );
        }); // describe

    }

    afterEach( done => {
        Connection.close();
        done();
    }, connectionTimeout);

});