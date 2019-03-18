import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import fileName from "./file.json";
import config from "./config.json";

let pidusage = require("pidusage");

let serverURL = config.serverURL;
let port = config.port + 1000;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let testDirectory = config.path.performance;    
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let execWait = config.wait.exec;
let psWait = config.wait.ps;
let cursorWait = config.wait.cursor;
let setCursorRepeat = config.repeat.cursor;
let logMessage = config.log;
let state = {index: -1};

let testImageFiles = [
    // fileName.imageFiles2fits,
    // fileName.imageFiles4fits,
    fileName.imageFiles8fits,
    // fileName.imageFiles16fits,
    // fileName.imageFiles32fits,
    // fileName.imageFiles64fits,
    // fileName.imageFiles128fits,
];
let testThreadNumber: number[] = [
    64,
    32,
    24,
    16,
    12,
    8,
    4,
    2,
    1,
];

describe("Spatial profile performance: 1 user on 1 backend change thread number", () => {    
    
    test(`Preparing... dry run.`, 
    done => {
        
        let cartaBackend = child_process.exec(
            `./carta_backend root=base base=${baseDirectory} port=5678 threads=4`,
            {
                cwd: backendDirectory, 
                timeout: 5000
            }
        );
        cartaBackend.on("error", error => {
            console.log(`error: ${error}`);
        });
        cartaBackend.stdout.on("data", data => {
            if (logMessage) {
                console.log(data);
            }            
        });      
        
        setTimeout(() => {
            let Connection = new WebSocket(`${serverURL}:5678`);
            Connection.binaryType = "arraybuffer";

            Connection.onopen = () => {
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        
                        Connection.close();
                    }
                );
                Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234"
                    }
                );
            };
            Connection.onclose = () => {
                cartaBackend.kill();
            };
        }, 300);

        cartaBackend.on("close", () => {
            done();
        });

    }, connectTimeout);

    testImageFiles.map(
        (imageFiles: string[]) => {
            let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];

            describe(`Change the number of thread: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        test(`set cursor randomly ${setCursorRepeat} times on "${Utility.arrayNext(imageFiles, state).next()}" on backend with thread number = ${threadNumber}.`, 
                        done => {
                            
                            port += threadNumber;
                            let cartaBackend = child_process.exec(
                                `./carta_backend root=base base=${baseDirectory} port=${port} threads=${threadNumber}`,
                                {
                                    cwd: backendDirectory, 
                                    timeout: readFileTimeout
                                }
                            );
                            cartaBackend.on("error", error => {
                                console.log(`error: \n ${error}`);
                            });
                            cartaBackend.stdout.on("data", data => {
                                if (logMessage) {
                                    console.log(data);
                                }
                            });
                            
                            let timer: number = 0;        
                            let timeElapsed: number = 0;

                            setTimeout(() => {
                                let Connection = new WebSocket(`${serverURL}:${port}`);
                                Connection.binaryType = "arraybuffer";
                                
                                Connection.onopen = () => {
                                    Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                                        RegisterViewerAck => {
                                            expect(RegisterViewerAck.success).toBe(true);
                                            Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                                (OpenFileAck: CARTA.OpenFileAck) => {
                                                    if (!OpenFileAck.success) {
                                                        console.error(OpenFileAck.message);
                                                    }
                                                    expect(OpenFileAck.success).toBe(true);
                                                    Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                                        RasterImageData => {
                                                            expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                                                            let randPoint = {
                                                                x: Math.floor(Math.random() * RasterImageData.imageBounds.xMax), 
                                                                y: Math.floor(Math.random() * RasterImageData.imageBounds.yMax)};
                                                            
                                                            timer = new Date().getTime();
                                                            for ( let index = 1; index <= setCursorRepeat; index++) {
                                                                Utility.getEvent(Connection, "SPATIAL_PROFILE_DATA", CARTA.SpatialProfileData, 
                                                                    SpatialProfileData => {
                                                                        expect(SpatialProfileData.profiles.length).not.toEqual(0);

                                                                        if (index === setCursorRepeat) {                                                        
                                                                            timeElapsed = (new Date().getTime() - timer) / setCursorRepeat - cursorWait;
                                                                            Connection.close(); 
                                                                        }
                                                                        
                                                                    }
                                                                );
                                                                Utility.sleep(cursorWait);
                                                                Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                                                                    {
                                                                        fileId: 0, 
                                                                        point: randPoint,
                                                                    }
                                                                );
                                                            }
                                                        }
                                                    );
                                                    Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                                                        {
                                                            fileId: 0, 
                                                            imageBounds: {
                                                                xMin: 0, xMax: OpenFileAck.fileInfoExtended.width, 
                                                                yMin: 0, yMax: OpenFileAck.fileInfoExtended.height,
                                                            }, 
                                                            mip: 64, 
                                                            compressionType: CARTA.CompressionType.ZFP, 
                                                            compressionQuality: 11, 
                                                            numSubsets: 4,
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
                                                    directory: testDirectory, 
                                                    file: Utility.arrayNext(imageFiles, state).current(), 
                                                    hdu: "0", 
                                                    fileId: 0, 
                                                    renderMode: CARTA.RenderMode.RASTER,
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
                                };
                                
                                Connection.onclose =  () => {
                                    setTimeout( async () => {
                                        let usage: {
                                            cpu: number,
                                            memory: number,
                                            ppid: number,
                                            pid: number,
                                            ctime: number,
                                            elapsed: number,
                                            timestamp: number,
                                        } = await pidusage(cartaBackend.pid);

                                        timeEpoch.push({
                                            time: timeElapsed, 
                                            thread: threadNumber, 
                                            CPUusage: usage.cpu,
                                            RAM: usage.memory
                                        });

                                        cartaBackend.kill();
                                    }, psWait);
                                };
                                
                            }, execWait);

                            cartaBackend.on("close", () => {
                                if (threadNumber === testThreadNumber[testThreadNumber.length - 1]) {
                                    console.log(`Backend testing outcome:\n${timeEpoch
                                        .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(4)}% & RAM = ${e.RAM} bytes as thread# = ${e.thread}`).join(` \n`)}`);
                                } 
                                
                                done();
                            });
                            
                        }, readFileTimeout);
                    }
                );
            });
        }
    );
});    
