import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

describe("ACCESS_CARTA_RESUME_SESSION test: Testing connections to the backend with a wrong session id.", () => {
    
    describe(`send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}" with session_id = -1 & api_key = "1234".`, 
    () => {
        let Connection: WebSocket;
    
        beforeEach( done => {
            Connection = new WebSocket(testServerUrl);
            expect(Connection.readyState).toBe(WebSocket.CONNECTING);
            Connection.binaryType = "arraybuffer";
    
            Connection.onopen = OnOpen;
    
            function OnOpen (this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                done();
            }
        }, connectTimeout);
    
        test(`assert the received EventName is "REGISTER_VIEWER_ACK" within ${connectTimeout} ms.`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.RegisterViewer, 
                {
                    sessionId: -1, 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        resolve();
                    }
                );
            });
        }, connectTimeout);
               
        test(`assert the "REGISTER_VIEWER_ACK.success" is false.`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.RegisterViewer, 
                {
                    sessionId: -1, 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(false);
                        resolve();
                    }
                );
            });
        }, connectTimeout);
    
        test(`assert the "REGISTER_VIEWER_ACK.message" is not empty.`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.RegisterViewer, 
                {
                    sessionId: -1, 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.message).toBeDefined();
                        expect(RegisterViewerAck.message).not.toEqual("");
                        if ( RegisterViewerAck.message !== "" ) {
                            console.log(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAck.message}" @${new Date()}`);
                        }
                        resolve();
                    }
                );
            });
        }, connectTimeout);

        test(`assert the "REGISTER_VIEWER_ACK.session_type" is 1.`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.RegisterViewer, 
                {
                    sessionId: -1, 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.sessionType).toEqual(1);
                        resolve();
                    }
                );
            });
        }, connectTimeout);
    
        afterEach( async () => {
            await Connection.close();
            await expect(Connection.readyState).toBe(WebSocket.CLOSING);
        }, connectTimeout);    
    
    });
});