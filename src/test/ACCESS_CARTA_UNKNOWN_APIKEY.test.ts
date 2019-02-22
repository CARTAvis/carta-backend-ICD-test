/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testEventName = "REGISTER_VIEWER";
let testReturnName = "REGISTER_VIEWER_ACK";

describe("ACCESS_CARTA_UNKNOWN_APIKEY tests", () => {
    
    describe(`send EventName: "${testEventName}" to CARTA "${testServerUrl}" with session_id "" & api_key "5678".`, 
    () => {
        let Connection: WebSocket;
    
        beforeEach( done => {
            // Construct a Websocket
            Connection = new WebSocket(testServerUrl);
            Connection.binaryType = "arraybuffer";
    
            // While open a Websocket
            Connection.onopen = () => {                
                // Checkout if Websocket server is ready
                if (Connection.readyState === WebSocket.OPEN) {
                    // 
                } else {
                    console.log(`"${testServerUrl}" can not open a connection. @${Date.now()}`);
                }
                done();
            };
        }, connectTimeout);
    
        test(`assert the received EventName is "${testReturnName}" within ${connectTimeout} ms.`, 
        done => {
            // While receive a message from Websocket server
            Connection.onmessage = (event: MessageEvent) => {
                expect(event.data.byteLength).toBeGreaterThan(40);
                
                const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                expect(eventName).toBe(testReturnName);

                done();
            };
            Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "5678"
                }
            );
        }, connectTimeout);
               
        test(`assert the "${testReturnName}.success" is true.`,
        done => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                    expect(RegisterViewerAck.success).toBe(true);
                    done();
                }
            );
            Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "5678"
                }
            );
        }, connectTimeout);
    
        test(`assert the "${testReturnName}.message" is empty.`,
        done => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                    expect(RegisterViewerAck.message).toBeDefined();
                    expect(RegisterViewerAck.message).toEqual("");
                    if ( RegisterViewerAck.message !== "" ) {
                        console.log(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAck.message}" @${new Date()}`);
                    }
                    done();
                }
            );
            Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "5678"
                }
            );
        }, connectTimeout);

        afterEach( done => {
            Connection.close();
            done();
        }, connectTimeout);    
    
    });
});
