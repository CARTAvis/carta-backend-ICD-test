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
    // fileName.imageFilesDfits,

    // fileName.imageFilesAimage,
    // fileName.imageFilesBimage,
    // fileName.imageFilesCimage,
    // fileName.imageFilesDimage,

    // fileName.imageFilesAhdf5,
    // fileName.imageFilesBhdf5,
    // fileName.imageFilesChdf5,
    // fileName.imageFilesDhdf5,
];

describe("Image open performance:  1 user on 1 backend change image size", () => {    
     
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number, fileName: string, Disk: number}[] = [];
    imageFilesGroup.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the image size as thread = ${threadNumber}: `, () => {
                imageFiles.map(
                    (imageFile: string) => {                
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`should open "${imageFile}" on backend.`, 
                        async done => {
                            let cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, threadNumber, backendDirectory, openFileTimeout, logMessage);

                            let Connection = await SocketOperation.SocketClient(serverURL, port, reconnectWait);
                        
                            await SocketOperation.RegisterViewer(Connection);

                            let timeElapsed: number = 0;
                            await SocketOperation.OpenFile(
                                Connection, 
                                testDirectory, 
                                imageFileNext,
                                async timer => {
                                    timeElapsed = await performance.now() - timer;
                                } 
                            );
                            
                            await Connection.close();  
                                                      
                            let diskR: number;
                            await new Promise( resolve => {
                                procfs(cartaBackend.pid).io( (err, io) => {
                                    diskR = io.read_bytes;
                                    resolve();
                                });
                            });
                            await new Promise( resolve => {
                                nodeusage.lookup(
                                    cartaBackend.pid, 
                                    (err, result) => {                                        
                                        timeEpoch.push({
                                            time: timeElapsed, 
                                            thread: threadNumber, 
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
