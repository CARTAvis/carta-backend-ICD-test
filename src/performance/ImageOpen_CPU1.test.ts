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
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let psWait = config.wait.ps;
let reconnectWait = config.wait.reconnect;
let logMessage = config.log;
let state = {index: -1};

let testImageFiles = [
    fileName.imageFiles2fits,
    // fileName.imageFiles4fits,
    // fileName.imageFiles8fits,
    // fileName.imageFiles16fits,
    // fileName.imageFiles32fits,
    // fileName.imageFiles64fits,
    // fileName.imageFiles128fits,

    // fileName.imageFiles4image,
];
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
    async () => {
        let cartaBackend = await child_process.exec(
            `./carta_backend root=base base=${baseDirectory} port=5678 threads=5`,
            {
                cwd: backendDirectory, 
                timeout: connectTimeout
            }
        );
        cartaBackend.on("error", error => {
            console.error(error);
        });
        cartaBackend.stdout.on("data", data => {
            if (logMessage) {
                console.log(data);
            }            
        });              
        
        let Connection = await new WebSocket(`${serverURL}:5678`);

        await new Promise( async resolve => {
            while (Connection.readyState !== WebSocket.OPEN) {
                await Connection.close();
                Connection = await new WebSocket(`${serverURL}:5678`);
                await new Promise( time => setTimeout(time, reconnectWait));
            }
            Connection.binaryType = "arraybuffer";
            resolve();
        });

        await Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
            {
                sessionId: "", 
                apiKey: "1234"
            }
        );
        await new Promise( resolve => { 
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                RegisterViewerAck => {
                    expect(RegisterViewerAck.success).toBe(true);
                    // console.log("done");
                    resolve();           
                }
            );
        });
        await Connection.close();
        
        await cartaBackend.kill();
    }, connectTimeout);

    testImageFiles.map(
        (imageFiles: string[]) => {
            let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];

            describe(`Change the number of thread: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        test(`open image "${Utility.arrayNext(imageFiles, state).next()}" on backend with thread number = ${threadNumber}.`, 
                        async () => {
                            
                            // port += 10;
                            let cartaBackend = await child_process.execFile(
                                `./carta_backend`, [`root=base`, `base=${baseDirectory}`, `port=${port}`, `threads=${threadNumber}`],
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
                            
                            let Connection = await new WebSocket(`${serverURL}:${port}`);
                            await new Promise( async resolve => {
                                while (Connection.readyState !== WebSocket.OPEN) {
                                    await Connection.close();
                                    Connection = await new WebSocket(`${serverURL}:${port}`);
                                    await new Promise( time => setTimeout(time, reconnectWait));
                                }
                                Connection.binaryType = "arraybuffer";
                                resolve();
                            });
                             
                            await Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                                {
                                    sessionId: "", 
                                    apiKey: "1234"
                                }
                            );
                            await new Promise( resolve => { 
                                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                                    RegisterViewerAck => {
                                        expect(RegisterViewerAck.success).toBe(true);
                                        resolve();           
                                    }
                                );
                            });
                            await Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                                {
                                    directory: testDirectory, 
                                    file: Utility.arrayNext(imageFiles, state).current(), 
                                    hdu: "0", 
                                    fileId: 0, 
                                    renderMode: CARTA.RenderMode.RASTER,
                                }
                            );
                            let timer = await performance.now(); 
                            await new Promise( resolve => {
                                Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                    (OpenFileAck: CARTA.OpenFileAck) => {
                                        if (!OpenFileAck.success) {
                                            console.error(OpenFileAck.fileInfo.name + " : " + OpenFileAck.message);
                                        }
                                        expect(OpenFileAck.success).toBe(true);                                            
                                        resolve();
                                    }
                                );
                            });
                            let timeElapsed = await performance.now() - timer;

                            await Connection.close();
                            
                            await new Promise( resolve => 
                                setTimeout(resolve, psWait)
                            );

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
                                RAM: usage.memory
                            });               
                            
                            await cartaBackend.kill();

                            await new Promise( resolve => {
                                cartaBackend.on("close", () => {
                                    if (threadNumber === testThreadNumber[testThreadNumber.length - 1]) {
                                        console.log(`Backend testing outcome:\n${timeEpoch
                                            .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(4)}% & RAM = ${e.RAM} bytes as thread# = ${e.thread}`).join(` \n`)}`);
                                    }                                 
                                    resolve();
                                });
                            });
                            
                        }, openFileTimeout);
                    }
                );
            });
        }
    );
});    
