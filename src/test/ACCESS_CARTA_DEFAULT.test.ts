import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;
interface AssertItem {
    register: CARTA.IRegisterViewer;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
}
describe("ACCESS_CARTA_DEFAULT tests: Testing connections to the backend", () => {
    describe(`send "REGISTER_VIEWER" to "${testServerUrl}" with session_id=${assertItem.register.sessionId} & api_key="${assertItem.register.apiKey}"`, () => {
        let Connection: Client;
        let RegisterViewerAckTemp: CARTA.RegisterViewerAck; 
        test(`should get "REGISTER_VIEWER_ACK" within ${connectTimeout} ms`, async () => {
            Connection = new Client(testServerUrl);
            expect(Connection.connection.readyState).toBe(WebSocket.CONNECTING);

            await Connection.open().then( () => {
                expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            });

            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            RegisterViewerAckTemp = await Connection.receive(CARTA.RegisterViewerAck) as CARTA.RegisterViewerAck;

            await Connection.close().then( () => {
                expect(Connection.connection.readyState).toBe(WebSocket.CLOSED);
            });

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

        test("REGISTER_VIEWER_ACK.message is be defined ", () => {
            expect(RegisterViewerAckTemp.message).toBeDefined();
            if (RegisterViewerAckTemp.message !== ""){
                console.warn(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAckTemp.message}" @${new Date()}`)
            };
        });

        test("REGISTER_VIEWER_ACK.server_feature_flags = 0", () => {
            expect(RegisterViewerAckTemp.serverFeatureFlags).toEqual(0);
        });
    });
});
