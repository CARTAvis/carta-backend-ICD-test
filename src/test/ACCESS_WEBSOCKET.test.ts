import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

describe("ACCESS_WEBSOCKET tests: Testing connections to the websocket server", () => {
    let testRemoteWebsocketSite = "wss://echo.websocket.org";
    test(`should connect to "${testRemoteWebsocketSite}".`, 
    done => {
        // Construct a Websocket
        let Connection = new WebSocket(testRemoteWebsocketSite);

        // While open a Websocket
        Connection.onopen = () => {
            Connection.close();
            done();     // Return to this test
        };
    }, connectTimeout + 2000);

    test(`should connect to "${testServerUrl}".`, done => {

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