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
                            await Utility.setEvent(this, "OPEN_FILE", CARTA.OpenFile, 
                                {
                                    directory: testDirectory, 
                                    file: imageFile, 
                                    hdu: "0", 
                                    fileId: 0, 
                                    renderMode: CARTA.RenderMode.RASTER,
                                }
                            );
                            timer = await new Date().getTime(); 
                            await new Promise( resolve => {
                                Utility.getEvent(this, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                    (OpenFileAck: CARTA.OpenFileAck) => {
                                        if (!OpenFileAck.success) {
                                            console.error(OpenFileAck.fileInfo.name + " : " + OpenFileAck.message);
                                        }
                                        expect(OpenFileAck.success).toBe(true);
                                        resolve();
                                    }
                                );
                            });
                            timeElapsed = await new Date().getTime() - timer;
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
                                cartaBackend.kill();
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
