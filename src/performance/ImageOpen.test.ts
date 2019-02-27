import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import * as os from "os";

let serverURL = "ws://127.0.0.1";
let port = 5678;
let directory = "/Users/zarda/GitHub/carta-backend-nrao/build";
let connectTimeout = 2000;
let openFileTimeout = 8000;
let logMessage = false;

describe("Image open performance: ", () => {    
 
    test(`Preparing... dry run.`, 
    done => {
        let cartaBackend = child_process.exec(
            `"./carta_backend" folder=$HOME/CARTA/Images port=${port} threads=16`,
            {
                cwd: directory, 
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
        
        Utility.sleep(200);
        
        let Connection = new WebSocket(`${serverURL}:${port}`);
        
        Connection.binaryType = "arraybuffer";
        Connection.onopen = () => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                async RegisterViewerAck => {
                    expect(RegisterViewerAck.success).toBe(true);
                    let cpuUsage0 = os.cpus()[0].times.user / os.cpus()[0].times  
                    
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

    let testDirectory = "set_QA_performance";
    let testFile = "cube_A_03200_z00001.fits";
    let timeEpoch: {time: number, thread: number, CPUusage: number}[] = [];
    let startMeasures = delta();
    describe(`Change the number of thread: `, () => {
        [
            // [64], [48], [32], [24], 
            [16], [12], [8], [6], [4], [2], 
        ].map(
            function([threadNumber]: [number]) {
                
                test(`open "${testFile}" on backend with thread number = ${threadNumber}.`, 
                async done => {
                    let cartaBackend = child_process.exec(
                        `"./carta_backend" folder=$HOME/CARTA/Images port=${port} threads=${threadNumber}`,
                        {
                            cwd: directory, 
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
                    
                    Utility.sleep(500);

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
                                        file: testFile, 
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

                    Connection.onclose = () => {
                        const endMeasures = delta();
                        const percentageCPU = endMeasures.map((end, i) => {
                            return ((end.tick - startMeasures[i].tick) / (end.idle - startMeasures[i].idle) * 100);
                        });
                        // console.log(percentageCPU.map(e => e + "%").join(` `), "\n");
                        // console.log(percentageCPU.map(e => parseFloat(e)).reduce((a, b) => a + b) + "%", "\n");

                        timeEpoch.push({
                            time: timeElapsed, 
                            thread: threadNumber, 
                            CPUusage: percentageCPU.reduce((a, b) => a + b)
                        });
                                        
                        cartaBackend.kill();
                    };

                    cartaBackend.on("close", () => {
                        if (threadNumber === 2) {
                            console.log(`Testing time: \n${timeEpoch.map(e => `\t${e.time} ms with CPU usage = \t${e.CPUusage.toFixed(5.2)}% as thread number = \t${e.thread}`).join(` \n`)}`);
                        }
                        

                        done();
                    });
                    
                }, openFileTimeout);
            }
        );
    });
    
});    

function delta() {
    const cpus = os.cpus();

    return cpus.map(cpu => {
        const times = cpu.times;
        return {
        tick: Object.keys(times).filter(time => time !== 'idle').reduce((tick, time) => { tick+=times[time]; return tick }, 0),
        idle: times.idle,
        };
    });
}

// let startMeasures = delta();
// setInterval(() => {
//   const endMeasures = delta();
//   const percentageCPU = endMeasures.map((end, i) => {
//     return ((end.tick - startMeasures[i].tick) / (end.idle - startMeasures[i].idle) * 100).toFixed(3) + "%";
//   });

//   console.log(percentageCPU.join(` `), "\n");

//   // reset
//   startMeasures = delta();
// }, 2000);