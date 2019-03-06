import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import * as os from "os";

let serverURL = "ws://127.0.0.1";
let port = 5678;
let backendDirectory = "/Users/zarda/GitHub/carta-backend-nrao/build";
let baseDirectory = "$HOME/CARTA/Images";
let testDirectory = "set_QA_performance";    
let connectTimeout = 2000;
let openFileTimeout = 8000;
let logMessage = false;
let imageFiles: string[] = [
    "cube_A_03200_z00001.fits", 
    "cube_B_03200_z00001.fits", 
    "cube_C_03200_z00001.fits", 
    "cube_D_03200_z00001.fits", 
    "cube_E_03200_z00001.fits", 
    "cube_F_03200_z00001.fits",
];
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

describe("Image open performance: ", () => {    
 
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
        
        Utility.sleep(200);
        
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

    let timeEpoch: {time: number, thread: number, CPUusage: number}[] = [];
    let startMeasures: {tick: number, idle: number}[]; 
    let endMeasures: {tick: number, idle: number}[];                   
    describe(`Change the number of thread: `, () => {
        [
            // [64], [48], [32], [24], 
            [16], [12], [8], [6], [4], [2], 
        ].map(
            function([threadNumber]: [number]) {
                
                test(`open "${arrayNext(imageFiles).next()}" on backend with thread number = ${threadNumber}.`, 
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
                                        endMeasures = delta();
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
                        startMeasures = delta();
                    };

                    Connection.onclose = () => {
                        const percentageCPU = endMeasures.map((end, i) => {
                            let tickDelta = end.tick - startMeasures[i].tick;
                            return (tickDelta / (tickDelta + (end.idle - startMeasures[i].idle)) * 100);
                        });
                        // console.log(percentageCPU.map(e => e.toPrecision(5) + "%").join(` `), "\n");
                        // console.log(percentageCPU.reduce((a, b) => a + b).toPrecision(5) + "%", "\n");

                        timeEpoch.push({
                            time: timeElapsed, 
                            thread: threadNumber, 
                            CPUusage: percentageCPU.reduce((a, b) => a + b)
                        });
                                        
                        cartaBackend.kill();
                    };

                    cartaBackend.on("close", () => {
                        if (threadNumber === 2) {
                            console.log(`Testing time: \n${timeEpoch.map(e => `${e.time.toPrecision(5)} ms with CPU usage = ${e.CPUusage.toPrecision(5)}% as thread number = ${e.thread}`).join(` \n`)}`);
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
        tick: Object.keys(times)
                    .filter(time => time === "user")
                    .reduce((tick, time) => { tick += times[time]; return tick; }, 0),
        idle: times.idle,
        };
    });
}