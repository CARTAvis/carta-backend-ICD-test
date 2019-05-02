import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

describe("Websocket tests", () => {
    let testRemoteWebsocketSite = "wss://echo.websocket.org site";
    test.skip(`establish a connection to "${testRemoteWebsocketSite}".`, 
    done => {
        // Construct a Websocket
        let Connection = new WebSocket(testRemoteWebsocketSite);

        // While open a Websocket
        Connection.onopen = () => {
            Connection.close();
            done();     // Return to this test
        };
    }, connectTimeout);

    test(`establish a connection to "${testServerUrl}".`, 
    done => {

        let Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        
        Connection.onopen = OnOpen;
        Connection.onclose = OnClose;

        function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            
            this.close();
            expect(this.readyState).toBe(WebSocket.CLOSING);
        }
        function OnClose (this: WebSocket, ev: CloseEvent) {
            expect(this.readyState).toBe(WebSocket.CLOSED);
            done();
        }

    }, connectTimeout);
});

describe("ACCESS_CARTA_DEFAULT tests: Testing connections to the backend", () => {
    test(`send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}" without session_id & api_key.`, 
    done => {        

        let Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;        
        
        async function OnOpen(this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: ""
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();
                    }
                );
            });
            await this.close();
            done();
        }
    }, connectTimeout);

    test(`send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}" with no session_id & api_key "1234".`, 
    done => {
        let Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen(this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();
                    }
                );
            });
            await this.close();
            done();
        }        
    }, connectTimeout);

    describe(`receive EventName: "REGISTER_VIEWER_ACK" tests on CARTA "${testServerUrl}"`, 
    () => {

        let Connection: WebSocket;
        
        beforeEach( done => {
            Connection = new WebSocket(testServerUrl);
            expect(Connection.readyState).toBe(WebSocket.CONNECTING);
            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;

            function OnOpen(this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                done();
            }
        }, connectTimeout);
    
        test(`assert the received EventName is "REGISTER_VIEWER_ACK" within ${connectTimeout} ms.`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.RegisterViewer, 
                {
                    sessionId: 0,
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => {
                Connection.onmessage = (event: MessageEvent) => {
                    const eventHeader16 = new Uint16Array(event.data, 0, 2);
                    const eventType = eventHeader16[0];
                    expect(event.data.byteLength).toBeGreaterThan(0);
                    expect(eventType).toEqual(Utility.EventType.RegisterViewerAck);

                    resolve();
                };
            });
        }, connectTimeout);
    
        test(`assert the "REGISTER_VIEWER_ACK.session_id" is not None.`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.RegisterViewer, 
                {
                    sessionId: 0,
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => {            
                Utility.getEvent(Connection, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.sessionId).toBeDefined();
                        console.log(`Registered session ID is ${RegisterViewerAck.sessionId} @${new Date()}`);

                        resolve();
                    }
                );
            });
        }, connectTimeout);
    
        test(`assert the "REGISTER_VIEWER_ACK.success" is true.`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.RegisterViewer, 
                {
                    sessionId: 0,
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();
                    }
                );
            });
        }, connectTimeout);
    
        test(`assert the "REGISTER_VIEWER_ACK.session_type" is "CARTA.SessionType.NEW".`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.RegisterViewer, 
                {
                    sessionId: 0,
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.sessionType).toBe(CARTA.SessionType.NEW);
                        resolve();
                    }
                );
            });
        }, connectTimeout);

        afterEach( done => {  
            Connection.onclose = () => done();
            Connection.close();
        }, connectTimeout);
    
    });
});
