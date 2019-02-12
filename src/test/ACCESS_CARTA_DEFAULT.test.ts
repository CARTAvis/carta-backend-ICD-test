/// Manual
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let connectTimeout = 300;
let connectTimeoutRemote = 2000;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testEventName = "REGISTER_VIEWER";
let testReturnName = "REGISTER_VIEWER_ACK";

describe("Websocket tests", () => {
    let testRemoteWebsocketSite = "wss://echo.websocket.org site";
    test(`establish a connection to "${testRemoteWebsocketSite}".`, 
    done => {
        // Construct a Websocket
        let Connection = new WebSocket("wss://echo.websocket.org");

        // While open a Websocket
        Connection.onopen = () => {
            Connection.close();
            done();     // Return to this test
        };
    }, connectTimeoutRemote);

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

describe("ACCESS_CARTA_DEFAULT tests: Testing connections to the backend", () => {
    test(`send EventName: "${testEventName}" to CARTA "${testServerUrl}" without session_id & api_key.`, 
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
                        sessionId: "", 
                        apiKey: ""
                    }
                );

            } else {
                console.log(`"${testEventName}" can not open a connection. @${new Date()}`);
            }

        };

    }, connectTimeout);

    test(`send EventName: "${testEventName}" to CARTA "${testServerUrl}" with no session_id & api_key "1234".`, 
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
                        sessionId: "", 
                        apiKey: "1234"
                    }
                );

            } else {
                console.log(`"${testEventName}" can not open a connection. @${new Date()}`);
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
                    
                    Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                        {
                            sessionId: "", 
                            apiKey: "1234"
                        }
                    );
                    
                } else {
                    console.log(`"${testEventName}" can not open a connection. @${new Date()}`);
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
        }, connectTimeout);
    
        test(`assert the "${testReturnName}.session_id" is not None.`, 
        done => {
            
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                    expect(RegisterViewerAck.sessionId).toBeDefined();
                    console.log(`registed session ID is ${RegisterViewerAck.sessionId} @${new Date()}`);

                    done();
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
        }, connectTimeout);
    
        test(`assert the "${testReturnName}.session_type" is "CARTA.SessionType.NEW".`, 
        done => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                    expect(RegisterViewerAck.sessionType).toBe(CARTA.SessionType.NEW);
                    done();
                }
            );
        }, connectTimeout);

        afterEach( done => {
            Connection.close();
            done();
        }, connectTimeout);
    
    });
});