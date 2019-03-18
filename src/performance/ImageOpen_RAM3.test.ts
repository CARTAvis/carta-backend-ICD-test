
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
let openFileTimeout = config.timeout.openFile;
let execWait = config.wait.exec;
let psWait = config.wait.ps;
let eventWait = config.wait.event;
let logMessage = config.log;
let state = {index: -1};

let testImageFiles = [
    // fileName.imageFiles2fits,
    // fileName.imageFiles4fits,
    // fileName.imageFiles8fits,
    // fileName.imageFiles16fits,
    fileName.imageFiles32fits,
    // fileName.imageFiles64fits,
    // fileName.imageFiles128fits,
    // fileName.imageFiles256fits,
    // fileName.imageFiles512fits,
];

let testUserNumber: number[] = [    
    24,
    22,
    20,
    18,
    16,
    14,
    12,
    10,
    8,
    6,
    4,
];

describe(`Image open performance: change users number, 1 thread per user on 1 backend.`, () => {    

    testImageFiles.map(
        (imageFiles: string[]) => {
            let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
            describe(`Change the number of user, users open image on 1 backend: `, () => {
                testUserNumber.map(
                    (userNumber: number) => {

                        test(`Open image by ${userNumber} users.`, 
                        done => {
                            port ++;
                            let cartaBackend = child_process.exec(
                                `"./carta_backend" root=base base=${baseDirectory} port=${port} threads=${userNumber}`,
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
        
                            setTimeout(() => {
                                let Connection: WebSocket[] = [];
                                for ( let index = 0; index < userNumber; index++) {
                                    Connection.push(new WebSocket(`${serverURL}:${port}`));
                                    expect(Connection[index].readyState).toBe(WebSocket.CONNECTING);
                                }
                                
                                Connection.map( connection => {
                                    connection.binaryType = "arraybuffer";
                                    connection.onopen = () => {
                                        expect(connection.readyState).toBe(WebSocket.OPEN);
                                        Utility.getEvent(connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                                            RegisterViewerAck => {
                                                expect(RegisterViewerAck.success).toBe(true);
                                                Utility.getEvent(connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                                    OpenFileAck => {
                                                        if (!OpenFileAck.success) {
                                                            console.error(Utility.arrayNext(imageFiles, state).current() + " : " + OpenFileAck.message);
                                                        }
                                                        expect(OpenFileAck.success).toBe(true);
                                                        timeElapsed += new Date().getTime() - timer;
                                                                                                
                                                        connection.close();
                                                        expect(connection.readyState).toBe(WebSocket.CLOSING);
                                                    }
                                                );
                                                Utility.sleep(eventWait);
                                                Utility.setEvent(connection, "OPEN_FILE", CARTA.OpenFile, 
                                                    {
                                                        directory: testDirectory, 
                                                        file: Utility.arrayNext(imageFiles, state).next(), 
                                                        hdu: "0", 
                                                        fileId: 0, 
                                                        renderMode: CARTA.RenderMode.RASTER,
                                                    }
                                                );  
                                                timer = new Date().getTime();        
                                            }
                                        );
                                        Utility.setEvent(connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                                            {
                                                sessionId: "", 
                                                apiKey: "1234"
                                            }
                                        );
                                    };
                                });

                                let promiseSet: Promise<any>[] = new Array(userNumber);
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
                                            thread: userNumber, 
                                            CPUusage: usage.cpu,
                                            RAM: usage.memory
                                        });
                                    
                                        await cartaBackend.kill(); 
                                    }, psWait); // Wait for ps                               
                                });
                                
                            }, execWait); // Wait for backend ready

                            cartaBackend.on("close", () => {
                                if (userNumber === testUserNumber[testUserNumber.length - 1]) {
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
