/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;
let readFileTimeout = 16000;
let testTimes = 10;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let count: number[][];
let readPeriod = 200;

describe("CURSOR_Z_PROFILE_PERFORMANCE tests", () => {   
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
                        done();
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
                                        
                                        Utility.getEvent(Connection, "SPECTRAL_PROFILE_DATA", CARTA.SpectralProfileData, 
                                            SpectralProfileData => {
                                                expect(SpectralProfileData.profiles.length).not.toEqual(0);                                                        
                                                if (SpectralProfileData.profiles.length > 0) {
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
                                            yMin: 0, yMax: OpenFileAck.fileInfoExtended.height
                                        }, 
                                        mip, 
                                        compressionType, 
                                        compressionQuality, 
                                        numSubsets,
                                    }
                                );
                                Utility.setEvent(Connection, "SET_SPECTRAL_REQUIREMENTS", CARTA.SetSpectralRequirements, 
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
                            }
                        );
                        Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                            {
                                directory: testSubdirectoryName, 
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