import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;
interface AssertItem {
    register: CARTA.IRegisterViewer;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 9999,
        apiKey: "",
    },
}
describe("ACCESS_CARTA_UNKNOWN_SESSION tests: Testing connections to the backend with an unknown session id", () => {
    describe(`send "REGISTER_VIEWER" to "${testServerUrl}" with session_id=${assertItem.register.sessionId} & api_key="${assertItem.register.apiKey}"`, () => {
        let RegisterViewerAckTemp: CARTA.RegisterViewerAck; 
        test(`should get "REGISTER_VIEWER_ACK" within ${connectTimeout} ms`, done => {        
            // Connect to "testServerUrl"
            let Connection = new WebSocket(testServerUrl);
            expect(Connection.readyState).toBe(WebSocket.CONNECTING);

            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;        
            
            async function OnOpen(this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
                await Utility.getEventAsync(this, CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        RegisterViewerAckTemp = RegisterViewerAck;
                    }
                );
                await this.close();
                done();
            }
        }, connectTimeout);

        test("REGISTER_VIEWER_ACK.success = False", () => {
            expect(RegisterViewerAckTemp.success).toBe(false);
        });

        test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.NEW"`, () => {
            expect(RegisterViewerAckTemp.sessionType).toBe(CARTA.SessionType.RESUMED);
        });

        test("REGISTER_VIEWER_ACK.message is not empty", () => {
            expect(RegisterViewerAckTemp.message).toBeDefined();
            expect(RegisterViewerAckTemp.message).not.toEqual("");
            if ( RegisterViewerAckTemp.message !== "" ) {
                console.log(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAckTemp.message}" @${new Date()}`);
            }
        });

    });
});
