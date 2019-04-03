import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
import fileName from "./file.json";
import config from "./config.json";

let serverURL = config.serverURL;
let port = config.port;
let backendDirectory = config.path.backend;
let baseDirectory = config.path.base;
let testDirectory = config.path.performance;    
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let reconnectWait = config.wait.reconnect;
let logMessage = config.log;

describe("Basic test: ", () => {    
    
    test(`should connect a prepared backend.`, 
    async () => {
        let cartaBackend = await child_process.exec(
            `./carta_backend root=base base=${baseDirectory} port=${port} threads=5`,
            {
                cwd: backendDirectory, 
                timeout: connectTimeout
            }
        );
        cartaBackend.on("error", error => {
            console.error(error);
        });
        cartaBackend.stdout.on("data", data => {
            if (logMessage) {
                console.log(data);
            }            
        });              
        
        let Connection = await new WebSocket(`${serverURL}:${port}`);

        await new Promise( async resolve => {
            while (Connection.readyState !== WebSocket.OPEN) {
                await Connection.close();
                Connection = await new WebSocket(`${serverURL}:${port}`);
                await new Promise( time => setTimeout(time, reconnectWait));
            }
            Connection.binaryType = "arraybuffer";
            resolve();
        });

        await Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
            {
                sessionId: "", 
                apiKey: "1234"
            }
        );
        await new Promise( resolve => { 
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                RegisterViewerAck => {
                    expect(RegisterViewerAck.success).toBe(true);
                    // console.log("done");
                    resolve();           
                }
            );
        });
        await Connection.close();
        
        await cartaBackend.kill();
    }, connectTimeout);
    
});    
