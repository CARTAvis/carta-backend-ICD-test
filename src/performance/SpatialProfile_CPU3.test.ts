import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import fileName from "./file.json";
import config from "./config.json";
let pidusage = require("pidusage");

let serverURL = config.serverURL;
let port = config.port + 3000;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let testDirectory = config.path.performance;    
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let execWait = config.wait.exec;
let psWait = config.wait.ps;
let cursorWait = config.wait.cursor;
let setCursorRepeat = config.repeat.cursor;
let eventWait = config.wait.event;
let logMessage = config.log;
let state = {index: -1};

let testUserNumber = 8;
let testImageFiles = [
    fileName.imageFiles2fits,
    // fileName.imageFiles4fits,
    // fileName.imageFiles8fits,
    // fileName.imageFiles16fits,
    // fileName.imageFiles32fits,
    // fileName.imageFiles64fits,
    // fileName.imageFiles128fits,
];

let testThreadNumber: number[] = [    
    8,
    7,
    6,
    5,
    4,
    3,
    2,
    1,
];

describe("Spatial profile performance: change thread number per user, 8 users on 1 backend.", () => {    
    test(`Preparing... dry run.`, 
    done => {
        let cartaBackend = child_process.exec(
            `"./carta_backend" root=base base=${baseDirectory} port=5678 threads=4`,
            {
                cwd: backendDirectory, 
                timeout: 5000
            }
        );
        cartaBackend.on("error", error => {
            console.error(`error: ${error}`);
        });
        cartaBackend.stdout.on("data", data => {
            if (logMessage) {
                console.log(data);
            }            
        });

        setTimeout( () => {
            let Connection = new WebSocket(`${serverURL}:5678`);
            expect(Connection.readyState).toBe(WebSocket.CONNECTING);
            Connection.binaryType = "arraybuffer";            
            Connection.onopen = OnOpen;
            Connection.onclose = () => {
                cartaBackend.kill();
            };
            async function OnOpen (this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                await Utility.setEvent(this, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234"
                    }
                );
                await new Promise( resolve => { 
                    Utility.getEvent(this, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                        RegisterViewerAck => {
                            expect(RegisterViewerAck.success).toBe(true);                            
                            resolve();           
                        }
                    );
                });
                await this.close();
            } 
        }, 300);

        cartaBackend.on("close", () => {
            done();
        });
                
    }, connectTimeout);

    testImageFiles.map(
        (imageFiles: string[]) => { 
            let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
            describe(`Change the number of thread, 8 users open image on 1 backend: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        
                        test(`${threadNumber} threads per user open image ${imageFiles[0].slice(14)}.`, 
                        done => {
                            port ++;
                            let cartaBackend = child_process.exec(
                                `"./carta_backend" root=base base=${baseDirectory} port=${port} threads=${threadNumber * testUserNumber}`,
                                {
                                    cwd: backendDirectory, 
                                    timeout: openFileTimeout
                                }
                            );
                            cartaBackend.on("error", error => {
                                console.error(`error: \n ${error}`);
                            });
                            cartaBackend.stdout.on("data", data => {
                                if (logMessage) {
                                    console.log(data);
                                }
                            });

                            let timer: number = 0;        
                            let timeElapsed: number = 0;

                            let Connection: WebSocket[] = new Array(testUserNumber);
                            setTimeout(() => {
                                for ( let index = 0; index < testUserNumber; index++) {
                                    Connection[index] = new WebSocket(`${serverURL}:${port}`);
                                    expect(Connection[index].readyState).toBe(WebSocket.CONNECTING);
                                    Connection[index].binaryType = "arraybuffer";         
                                    Connection[index].onopen = OnOpen;
                                }
                                
                                async function OnOpen (this: WebSocket, ev: Event) {
                                    expect(this.readyState).toBe(WebSocket.OPEN);
                                    await Utility.setEvent(this, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                                        {
                                            sessionId: "", 
                                            apiKey: "1234"
                                        }
                                    );
                                    await new Promise( resolve => { 
                                        Utility.getEvent(this, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                                            RegisterViewerAck => {
                                                expect(RegisterViewerAck.success).toBe(true);
                                                resolve();           
                                            }
                                        );
                                    });
                                    await Utility.sleep(eventWait);
                                    let OpenFileAckTemp: CARTA.OpenFileAck;
                                    await Utility.setEvent(this, "OPEN_FILE", CARTA.OpenFile, 
                                        {
                                            directory: testDirectory, 
                                            file: Utility.arrayNext(imageFiles, state).next(), 
                                            hdu: "0", 
                                            fileId: 0, 
                                            renderMode: CARTA.RenderMode.RASTER,
                                        }
                                    );
                                    await new Promise( resolve => {
                                        Utility.getEvent(this, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                            (OpenFileAck: CARTA.OpenFileAck) => {
                                                if (!OpenFileAck.success) {
                                                    console.error(OpenFileAck.fileInfo.name + " : " + OpenFileAck.message);
                                                }
                                                expect(OpenFileAck.success).toBe(true);
                                                OpenFileAckTemp = OpenFileAck;                                            
                                                resolve();
                                            }
                                        );
                                    });
                                    await Utility.setEvent(this, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                                        {
                                            fileId: 0, 
                                            imageBounds: {
                                                xMin: 0, xMax: OpenFileAckTemp.fileInfoExtended.width, 
                                                yMin: 0, yMax: OpenFileAckTemp.fileInfoExtended.height,
                                            }, 
                                            mip: 64, 
                                            compressionType: CARTA.CompressionType.ZFP, 
                                            compressionQuality: 11, 
                                            numSubsets: 4,
                                        }
                                    );
                                    await Utility.setEvent(this, "SET_SPATIAL_REQUIREMENTS", CARTA.SetSpatialRequirements, 
                                        {
                                            fileId: 0, 
                                            regionId: 0, 
                                            spatialProfiles: ["x", "y"],
                                        }
                                    );
                                    let RasterImageDataTemp: CARTA.RasterImageData;  
                                    await new Promise( resolve => {
                                        Utility.getEvent(this, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                            RasterImageData => {
                                                expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                                                RasterImageDataTemp = RasterImageData;
                                                resolve();
                                            }
                                        );
                                    });                                    
                                    timer = await new Date().getTime();
                                    for ( let index = 1; index <= setCursorRepeat; index++) {
                                        await Utility.sleep(cursorWait);
                                        await Utility.setEvent(this, "SET_CURSOR", CARTA.SetCursor, 
                                            {
                                                fileId: 0, 
                                                point: {
                                                    x: Math.floor(Math.random() * RasterImageDataTemp.imageBounds.xMax), 
                                                    y: Math.floor(Math.random() * RasterImageDataTemp.imageBounds.yMax)
                                                },
                                            }
                                        );
                                        await new Promise( resolve => {
                                            Utility.getEvent(this, "SPATIAL_PROFILE_DATA", CARTA.SpatialProfileData, 
                                                SpatialProfileData => {
                                                    expect(SpatialProfileData.profiles.length).not.toEqual(0);
                                                    resolve();
                                                }
                                            );
                                        });
                                    }
                                    timeElapsed = (await new Date().getTime() - timer) / setCursorRepeat - cursorWait;
                                    await this.close();
                                }      

                                let promiseSet: Promise<any>[] = new Array(testUserNumber);
                                Connection.map( (connection, index) => {
                                    promiseSet[index] = new Promise(
                                        (resolve, reject) => {
                                            connection.onclose = () => {
                                                expect(connection.readyState).toBe(WebSocket.CLOSED);
                                                resolve();
                                            };                                
                                        }
                                    );
                                });   
                                
                                Promise.all(promiseSet).then(() => {
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
                                            thread: threadNumber * testUserNumber, 
                                            CPUusage: usage.cpu,
                                            RAM: usage.memory
                                        });
                                    
                                        await cartaBackend.kill(); 
                                    }, psWait); // Wait for ps                               
                                });
                                
                            }, execWait); // Wait for backend ready

                            cartaBackend.on("close", () => {
                                if (threadNumber === testThreadNumber[testThreadNumber.length - 1]) {
                                    console.log(`Backend testing outcome:\n${timeEpoch
                                        .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(4)}% & RAM = ${e.RAM} bytes as thread# = ${e.thread}`).join(` \n`)}`);
                                }                      
                                
                                done();
                            });

                        }, openFileTimeout);
                    }
                );
            });
        }
    );
});    
