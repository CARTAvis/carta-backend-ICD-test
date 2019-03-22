import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

describe("ACCESS_CARTA_UNKNOWN_APIKEY tests", () => {
    
    describe(`send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}" with session_id "" & api_key "5678".`, 
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
            await Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "5678"
                }
            );
            await new Promise( resolve => {
                Connection.onmessage = (event: MessageEvent) => {
                    expect(event.data.byteLength).toBeGreaterThan(40);
                    
                    const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                    expect(eventName).toBe("REGISTER_VIEWER_ACK");
    
                    resolve();
                };
            });
        }, connectTimeout);
               
        test(`assert the "REGISTER_VIEWER_ACK.success" is true.`,
        async () => {
            await Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "5678"
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();
                    }
                );
            });
        }, connectTimeout);
    
        test(`assert the "REGISTER_VIEWER_ACK.message" is empty.`,
        async () => {
            await Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "5678"
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.message).toBeDefined();
                        expect(RegisterViewerAck.message).toEqual("");
                        if ( RegisterViewerAck.message !== "" ) {
                            console.log(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAck.message}" @${new Date()}`);
                        }
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
