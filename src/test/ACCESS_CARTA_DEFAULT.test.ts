import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
var W3CWebSocket = require('websocket').w3cwebsocket;
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
            expect(Connection.connection.readyState).toBe(W3CWebSocket.CONNECTING);

            await Connection.open().then( () => {
                expect(Connection.connection.readyState).toBe(W3CWebSocket.OPEN);
            });

            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            RegisterViewerAckTemp = await Connection.receive(CARTA.RegisterViewerAck) as CARTA.RegisterViewerAck;

            await Connection.close().then( () => {
                expect(Connection.connection.readyState).toBe(W3CWebSocket.CLOSED);
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

        test("REGISTER_VIEWER_ACK.server_feature_flags = 8", () => {
            expect(RegisterViewerAckTemp.serverFeatureFlags).toEqual(8);
        });

        test("REGISTER_VIEWER_ACK.user_preferences = None", () => {
            expect(RegisterViewerAckTemp.userPreferences).toMatchObject({});
        });

        test("REGISTER_VIEWER_ACK.user_layouts = None", () => {
            expect(RegisterViewerAckTemp.userLayouts).toMatchObject({});
        });
    });
});
