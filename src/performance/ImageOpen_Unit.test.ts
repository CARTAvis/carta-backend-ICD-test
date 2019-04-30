import * as Utility from "../UtilityFunction";
import config from "./config.json";
import fileConfig from "./testFileConfig.json";
import * as SocketOperation from "./SocketOperation";
let procfs = require("procfs-stats");

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

describe("Image open performance: 1 user on 1 backend change thread number", () => {    
    SocketOperation.WriteLebelTo(reportFile);
    testImageFiles.map(
        (imageFiles: string[]) => {
            let imageFilesGenerator = Utility.arrayGeneratorLoop(imageFiles);
            describe(`Change the number of thread on file ${imageFiles[0].slice(14)}:`, () => {
                testThreadNumber.map(
                    (threadNumber: number) => {
                        let imageFileNext = imageFilesGenerator.next().value;
                        test(`open image "${imageFileNext}" on backend with thread number = ${threadNumber}.`, 
                        async done => {                            
                            const cartaBackend = await SocketOperation.CartaBackend(
                                baseDirectory, port, threadNumber, backendDirectory, openFileTimeout, logMessage);

                            const psrecord = await SocketOperation.Psrecord(
                                cartaBackend.pid, saveDirectory, imageFileNext, threadNumber, openFileTimeout);
                            
                            let Connection = await SocketOperation.SocketClient(serverURL, port, reconnectWait);
                            
                            await SocketOperation.RegisterViewer(Connection);

                            let cpuCount: {user: number, total: number} = {user: 0, total: 0};
                            if (procfs.works) {
                                let ps = procfs(cartaBackend.pid);                          
                                await new Promise( resolve => {
                                    ps.stat( (err, stat) => {
                                        cpuCount.user = stat.utime;
                                        cpuCount.total = stat.utime + stat.stime + stat.cutime + stat.cstime + stat.utime;
                                        resolve();
                                    });
                                });
                            }
                            let timeElapsed: number[] = [];
                            for (let idx = 0; idx < repeatEvent; idx++) {
                                await SocketOperation.OpenFile(
                                    Connection, 
                                    testDirectory, 
                                    imageFilesGenerator.next().value,
                                    async timer => {
                                        timeElapsed.push(await performance.now() - timer);
                                        if (procfs.works) {
                                            let ps = procfs(cartaBackend.pid);                          
                                            await new Promise( resolve => {
                                                ps.stat( (err, stat) => {
                                                    cpuCount.user = stat.utime - cpuCount.user;
                                                    cpuCount.total = stat.utime + stat.stime + stat.cutime + stat.cstime + stat.utime - cpuCount.total;
                                                    resolve();
                                                });
                                            });
                                        }
                                    } 
                                );
                            }

                            await SocketOperation.WriteReportTo(
                                reportFile, cartaBackend.pid, imageFileNext, threadNumber, timeElapsed, cpuCount);                            

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
