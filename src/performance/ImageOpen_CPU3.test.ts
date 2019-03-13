import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import fileName from "./file.json";

let pidusage = require("pidusage");
let serverURL = "ws://127.0.0.1";
let port = 5555;
let backendDirectory = "/Users/zarda/GitHub/carta-backend-nrao/build";
let baseDirectory = "$HOME/CARTA/Images";
let testDirectory = "set_QA_performance";    
let connectTimeout = 3000;
let openFileTimeout = 10000;
let logMessage = false;
let testUserNumber = 8;
let testImageFiles = [
    fileName.imageFiles2fits,
    fileName.imageFiles4fits,
    fileName.imageFiles8fits,
    // fileName.imageFiles16fits,
    // fileName.imageFiles32fits,
    // fileName.imageFiles64fits,
    // fileName.imageFiles128fits,
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
let testThreadNumber: number[] = [    
    // 8,
    // 7,
    6,
    5,
    4,
    3,
    2,
    1,
];

describe("Image open performance: change thread number per user, 8 users on 1 backend.", () => {    
    testImageFiles.map(
        (imageFiles: string[]) => { 
            test(`Preparing... dry run.`, 
            done => {
                let cartaBackend = child_process.exec(
                    `"./carta_backend" root=base base=${baseDirectory} port=1234 threads=4`,
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

                setTimeout( () => {

                    let Connection = new WebSocket(`${serverURL}:1234`);
                    expect(Connection.readyState).toBe(WebSocket.CONNECTING);
                    
                    Connection.binaryType = "arraybuffer";
                    Connection.onopen = () => {
                        expect(Connection.readyState).toBe(WebSocket.OPEN);
                        Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                            RegisterViewerAck => {                            
                                expect(RegisterViewerAck.success).toBe(true);
                                // console.log("test done");
                                
                                Connection.close();
                                expect(Connection.readyState).toBe(WebSocket.CLOSING);
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
                        expect(Connection.readyState).toBe(WebSocket.CLOSED);
                        cartaBackend.kill();
                    };  
                        
                }, 100);

                cartaBackend.on("close", () => {
                    done();
                });
                
            }, connectTimeout);

            let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
            describe(`Change the number of thread, 8 users open image on 1 backend: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        
                        test(`${threadNumber} threads per user.`, 
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
                                console.log(`error: \n ${error}`);
                            });
                            cartaBackend.stdout.on("data", data => {
                                if (logMessage) {
                                    console.log(data);
                                }
                            });
                            setTimeout(() => {
                                let Connection: WebSocket[] = new Array(testUserNumber);
                                for ( let index = 0; index < testUserNumber; index++) {
                                    Connection[index] = new WebSocket(`${serverURL}:${port}`);
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
                                                            console.log(arrayNext(imageFiles).current() + " : " + OpenFileAck.message);
                                                        }
                                                        expect(OpenFileAck.success).toBe(true);
                                                                                                
                                                        connection.close();
                                                        expect(connection.readyState).toBe(WebSocket.CLOSING);
                                                    }
                                                );
                                                Utility.setEvent(connection, "OPEN_FILE", CARTA.OpenFile, 
                                                    {
                                                        directory: testDirectory, 
                                                        file: arrayNext(imageFiles).next(), 
                                                        hdu: "0", 
                                                        fileId: 0, 
                                                        renderMode: CARTA.RenderMode.RASTER,
                                                    }
                                                );         
                                            }
                                        );
                                        Utility.sleep(20);                                        
                                        Utility.setEvent(connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                                            {
                                                sessionId: "", 
                                                apiKey: "1234"
                                            }
                                        );
                                    };
                                });

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
                                            time: usage.ctime, 
                                            thread: threadNumber * testUserNumber, 
                                            CPUusage: usage.cpu,
                                            RAM: usage.memory
                                        });
                                    
                                        await cartaBackend.kill(); 
                                    }, 500); // Wait for ps                               
                                });
                                
                            }, 500); // Wait for backend ready

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
