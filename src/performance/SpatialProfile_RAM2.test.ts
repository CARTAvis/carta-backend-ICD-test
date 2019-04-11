
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

let userNumber = 8;
let testImageFiles = [
    // fileName.imageFiles2fits,
    // fileName.imageFiles4fits,
    fileName.imageFiles8fits,
    // fileName.imageFiles16fits,
    // fileName.imageFiles32fits,
    // fileName.imageFiles64fits,
    // fileName.imageFiles128fits,
    // fileName.imageFiles256fits,
    // fileName.imageFiles512fits,

    // fileName.imageFiles2image,
    // fileName.imageFiles4image,
    // fileName.imageFiles8image,
    // fileName.imageFiles16image,
    // fileName.imageFiles32image,
    // fileName.imageFiles64image,
    // fileName.imageFiles128image,
    // fileName.imageFiles256image,
    // fileName.imageFiles512image,

    // fileName.imageFiles2hdf5,
    // fileName.imageFiles4hdf5,
    // fileName.imageFiles8hdf5,
    // fileName.imageFiles16hdf5,
    // fileName.imageFiles32hdf5,
    // fileName.imageFiles64hdf5,
    // fileName.imageFiles128hdf5,
    // fileName.imageFiles256hdf5,
    // fileName.imageFiles512hdf5,
];

let testThreadNumber: number[] = [    
    8,
    7,
    6,
    5,
    4,
    3,
    2,
    1,
];

describe(`Spatial profile performance: change thread number per user, ${userNumber} users on 1 backend.`, () => {    

    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
    testImageFiles.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of thread, ${userNumber} users open image on 1 backend: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        test(`Should set cursor to image ${imageFiles[0].slice(14)} as thread# = ${userNumber * threadNumber}.`, 
                        async done => {
                            let cartaBackend = child_process.execFile(
                                `./carta_backend`, [`root=base`, `base=${baseDirectory}`, `port=${port}`, `threads=${userNumber * threadNumber}`],
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
                            let RasterImageDataTemp: CARTA.RasterImageData[] = [];
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
                                await Utility.setEvent(Connection[index], "OPEN_FILE", CARTA.OpenFile, 
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
                                    Utility.getEvent(Connection[index], "OPEN_FILE_ACK", CARTA.OpenFileAck, 
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
                                await Utility.setEvent(Connection[index], "SET_IMAGE_VIEW", CARTA.SetImageView, 
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
                                await Utility.setEvent(Connection[index], "SET_SPATIAL_REQUIREMENTS", CARTA.SetSpatialRequirements, 
                                    {
                                        fileId: 0, 
                                        regionId: 0, 
                                        spatialProfiles: ["x", "y"],
                                    }
                                );  
                                await new Promise( resolve => {
                                    Utility.getEvent(Connection[index], "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                        RasterImageData => {
                                            expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                                            RasterImageDataTemp[index] = RasterImageData;
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
                                            await Utility.setEvent(Connection[index], "SET_CURSOR", CARTA.SetCursor, 
                                                {
                                                    fileId: 0, 
                                                    point: {
                                                        x: Math.floor(Math.random() * RasterImageDataTemp[index].imageBounds.xMax), 
                                                        y: Math.floor(Math.random() * RasterImageDataTemp[index].imageBounds.yMax)
                                                    },
                                                }
                                            );
                                            let timer = await performance.now();
                                            await new Promise( resolve => {
                                                Utility.getEvent(Connection[index], "SPATIAL_PROFILE_DATA", CARTA.SpatialProfileData, 
                                                    SpatialProfileData => {
                                                        expect(SpatialProfileData.profiles.length).not.toEqual(0);
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
                                            time: timeElapsed.reduce((a, b) => a + b),
                                            thread: threadNumber * userNumber, 
                                            CPUusage: result.cpu,
                                            RAM: result.memory / 1024,
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
