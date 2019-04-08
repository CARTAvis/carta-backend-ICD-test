import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import fileName from "./file.json";
import config from "./config.json";
let pidusage = require("pidusage");

let serverURL = config.serverURL;
let port = config.port;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let testDirectory = config.path.performance;
let openFileTimeout = config.timeout.openFile;
let reconnectWait = config.wait.reconnect;
let repeatEvent = config.repeat.event;
let logMessage = config.log;

let testImageFiles = [
    // fileName.imageFiles2fits,
    // fileName.imageFiles4fits,
    fileName.imageFiles8fits,
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

describe("Image render performance: 1 user on 1 backend change thread number", () => {    
    
    testImageFiles.map(
        (imageFiles: string[]) => {
            let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of thread: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`render image "${imageFileNext}" on backend with thread number = ${threadNumber}.`, 
                        async () => {                            
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
                            
                            let timeElapsed: number[] = [];
                            for (let idx = 0; idx < repeatEvent; idx++) {
                                await Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                                    {
                                        directory: testDirectory, 
                                        file: imageFilesGenerator.next().value, 
                                        hdu: "0", 
                                        fileId: 0, 
                                        renderMode: CARTA.RenderMode.RASTER,
                                    }
                                );
                                let OpenFileAckTemp: CARTA.OpenFileAck;
                                await new Promise( resolve => {
                                    Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                                        (OpenFileAck: CARTA.OpenFileAck) => {
                                            if (!OpenFileAck.success) {
                                                console.error(OpenFileAck.fileInfo.name + " : " + OpenFileAck.message);
                                            }
                                            OpenFileAckTemp = OpenFileAck;
                                            expect(OpenFileAck.success).toBe(true);                                            
                                            resolve();
                                        }
                                    );
                                });
                                await Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                                    {
                                        fileId: 0, 
                                        imageBounds: {
                                            xMin: 0, xMax: OpenFileAckTemp.fileInfoExtended.width, 
                                            yMin: 0, yMax: OpenFileAckTemp.fileInfoExtended.height
                                        }, 
                                        mip: 16, 
                                        compressionType: CARTA.CompressionType.ZFP,
                                        compressionQuality: 11, 
                                        numSubsets: 4,
                                    }
                                );
                                let timer = await performance.now();
                                await new Promise( resolve => {
                                    Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                        (RasterImageData: CARTA.RasterImageData) => {
                                            expect(RasterImageData.fileId).toEqual(0);
                                            resolve();
                                        }
                                    );                
                                });
                                timeElapsed.push(await performance.now() - timer);
                            }

                            await Connection.close();                            

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
                                time: timeElapsed.reduce((a, b) => a + b) / timeElapsed.length, 
                                thread: threadNumber, 
                                CPUusage: usage.ctime / timeElapsed.length,
                                RAM: usage.memory
                            });               
                            
                            await cartaBackend.kill();

                            await new Promise( resolve => {
                                cartaBackend.on("close", () => {
                                    if (threadNumber === testThreadNumber[testThreadNumber.length - 1]) {
                                        console.log(`Backend testing outcome:\n${timeEpoch
                                            .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toFixed(4)}ms & RAM = ${e.RAM}bytes as thread# = ${e.thread}`).join(` \n`)}`);
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
