import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import fileName from "./file.json";
import config from "./config.json";
let nodeusage = require("usage");

let serverURL = config.serverURL;
let port = config.port;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let testDirectory = config.path.performance;
let openFileTimeout = config.timeout.openFile;
let reconnectWait = config.wait.reconnect;
let eventWait = config.wait.event;
let logMessage = config.log;

let testImageFiles = [
    // fileName.imageFiles2fits,
    // fileName.imageFiles4fits,
    fileName.imageFiles8fits,
    // fileName.imageFiles16fits,
    // fileName.imageFiles32fits,
    // fileName.imageFiles64fits,
    // fileName.imageFiles128fits,
];

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
   
    testImageFiles.map(
        (imageFiles: string[]) => { 
            let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of user, who opens image on 1 backend`, () => {
                testUserNumber.map(
                    (userNumber: number) => {
                        test(`${userNumber} users open image ${imageFiles[0].slice(14)}.`, 
                        async () => {
                            let cartaBackend = await child_process.execFile(
                                `./carta_backend`, [`root=base`, `base=${baseDirectory}`, `port=${port}`, `threads=${userNumber}`],
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
                            
                            let Connection: WebSocket[] = new Array(userNumber);
                            for ( let index = 0; index < userNumber; index++) {
                                Connection[index] = await new WebSocket(`${serverURL}:${port}`);
                                await new Promise( async resolve => {
                                    while (Connection[index].readyState !== WebSocket.OPEN) {
                                        await Connection[index].close();
                                        Connection[index] = await new WebSocket(`${serverURL}:${port}`);
                                        Connection[index].binaryType = "arraybuffer";
                                        await new Promise( time => setTimeout(time, reconnectWait));
                                    }
                                    resolve();
                                });
                                await Utility.setEvent(Connection[index], "REGISTER_VIEWER", CARTA.RegisterViewer, 
                                    {
                                        sessionId: "", 
                                        apiKey: "1234"
                                    }
                                );
                                await new Promise( resolve => { 
                                    Utility.getEvent(Connection[index], "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                                        RegisterViewerAck => {
                                            expect(RegisterViewerAck.success).toBe(true);
                                            resolve();           
                                        }
                                    );
                                });
                            }
                                                        
                            let promiseSet: Promise<any>[] = [];
                            let timeElapsed: number[] = [];
                            await new Promise( async resolveStep => {
                                for ( let index = 0; index < userNumber; index++) { 
                                    await new Promise( time => setTimeout(time, eventWait));
                                    promiseSet.push( 
                                        new Promise( async resolveSet => {                                      
                                            await Utility.setEvent(Connection[index], "OPEN_FILE", CARTA.OpenFile, 
                                                {
                                                    directory: testDirectory, 
                                                    file: imageFilesGenerator.next().value, 
                                                    hdu: "0", 
                                                    fileId: 0, 
                                                    renderMode: CARTA.RenderMode.RASTER,
                                                }
                                            );
                                            let timer: number = await performance.now(); 
                                            await new Promise( resolve => {
                                                Utility.getEvent(Connection[index], "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                                    (OpenFileAck: CARTA.OpenFileAck) => {
                                                        if (!OpenFileAck.success) {
                                                            console.error(OpenFileAck.fileInfo.name + " : " + OpenFileAck.message);
                                                        }
                                                        expect(OpenFileAck.success).toBe(true);                                            
                                                        resolve();
                                                    }
                                                );
                                            });
                                            timeElapsed.push(await performance.now() - timer);
                                            resolveSet();
                                        }
                                    ));
                                }
                                resolveStep();
                            });
                            await Promise.all(promiseSet);
                            
                            for ( let index = 0; index < userNumber; index++) {                                    
                                await Connection[index].close();
                            }                         
                           
                            await new Promise( resolve => {
                                nodeusage.lookup(
                                    cartaBackend.pid, 
                                    (err, result) => {                                        
                                        timeEpoch.push({
                                            time: timeElapsed.reduce((a, b) => a + b) / timeElapsed.length, 
                                            thread: userNumber, 
                                            CPUusage: result.cpu,
                                            RAM: result.memory
                                        });
                                        resolve();
                                    }
                                );
                            });
                        
                            await cartaBackend.kill();

                            await new Promise( resolve => {
                                cartaBackend.on("close", () => {
                                    if (userNumber === testUserNumber[testUserNumber.length - 1]) {
                                        console.log(`Backend testing outcome:\n${timeEpoch
                                            .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(5)}% & RAM = ${e.RAM}bytes as thread# = ${e.thread}`).join(` \n`)}`);
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
