import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import config from "./config.json";
import * as SocketOperation from "./SocketOperation";

let serverURL = config.serverURL;
let port = config.port;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let connectTimeout = config.timeout.connection;
let reconnectWait = config.wait.reconnect;
let logMessage = config.log;

describe("Basic test: ", () => {    
    
    test(`should connect a prepared backend.`, 
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
        if (procinfo.works) {
            await new Promise( resolve => {
                procinfo.io((err, io) => {
                    // console.log(io);
                    expect(parseInt(io.rchar)).toBeGreaterThan(0);
                    resolve();
                });
            });
            await new Promise( resolve => {
                procinfo.threads( (err, task) => {
                    // console.log(task);
                    expect(parseInt(task.length)).toBeGreaterThan(0);
                    resolve();
                });
            });
        }
    });
});
