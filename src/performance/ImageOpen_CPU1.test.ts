import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import fileName from "./file.json";

let pidusage = require("pidusage");
let serverURL = "ws://127.0.0.1";
let port = 5678;
let backendDirectory = "/Users/zarda/GitHub/carta-backend-nrao/build";
let baseDirectory = "$HOME/CARTA/Images";
let testDirectory = "set_QA_performance";    
let connectTimeout = 2000;
let openFileTimeout = 4000;
let logMessage = false;
let imageFiles = fileName.imageFiles128fits;

let imageIdx = -1;
function arrayNext (arr: any) {
    arr.next = () => { 
        if (++imageIdx >= arr.length) {
            imageIdx = 0;
        } 
        return arr[imageIdx];
    };
    arr.current = () => { return arr[imageIdx]; };
    return arr;
}
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

describe("Image open performance: 1 user on 1 backend change thread number", () => {    
 
    test(`Preparing... dry run.`, 
    done => {
        let cartaBackend = child_process.exec(
            `"./carta_backend" root=base base=${baseDirectory} port=${port} threads=16`,
            {
                cwd: backendDirectory, 
                timeout: 20000
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
        
        let Connection = new WebSocket(`${serverURL}:${port}`);
        
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
        cartaBackend.on("close", () => {
            done();
        });
        
    }, connectTimeout);

    let portAdd = 10;
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
    describe(`Change the number of thread: `, () => {
        testThreadNumber.map(
            function(threadNumber: number) {
                
                test(`open "${arrayNext(imageFiles).next()}" on backend with thread number = ${threadNumber}.`, 
                async done => {
                    let cartaBackend = child_process.exec(
                        `"./carta_backend" root=base base=${baseDirectory} port=${port + portAdd++} threads=${threadNumber}`,
                        {
                            cwd: backendDirectory, 
                            timeout: 20000
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

                    let Connection = await new WebSocket(`${serverURL}:${port}`);
                    
                    Utility.sleep(1000); // Wait for ps result

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
                                Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                                    {
                                        directory: testDirectory, 
                                        file: arrayNext(imageFiles).current(), 
                                        hdu: "0", 
                                        fileId: 0, 
                                        renderMode: CARTA.RenderMode.RASTER,
                                    }
                                );
                                // console.log(cartaBackend.pid);          
                            }
                        );

                        Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                            {
                                sessionId: "", 
                                apiKey: "1234"
                            }
                        );
                        timer = new Date().getTime();
                    };

                    Connection.onclose = async () => {
                        
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
                            time: usage.ctime, 
                            thread: threadNumber, 
                            CPUusage: usage.cpu,
                            RAM: usage.memory
                        });

                        await cartaBackend.kill();
                    };

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
    
});    
