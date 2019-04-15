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
let cursorWait = config.wait.cursor;
let setCursorRepeat = config.repeat.cursor;
let logMessage = config.log;

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

describe("Spectral profile performance: 1 user on 1 backend change thread number", () => {    
    
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
                            let cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, threadNumber, backendDirectory, readFileTimeout, logMessage);
                            
                            let Connection = await SocketOperation.SocketClient(serverURL, port, reconnectWait);
                        
                            await SocketOperation.RegisterViewer(Connection);
                            
                            let OpenFileAckTemp = 
                                await SocketOperation.OpenFile(
                                    Connection, 
                                    testDirectory, 
                                    imageFileNext,
                                );
                            let RasterImageDataTemp =
                                await SocketOperation.SetSpectralRequirements(
                                    Connection, 
                                    OpenFileAckTemp, 
                                );

                            let timeElapsed: number[] = [];
                            for ( let index = 1; index <= setCursorRepeat; index++) {
                                await new Promise(time => setTimeout(time, cursorWait));
                                await SocketOperation.CursorSpectralProfileData(
                                    Connection, 
                                    RasterImageDataTemp, 
                                    async timer => {
                                        timeElapsed.push(await performance.now() - timer);
                                    }
                                );
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
                            
                        }, readFileTimeout);
                    }
                );
            });
        }
    );

    afterAll( () => SocketOperation.Outcome(timeEpoch));
});    
