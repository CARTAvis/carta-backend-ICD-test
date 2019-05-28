import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

describe("ACCESS_CARTA_UNKNOWN_APIKEY tests: Testing connections to the backend with an unknown API key", () => {
    let Connection: WebSocket;
    describe(`send "REGISTER_VIEWER" to "${testServerUrl}" with session_id=0 & api_key="1234"`, () => {
        let RegisterViewerAckTemp: CARTA.RegisterViewerAck; 
        test(`should get "REGISTER_VIEWER_ACK" within ${connectTimeout} ms`, done => {        
            // Connect to "testServerUrl"
            Connection = new WebSocket(testServerUrl);
            expect(Connection.readyState).toBe(WebSocket.CONNECTING);

            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;        
            
            async function OnOpen(this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                await Utility.setEvent(this, CARTA.RegisterViewer,
                    {
                        sessionId: 0, 
                        apiKey: "1234",
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(this, CARTA.RegisterViewerAck, 
                        (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                            RegisterViewerAckTemp = RegisterViewerAck;
                            resolve();
                        }
                    );
                });
                await this.close();
                done();
            }
        }, connectTimeout);

        test("REGISTER_VIEWER_ACK.success = True", () => {
            expect(RegisterViewerAckTemp.success).toBe(true);
        });

        test("REGISTER_VIEWER_ACK.session_id is not None", () => {
            expect(RegisterViewerAckTemp.sessionId).toBeDefined();
            console.log(`Registered session ID is ${RegisterViewerAckTemp.sessionId} @${new Date()}`);
        });

        test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.NEW"`, () => {
            expect(RegisterViewerAckTemp.sessionType).toBe(CARTA.SessionType.NEW);
        });

        test("REGISTER_VIEWER_ACK.message is empty", () => {
            expect(RegisterViewerAckTemp.message).toBe("");
        });

    });

});
