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
let readFileTimeout = config.timeout.readFile;
let execWait = config.wait.exec;
let psWait = config.wait.ps;
let cursorWait = config.wait.cursor;
let eventWait = config.wait.event;
let setCursorRepeat = config.repeat.cursor;
let logMessage = config.log;

let threadNumber = 16;
let imageFiles = fileName.imageFilesAfits;

describe("Spatial profile performance:  1 user on 1 backend change image size", () => {    
     
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number, fileName: string}[] = [];
    describe(`Change the image size as thread = ${threadNumber}: `, () => {
        imageFiles.map(
            (imageFile: string) => {
                
                test(`set cursor randomly ${setCursorRepeat} times on "${imageFile}".`, 
                done => {
                    port ++;
                    let cartaBackend = child_process.exec(
                        `"./carta_backend" root=base base=${baseDirectory} port=${port} threads=${threadNumber}`,
                        {
                            cwd: backendDirectory, 
                            timeout: readFileTimeout
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

                    setTimeout( () => {
                        let Connection = new WebSocket(`${serverURL}:${port}`);
                        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
                        Connection.binaryType = "arraybuffer";                                
                        Connection.onopen = OnOpen;
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
                                    file: imageFile, 
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
                        
                        Connection.onclose = () => {
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
                                    RAM: usage.memory,
                                    fileName: imageFile,
                                });

                                await cartaBackend.kill();
                            }, psWait);
                        };
                        
                    }, execWait);

                    cartaBackend.on("close", () => {
                        if (imageFile === imageFiles[imageFiles.length - 1]) {
                            console.log(`Backend testing outcome:\n${timeEpoch
                                .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(4)}% & RAM = ${e.RAM} bytes as file: ${e.fileName}`).join(` \n`)}`);
                        }                      
                        
                        done();
                    });
                    
                }, readFileTimeout);
            }
        );
    });
    
});    
