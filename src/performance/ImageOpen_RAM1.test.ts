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
let openFileTimeout = config.timeout.openFile;
let execWait = config.wait.exec;
let psWait = config.wait.ps;
let eventWait = config.wait.event;
let logMessage = config.log;

let threadNumber = 16;
let imageFiles = fileName.imageFilesAfits;

describe("Image open performance:  1 user on 1 backend change image size", () => {    
     
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number, fileName: string}[] = [];
    describe(`Change the image size as thread = ${threadNumber}: `, () => {
        imageFiles.map(
            (imageFile: string) => {
                
                test(`open "${imageFile}" on backend.`, 
                done => {
                    port ++;
                    let cartaBackend = child_process.exec(
                        `"./carta_backend" root=base base=${baseDirectory} port=${port} threads=${threadNumber}`,
                        {
                            cwd: backendDirectory, 
                            timeout: openFileTimeout
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

                    setTimeout( () => {
                        let Connection = new WebSocket(`${serverURL}:${port}`);

                        Connection.binaryType = "arraybuffer";
                        Connection.onopen = () => {
                            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                                RegisterViewerAck => {
                                    expect(RegisterViewerAck.success).toBe(true);
                                    Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                        OpenFileAck => {
                                            expect(OpenFileAck.success).toBe(true);
                                            timeElapsed = new Date().getTime() - timer;
                                            // console.log(`As thread number = ${threadNumber}. Elasped time = ${timeElapsed}ms`);
                                                                                    
                                            Connection.close();
                                        }
                                    );
                                    Utility.sleep(eventWait);
                                    Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                                        {
                                            directory: testDirectory, 
                                            file: imageFile, 
                                            hdu: "0", 
                                            fileId: 0, 
                                            renderMode: CARTA.RenderMode.RASTER,
                                        }
                                    );
                                    timer = new Date().getTime();      
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
                    
                }, openFileTimeout);
            }
        );
    });
    
});    
