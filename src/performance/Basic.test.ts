import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import config from "./config.json";
import * as SocketOperation from "./SocketOperation";
let nodeusage = require("usage");

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

describe(`node-usage test`, () => {
    test(`should read CPU usage`, 
    () => {
        nodeusage.lookup(
            process.pid, 
            (err, result) => {
                return () => {
                    expect(result.cpu).toBeGreaterThan(0);
                };
            }
        );
    });
    
    test(`should read RAM usage`, 
    () => {
        nodeusage.lookup(
            process.pid, 
            (err, result) => {
                return () => {
                    expect(result.memory).toBeGreaterThan(0);
                };
            }
        );
    });

});