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

describe("Image render performance: 1 thread per user on 1 backend.", () => {    
   
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
    testImageFiles.map(
        (imageFiles: string[]) => { 
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of user`, () => {
                testUserNumber.map(
                    (userNumber: number) => {
                        test(`${userNumber} users render image ${imageFiles[0].slice(14)}.`, 
                        async done => {
                            let cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, userNumber, backendDirectory, readFileTimeout, logMessage);
                            
                            let Connection: WebSocket[] = new Array(userNumber);
                            for ( let index = 0; index < userNumber; index++) {
                                Connection[index] = await SocketOperation.SocketClient(serverURL, port, reconnectWait);                        
                                await SocketOperation.RegisterViewer(Connection[index]);
                            }
                                                        
                            let promiseSet: Promise<any>[] = [];
                            let timeElapsed: number[] = [];
                            await new Promise( async resolveStep => {
                                for ( let index = 0; index < userNumber; index++) { 
                                    await new Promise( time => setTimeout(time, eventWait));
                                    promiseSet.push( 
                                        new Promise( async resolveSet => {
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
    
    afterAll( () => {
        SocketOperation.Outcome(timeEpoch);
    });
});    
