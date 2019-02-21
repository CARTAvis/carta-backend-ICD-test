/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testEventName = "REGISTER_VIEWER";
let testReturnName = "REGISTER_VIEWER_ACK";

describe("Websocket tests", () => {
    test(`establish a connection to "${testServerUrl}".`, 
    done => {
        // Construct a Websocket
        let Connection = new WebSocket(testServerUrl);

        // While open a Websocket
        Connection.onopen = () => {
            Connection.close();
            done();     // Return to this test
        };
    }, connectTimeout);
});

describe("ACCESS_CARTA_WRONG_SID tests", () => {
    
    test(`send EventName: "${testEventName}" to CARTA "${testServerUrl}" with session_id "an-unknown-session-id" & api_key "1234".`, 
    done => {
        // Construct a Websocket
        let Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";

        // While open a Websocket
        Connection.onopen = () => {
            
            // Checkout if Websocket server is ready
            if (Connection.readyState === WebSocket.OPEN) {
                
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(true);
                        done();
                    }
                );

                Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "an-unknown-session-id", 
                        apiKey: "1234"
                    }
                );

            } else {
                console.log(`"${testServerUrl}" can not open a connection. @${Date.now()}`);
            }

        };

    }, connectTimeout);

    describe(`receive EventName: "${testReturnName}" tests on CARTA "${testServerUrl}"`, 
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
                    console.log(`"${testServerUrl}" can not open a connection. @${new Date()}`);
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
                    sessionId: "an-unknown-session-id", 
                    apiKey: "1234"
                }
            );
        }, connectTimeout);
               
        test(`assert the "${testReturnName}.success" is false.`, 
        done => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                    expect(RegisterViewerAck.success).toBe(false);
                    done();
                }
            );
            Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "an-unknown-session-id", 
                    apiKey: "1234"
                }
            );
        }, connectTimeout);
    
        test(`assert the "${testReturnName}.message" is not None.`, 
        done => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                    expect(RegisterViewerAck.message).toBeDefined();
                    console.log(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAck.message}" @${new Date()}`);
                
                    done();
                }
            );
            Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "an-unknown-session-id", 
                    apiKey: "1234"
                }
            );
        }, connectTimeout);

        afterEach( done => {
            Connection.close();
            done();
        }, connectTimeout);    
    
    });
});