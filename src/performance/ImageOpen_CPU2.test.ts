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
let openFileTimeout = 10000;
let logMessage = true;
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
let testUserNumber: number[] = [
    16,
    14,
    12,
    10,
    8,
    6,
    4,
    2,
];

describe("Image open performance: 1 thread per user on 1 backend.", () => {    
 
    test(`Preparing... dry run.`, 
    done => {
        let cartaBackend = child_process.exec(
            `"./carta_backend" root=base base=${baseDirectory} port=${port} threads=4`,
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
        testUserNumber.map(
            function(userNumber: number) {
                
                test(`open "${arrayNext(imageFiles).next()}" on backend with user number = ${userNumber}.`, 
                async done => {
                    let cartaBackend = child_process.exec(
                        `"./carta_backend" root=base base=${baseDirectory} port=${port + portAdd++} threads=${userNumber}`,
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
                    
                    let Connection: WebSocket[] = new Array(userNumber);
                    for ( let index = 0; index < userNumber; index++) {
                        Connection[index] = await new WebSocket(`${serverURL}:${port}`);
                    }         
                                
                    Utility.sleep(1000); // Wait for ps result

                    Connection.map( connection => {
                        connection.binaryType = "arraybuffer";
                        connection.onopen = () => {
                            Utility.getEvent(connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                                RegisterViewerAck => {
                                    expect(RegisterViewerAck.success).toBe(true);
                                    Utility.getEvent(connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                        OpenFileAck => {
                                            expect(OpenFileAck.success).toBe(true);
                                                                                    
                                            connection.close();
                                        }
                                    );
                                    Utility.setEvent(connection, "OPEN_FILE", CARTA.OpenFile, 
                                        {
                                            directory: testDirectory, 
                                            file: arrayNext(imageFiles).current(), 
                                            hdu: "0", 
                                            fileId: 0, 
                                            renderMode: CARTA.RenderMode.RASTER,
                                        }
                                    );         
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
                                    resolve();
                                };                                
                            }
                        );
                    });   
                    for (let idx = 0; idx < userNumber; idx++) {
                        await promiseSet[idx]; 
                    }                     
                    
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
                        thread: userNumber, 
                        CPUusage: usage.cpu,
                        RAM: usage.memory
                    });

                    await cartaBackend.kill();

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
    
});    
