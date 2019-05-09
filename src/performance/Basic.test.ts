import config from "./config.json";
import * as SocketOperation from "./SocketOperation";
import os from "os";
import { number } from "prop-types";

let serverURL = config.serverURL;
let port = config.port;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let connectTimeout = config.timeout.connection;
let reconnectWait = config.wait.reconnect;
let logMessage = config.log;

describe("Basic test: ", () => {    
    
    test.skip(`should connect a prepared backend.`, 
    async () => {

        let tested = false;

        let cartaBackend = await SocketOperation.CartaBackend(
            baseDirectory, port, 5, backendDirectory, connectTimeout, logMessage);
        
        let Connection = await SocketOperation.SocketClient(serverURL, port, reconnectWait);        

        await SocketOperation.RegisterViewer(Connection, async () => {
            // console.log("done");
            tested = true;
        });

        expect(await tested).toBe(true);

        await Connection.close();
        
        await cartaBackend.kill();
        
    }, connectTimeout);

});

let nodeusage = require("usage");
describe(`node-usage test`, () => {
    test(`should read CPU usage`, 
    done => {
        nodeusage.lookup(
            process.pid, 
            (err, info) => {
                expect(info.cpu).toBeGreaterThan(0);
                done();
            }
        );
    });
    
    test(`should read RAM usage`, 
    done => {
        nodeusage.lookup(
            process.pid, 
            (err, info) => {
                expect(info.memory).toBeGreaterThan(0);
                done();
            }
        );
    });
});

let proc = require("procfs-stats");
describe(`procfs-stats test`, () => {
    test(`should read IO usage`, 
    async () => {
        let procinfo = proc(process.pid);
        if (procinfo) {
            await new Promise( resolve => {
                procinfo.io((err, io) => {
                    // console.log(io);
                    expect(parseInt(io.rchar)).toBeGreaterThan(0);
                    resolve();
                });
            });
        }
    });
    test(`should read pids of thread`, 
    async () => {
        let procinfo = proc(process.pid);
        if (procinfo) {
            await new Promise( resolve => {
                procinfo.threads( (err, task) => {
                    // console.log(task);
                    expect(parseInt(task.length)).toBeGreaterThan(0);
                    resolve();
                });
            });
        }
    });
    test(`should get cpu usage`, 
    async () => {
        let waitTime = 100;
        if (proc) {
            let ps = proc(process.pid);
            let userTime: number = 0;
            let totalTime: number = 0;
            await new Promise( resolve => {
                ps.stat( (err, stat) => {
                    userTime = parseInt(stat.utime) + parseInt(stat.stime) + parseInt(stat.cutime) + parseInt(stat.cstime);
                    resolve();
                });
            });
            totalTime = await performance.now();
            await new Promise( end => setTimeout(end, waitTime));
            await new Promise( end => {
                let sum = 0;
                for (let index = 0; index < 100000; index++) {
                    sum += Math.pow(2, index * .0000001);
                }
                end();
            });
            totalTime = await performance.now() - totalTime;
            await new Promise( resolve => {
                ps.stat( (err, stat) => {
                    userTime = parseInt(stat.utime) + parseInt(stat.stime) + parseInt(stat.cutime) + parseInt(stat.cstime) - userTime;
                    console.log(`CPU usage = ` + (1000 * userTime / (totalTime - waitTime)).toFixed(4) + `%`);
                    expect(1000 * userTime / totalTime).toBeGreaterThan(0);
                    resolve();
                });
            });
        }
    });
});
