import * as Utility from "../UtilityFunction";
import fileName from "./file.json";
import config from "./config.json";
import * as SocketOperation from "./SocketOperation";
let nodeusage = require("usage");

let serverURL = config.serverURL;
let port = config.port;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let testDirectory = config.path.performance;
let readFileTimeout = config.timeout.readFile;
let reconnectWait = config.wait.reconnect;
let logMessage = config.log;

let testUserNumber = 8;
let testImageFiles = [
    // fileName.cube100Files2fits,
    // fileName.cube100Files4fits,
    fileName.cube100Files8fits,
    // fileName.cube100Files16fits,
    // fileName.cube100Files32fits,
    // fileName.cube100Files64fits,
    // fileName.cube100Files128fits,
    // fileName.cube100Files256fits,
    // fileName.cube100Files512fits,

    // fileName.cube100Files2image,
    // fileName.cube100Files4image,
    // fileName.cube100Files8image,
    // fileName.cube100Files16image,
    // fileName.cube100Files32image,
    // fileName.cube100Files64image,
    // fileName.cube100Files128image,
    // fileName.cube100Files256image,
    // fileName.cube100Files512image,

    // fileName.cube100Files2hdf5,
    // fileName.cube100Files4hdf5,
    // fileName.cube100Files8hdf5,
    // fileName.cube100Files16hdf5,
    // fileName.cube100Files32hdf5,
    // fileName.cube100Files64hdf5,
    // fileName.cube100Files128hdf5,
    // fileName.cube100Files256hdf5,
    // fileName.cube100Files512hdf5,
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

describe("Spectral profile performance: change thread number per user, 8 users on 1 backend.", () => {    
    
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
    testImageFiles.map(
        (imageFiles: string[]) => { 
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of thread, 8 users open image on 1 backend: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        test(`${threadNumber} threads per user set cursor to image ${imageFiles[0].slice(14)}.`, 
                        async done => {
                            let cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, threadNumber * testUserNumber, backendDirectory, readFileTimeout, logMessage);

                            let Connection: WebSocket[] = new Array(testUserNumber);
                            let RasterImageDataTemp = [];
                            for ( let index = 0; index < testUserNumber; index++) {
                                Connection[index] = await SocketOperation.SocketClient(serverURL, port, reconnectWait);
                                
                                await SocketOperation.RegisterViewer(Connection[index]);
                                
                                let OpenFileAckTemp = 
                                    await SocketOperation.OpenFile(
                                        Connection[index], 
                                        testDirectory, 
                                        imageFilesGenerator.next().value,
                                    );
                                RasterImageDataTemp[index] =
                                    await SocketOperation.SetSpectralRequirements(
                                        Connection[index], 
                                        OpenFileAckTemp, 
                                    );
                            }
                                                        
                            let promiseSet: Promise<any>[] = [];
                            let timeElapsed: number[] = [];
                            await new Promise( user => {
                                for ( let index = 0; index < testUserNumber; index++) {
                                    promiseSet.push( 
                                        new Promise( async action => {                                      
                                            await SocketOperation.CursorSpectralProfileData(
                                                Connection[index], 
                                                RasterImageDataTemp[index], 
                                                async timer => {
                                                    timeElapsed.push(await performance.now() - timer);
                                                }
                                            );
                                            action();
                                        }
                                    ));
                                }
                                user();
                            });
                            await Promise.all(promiseSet);
                            
                            for ( let index = 0; index < testUserNumber; index++) {                  
                                await Connection[index].close();
                            }                          
                                                        
                            await new Promise( resolve => {
                                nodeusage.lookup(
                                    cartaBackend.pid, 
                                    (err, result) => {                                        
                                        timeEpoch.push({
                                            time: timeElapsed.reduce((a, b) => a + b) / timeElapsed.length, 
                                            thread: threadNumber * testUserNumber, 
                                            CPUusage: result.cpu,
                                            RAM: result.memory / 1024
                                        });
                                        resolve();
                                    }
                                );
                            });
                        
                            await cartaBackend.kill();

                            cartaBackend.on("close", () => done());
                            
                        }, readFileTimeout);
                    }
                );
            });
        }
    );
    
    afterAll( () => SocketOperation.Outcome(timeEpoch));
});    
