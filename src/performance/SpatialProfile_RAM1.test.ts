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
describe("Spatial profile performance:  1 user on 1 backend change image size", () => {    
     
    let timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number, fileName: string}[] = [];
    imageFilesGroup.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the image size as thread = ${threadNumber}: `, () => {
                imageFiles.map(
                    (imageFile: string) => {                
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`should set cursor ${setCursorRepeat} times to "${imageFile}" on backend.`, 
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
                                await SocketOperation.SetSpatialRequirements(
                                    Connection, 
                                    OpenFileAckTemp, 
                                );
                            
                            let timeElapsed: number[] = [];
                            for ( let index = 1; index <= setCursorRepeat; index++) {
                                await new Promise(time => setTimeout(time, cursorWait));
                                await SocketOperation.CursorSpatialProfileData(
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
                                            RAM: result.memory / 1024,
                                            fileName: imageFileNext
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
    
    afterAll( () => SocketOperation.OutcomeWithFile(timeEpoch));
});    
