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
let cursorWait = config.wait.cursor;
let setCursorRepeat = config.repeat.cursor;
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

describe("Spatial profile performance: 1 user on 1 backend change thread number", () => {    
    
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
    testImageFiles.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of thread: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`Set cursor ${setCursorRepeat} times to image "${imageFileNext}" on backend with thread number = ${threadNumber}.`, 
                        async done => {                            
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
                                        yMin: 0, yMax: OpenFileAckTemp.fileInfoExtended.height,
                                    }, 
                                    mip: 64, 
                                    compressionType: CARTA.CompressionType.ZFP, 
                                    compressionQuality: 11, 
                                    numSubsets: 4,
                                }
                            );
                            await Utility.setEvent(Connection, "SET_SPATIAL_REQUIREMENTS", CARTA.SetSpatialRequirements, 
                                {
                                    fileId: 0, 
                                    regionId: 0, 
                                    spatialProfiles: ["x", "y"],
                                }
                            );
                            let RasterImageDataTemp: CARTA.RasterImageData;  
                            await new Promise( resolve => {
                                Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                    RasterImageData => {
                                        expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                                        RasterImageDataTemp = RasterImageData;
                                        resolve();
                                    }
                                );
                            });

                            let timeElapsed: number[] = [];
                            for ( let index = 1; index <= setCursorRepeat; index++) {
                                await new Promise(time => setTimeout(time, cursorWait));
                                await Utility.setEvent(Connection, "SET_CURSOR", CARTA.SetCursor, 
                                    {
                                        fileId: 0, 
                                        point: {
                                            x: Math.floor(Math.random() * RasterImageDataTemp.imageBounds.xMax), 
                                            y: Math.floor(Math.random() * RasterImageDataTemp.imageBounds.yMax)
                                        },
                                    }
                                );
                                let timer = await performance.now();
                                await new Promise( resolve => {
                                    Utility.getEvent(Connection, "SPATIAL_PROFILE_DATA", CARTA.SpatialProfileData, 
                                        SpatialProfileData => {
                                            expect(SpatialProfileData.profiles.length).not.toEqual(0);
                                            resolve();
                                        }
                                    );
                                });
                                timeElapsed.push(await performance.now() - timer);
                            }

                            await Connection.close();                            

                            await new Promise( resolve => {
                                nodeusage.lookup(
                                    cartaBackend.pid, 
                                    (err, result) => {                                        
                                        timeEpoch.push({
                                            time: timeElapsed.reduce((a, b) => a + b) / timeElapsed.length,
                                            thread: threadNumber, 
                                            CPUusage: result.cpu,
                                            RAM: result.memory / 1024
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
            .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(5)}% & RAM = ${e.RAM}kB as thread# = ${e.thread}`).join(` \n`)}`);
    });
});    
