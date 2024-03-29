import * as Utility from "../UtilityFunction";
import fileName from "./file.json";
import config from "./config.json";
import * as SocketOperation from "./SocketOperation";
let nodeusage = require("usage");
let procfs = require("procfs-stats");

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

describe("Image render performance:  1 user on 1 backend change image size", () => {    
     
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number, fileName: string, Disk: number}[] = [];
    imageFilesGroup.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the image size as thread = ${threadNumber}: `, () => {
                imageFiles.map(
                    (imageFile: string) => {                
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`should render "${imageFile}" on backend.`, 
                        async done => {
                            let cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, threadNumber, backendDirectory, openFileTimeout, logMessage);

                            let Connection = await SocketOperation.SocketClient(serverURL, port, reconnectWait);
                        
                            await SocketOperation.RegisterViewer(Connection);

                            let timeElapsed: number = 0;
                            let OpenFileAckTemp = 
                                await SocketOperation.OpenFile(
                                    Connection, 
                                    testDirectory, 
                                    imageFileNext,
                                );
                            await SocketOperation.SetImageView(
                                Connection, 
                                OpenFileAckTemp, 
                                async timer => {
                                    timeElapsed = await performance.now() - timer;
                                }
                            );
                            
                            await Connection.close();  
                            
                            let diskR: number = 0;
                            let usedThreadNumber: number = 0;
                            if (procfs.works) {
                                let ps = procfs(cartaBackend.pid);                          
                                await new Promise( resolve => {
                                    ps.io( (err, io) => {
                                        diskR = io.read_bytes;
                                        resolve();
                                    });
                                });
                                await new Promise( resolve => {
                                    ps.threads( (err, task) => {
                                        usedThreadNumber = task.length;
                                        resolve();
                                    });
                                });
                            }
                            await new Promise( resolve => {
                                nodeusage.lookup(
                                    cartaBackend.pid, 
                                    (err, result) => {                                        
                                        timeEpoch.push({
                                            time: timeElapsed, 
                                            thread: usedThreadNumber, 
                                            CPUusage: result.cpu,
                                            RAM: result.memory,
                                            fileName: imageFileNext,
                                            Disk: diskR,
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
        SocketOperation.OutcomeWithDiskIO(timeEpoch);
    });
});    
