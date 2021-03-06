import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;
interface AssertItem {
    register: CARTA.IRegisterViewer;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 12345,
        apiKey: "",
        clientFeatureFlags: 5,
    },
}
describe("ACCESS_CARTA_SAME_ID_TWICE tests: Testing backend connection with default parameters", () => {
    describe(`send "REGISTER_VIEWER" to "${testServerUrl}" with session_id=${assertItem.register.sessionId} & api_key="${assertItem.register.apiKey}"`, () => {
        let Connection: Client;
        let RegisterViewerAckTemp: CARTA.RegisterViewerAck;
        
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
        });

        test(`should get "REGISTER_VIEWER_ACK"x2 within ${connectTimeout} ms`, async () => {

            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);

            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            RegisterViewerAckTemp = await Connection.receive(CARTA.RegisterViewerAck) as CARTA.RegisterViewerAck;

            await Connection.close().then(()=>{
                expect(Connection.connection.readyState).toBe(WebSocket.CLOSED);
            });

        }, connectTimeout);

        test("REGISTER_VIEWER_ACK.success = True", () => {
            expect(RegisterViewerAckTemp.success).toBe(true);
        });

        test(`REGISTER_VIEWER_ACK.session_id is ${assertItem.register.sessionId}`, () => {
            expect(RegisterViewerAckTemp.sessionId).toEqual(assertItem.register.sessionId);
        });

        test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.RESUMED"`, () => {
            expect(RegisterViewerAckTemp.sessionType).toBe(CARTA.SessionType.RESUMED);
        });

        // test("REGISTER_VIEWER_ACK.server_feature_flags = 8", () => {
        //     expect(RegisterViewerAckTemp.serverFeatureFlags).toEqual(8);
        // });

        test("REGISTER_VIEWER_ACK.user_preferences = None", () => {
            expect(RegisterViewerAckTemp.userPreferences).toMatchObject({});
        });

        test("REGISTER_VIEWER_ACK.user_layouts = None", () => {
            expect(RegisterViewerAckTemp.userLayouts).toMatchObject({});
        });

    });
});
