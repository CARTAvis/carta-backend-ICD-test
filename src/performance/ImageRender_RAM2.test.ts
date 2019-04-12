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

describe(`Image render performance: change thread number per user, ${userNumber} users on 1 backend.`, () => {    

    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
    testImageFiles.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of thread, ${userNumber} users open image on 1 backend: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        test(`Should render image ${imageFiles[0].slice(14)} as thread# = ${userNumber * threadNumber}.`, 
                        async done => {                            
                            let cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, userNumber * threadNumber, backendDirectory, openFileTimeout, logMessage);

                            let Connection: WebSocket[] = new Array(userNumber);
                            for ( let index = 0; index < userNumber; index++) {
                                Connection[index] = await SocketOperation.SocketClient(serverURL, port, reconnectWait);                        
                                await SocketOperation.RegisterViewer(Connection[index]);
                            }
                            
                            let promiseSet: Promise<any>[] = [];
                            let timeElapsed: number[] = [];
                            await new Promise( async user => {
                                for ( let index = 0; index < userNumber; index++) { 
                                    await new Promise( time => setTimeout(time, eventWait));
                                    promiseSet.push( 
                                        new Promise( async action => {
                                            let OpenFileAckTemp = 
                                                await SocketOperation.OpenFile(
                                                    Connection[index], 
                                                    testDirectory, 
                                                    imageFilesGenerator.next().value,
                                                );
                                            await SocketOperation.SetImageView(
                                                Connection[index], 
                                                OpenFileAckTemp, 
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
        SocketOperation.Outcome(timeEpoch);
    });
});    
