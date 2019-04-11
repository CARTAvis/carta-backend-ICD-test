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
let logMessage = config.log;

let threadNumber = 16;
let imageFilesGroup = [
    fileName.imageFilesAfits,
    // fileName.imageFilesBfits,
    // fileName.imageFilesCfits,

    // fileName.imageFilesAimage,
    // fileName.imageFilesBimage,
    // fileName.imageFilesCimage,

    // fileName.imageFilesAhdf5,
    // fileName.imageFilesBhdf5,
    // fileName.imageFilesChdf5,
];

describe("Image open performance:  1 user on 1 backend change image size", () => {    
     
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number, fileName: string}[] = [];
    imageFilesGroup.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the image size as thread = ${threadNumber}: `, () => {
                imageFiles.map(
                    (imageFile: string) => {                
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`should open "${imageFile}" on backend.`, 
                        async done => {
                            let cartaBackend = child_process.execFile(
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
                                    file: imageFileNext, 
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

                            await new Promise( resolve => {
                                nodeusage.lookup(
                                    cartaBackend.pid, 
                                    (err, result) => {                                        
                                        timeEpoch.push({
                                            time: timeElapsed, 
                                            thread: threadNumber, 
                                            CPUusage: result.cpu,
                                            RAM: result.memory / 1024,
                                            fileName: imageFileNext
                                        });
                                        resolve();
                                    }
                                );
                            });            
                            
                            await cartaBackend.kill();
                            
                            cartaBackend.on("close", () => done());

                        }, openFileTimeout);
                    }
                );
            });
        }
    );
    
    afterAll( () => {
        console.log(`Backend testing outcome:\n${timeEpoch
            .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(5)}% & RAM = ${e.RAM}kB as file: ${e.fileName}`).join(` \n`)}`);
    });
});    
