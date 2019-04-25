import * as Utility from "../UtilityFunction";
import config from "./config.json";
import fileConfig from "./testFileConfig.json";
import * as SocketOperation from "./SocketOperation";
import * as child_process from "child_process";
let nodeusage = require("usage");
let procfs = require("procfs-stats");
let fs = require("fs");

let serverURL = config.serverURL;
let port = config.port;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let testDirectory = config.path.performance;
let saveDirectory = config.path.performanceTestResultDir;
let reportFile = `${saveDirectory}/report${Date.now()}.txt`;
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

fs.appendFileSync(reportFile, 
    `ImageFile\t\t#ThreadSet\t\tTimeElapsed\t\tCPU\t\tRAM\t\tDisk\t\t#ThreadReal\n`
    );
describe("Image open performance: 1 user on 1 backend change thread number", () => {    
    
    let epoch: number[][] = [];
    testImageFiles.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of thread on file ${imageFiles[0].slice(14)}:`, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`open image "${imageFileNext}" on backend with thread number = ${threadNumber}.`, 
                        async done => {                            
                            let cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, threadNumber, backendDirectory, openFileTimeout, logMessage);

                            const psrecord = child_process.exec(
                                `psrecord ${cartaBackend.pid} --plot ${imageFileNext.split("/")[1].slice(7)}-${threadNumber.toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false})}.png`
                                , {
                                    cwd: saveDirectory
                                }
                            );

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
                                        fs.appendFileSync(reportFile, 
                                            `${imageFileNext.split("/")[1].slice(7)}\t\t` +
                                            `${threadNumber.toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false})}\t\t` +
                                            `${(timeElapsed.reduce((a, b) => a + b) / timeElapsed.length).toFixed(6)}\t\t` +
                                            `${info.cpu}\t\t` +
                                            `${info.memory}\t\t` +
                                            `${diskR}\t\t` +
                                            `${usedThreadNumber.toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false})}\t` +
                                            "\n"
                                        );
                                        resolve();
                                    }
                                );
                            });

                            await Connection.close();
                            
                            await cartaBackend.kill();

                            await psrecord.kill("SIGINT");

                            cartaBackend.on("close", () => done());

                        }, openFileTimeout);
                    }
                );
            });
        }
    );

});    
