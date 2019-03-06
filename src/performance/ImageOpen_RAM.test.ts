import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";

let pidusage = require("pidusage");
let serverURL = "ws://127.0.0.1";
let port = 5678;
let threadNumber = 16;
let backendDirectory = "/Users/zarda/GitHub/carta-backend-nrao/build";
let baseDirectory = "$HOME/CARTA/Images";
let testDirectory = "set_QA_performance/cube_A";    
let connectTimeout = 2000;
let openFileTimeout = 15000;
let logMessage = false;
let imageFiles: string[] = [
    // "cube_A_51200_z00001.fits", 
    // "cube_A_25600_z00001.fits", 
    "cube_A_12800_z00001.fits", 
    "cube_A_06400_z00001.fits", 
    "cube_A_03200_z00001.fits", 
    "cube_A_01600_z00001.fits", 
    "cube_A_00800_z00001.fits", 
    "cube_A_00400_z00001.fits", 
    "cube_A_00200_z00001.fits",
];

describe("Image open performance: ", () => {    
 
    test(`Preparing... dry run.`, 
    done => {
        let cartaBackend = child_process.exec(
            `"./carta_backend" root=base base=${baseDirectory} port=${port} threads=${threadNumber}`,
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
        
        Utility.sleep(500);
        
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

    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
    describe(`Change the number of thread: `, () => {
        imageFiles.map(
            function(imageFile: string) {
                
                test(`open "${imageFile}" on backend.`, 
                async done => {
                    let cartaBackend = child_process.exec(
                        `"./carta_backend" root=base base=${baseDirectory} port=${port} threads=${threadNumber}`,
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
                    
                    Utility.sleep(1000);

                    let timer: number = 0;        
                    let timeElapsed: number = 0;

                    let Connection = await new WebSocket(`${serverURL}:${port}`);
                    
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
                                        file: imageFile, 
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
                        if (imageFile === imageFiles[imageFiles.length - 1]) {
                            console.log(`Backend testing outcome:\n${timeEpoch
                                .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(4)}% & RAM = ${e.RAM} bytes as file: ${imageFile}`).join(` \n`)}`);
                        }                      

                        done();
                    });
                    
                }, openFileTimeout);
            }
        );
    });
    
});    
