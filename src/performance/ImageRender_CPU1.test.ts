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
    
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[] = [];
    testImageFiles.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of thread: `, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`render image "${imageFileNext}" on backend with thread number = ${threadNumber}.`, 
                        async done => {
                            let cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, threadNumber, backendDirectory, readFileTimeout, logMessage);
                            
                            let Connection = await SocketOperation.SocketClient(serverURL, port, reconnectWait);
                        
                            await SocketOperation.RegisterViewer(Connection);
                            
                            let timeElapsed: number[] = [];
                            for (let idx = 0; idx < repeatEvent; idx++) {
                                let OpenFileAckTemp = 
                                    await SocketOperation.OpenFile(
                                        Connection, 
                                        testDirectory, 
                                        imageFilesGenerator.next().value,
                                    );
                                await SocketOperation.SetImageView(
                                    Connection, 
                                    OpenFileAckTemp, 
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
                                            RAM: result.memory
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
