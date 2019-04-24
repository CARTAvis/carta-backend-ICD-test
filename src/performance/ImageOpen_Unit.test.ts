import * as Utility from "../UtilityFunction";
import config from "./config.json";
import fileConfig from "./testFileConfig.json";
import * as SocketOperation from "./SocketOperation";
import * as child_process from "child_process";
let nodeusage = require("usage");
let procfs = require("procfs-stats");
let fs = require("fs");
let stream = fs.createWriteStream("report.txt");

let serverURL = config.serverURL;
let port = config.port;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let testDirectory = config.path.performance;
let openFileTimeout = config.timeout.openFile;
let reconnectWait = config.wait.reconnect;
let repeatEvent = config.repeat.event;
let logMessage = config.log;

let testThreadNumber: number[] = fileConfig.thread;
let testImageFiles =
fileConfig.fileFormat.map(
    format => {
        // return fileConfig.channelSize.map(
        //     channel => {
                return fileConfig.imageSize.map(
                    image => {
                        return fileConfig.dataSource.map(
                            name => {
                                return `cube_${name}/cube_${name}_` + 
                                `${image.toLocaleString("en-US", {minimumIntegerDigits: 5, useGrouping: false})}` +
                                `_z00001.${format}`;
                            }
                        );
                    }
                );
        //     }
        // ).reduce((acc, val) => acc.concat(val));
    }
).reduce((acc, val) => acc.concat(val));

describe("Image open performance: 1 user on 1 backend change thread number", () => {    
    
    let epoch: number[][] = [];
    testImageFiles.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            epoch.push([]);
            describe(`Change the number of thread on file ${imageFiles[0].slice(14)}:`, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`open image "${imageFileNext}" on backend with thread number = ${threadNumber}.`, 
                        async done => {                            
                            let cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, threadNumber, backendDirectory, openFileTimeout, logMessage);

                            const psrecord = child_process.exec(`psrecord ${cartaBackend.pid} --interval 0.01 --plot ${imageFileNext}-${threadNumber}.png`, {
                                cwd: config.path.performanceTestResultDir
                            });

                            let Connection = await SocketOperation.SocketClient(serverURL, port, reconnectWait);
                            
                            await SocketOperation.RegisterViewer(Connection);

                            let timeElapsed: number[] = [];
                            for (let idx = 0; idx < repeatEvent; idx++) {
                                await SocketOperation.OpenFile(
                                    Connection, 
                                    testDirectory, 
                                    imageFilesGenerator.next().value,
                                    async timer => {
                                        timeElapsed.push(await performance.now() - timer);
                                    } 
                                );
                            }
                            epoch[testImageFiles.indexOf(imageFiles)]
                                .push(timeElapsed.reduce((a, b) => a + b) / timeElapsed.length);

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
                                    (err, info) => {
                                        stream.once("open", fd => {
                                            stream.write(`${imageFileNext}\t\t`);
                                            stream.write(`${usedThreadNumber}\t\t`);
                                            stream.write(`${timeElapsed}\t\t`);
                                            stream.write(`${info.cpu}\t\t`);
                                            stream.write(`${info.memory}\t\t`);
                                            stream.write(`${diskR}\t\t`);
                                            stream.write("\n");
                                        });
                                        resolve();
                                    }
                                );
                            });

                            await Connection.close();
                            
                            await cartaBackend.kill();

                            cartaBackend.on("close", () => done());

                            await psrecord.kill('SIGINT');
                        }, openFileTimeout);
                    }
                );
            });
        }
    );

    afterAll( () => {
        console.log(epoch);
        stream.once("open", fd => {            
            stream.end();
        });
    });
});    
