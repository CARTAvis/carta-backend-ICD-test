import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;
var W3CWebSocket = require('websocket').w3cwebsocket;
describe("ACCESS_WEBSOCKET tests: Testing connections to the websocket server", () => {
    let testRemoteWebsocketSite = "wss://echo.websocket.org";
    test(`should connect to "${testRemoteWebsocketSite}".`, done => {
        // Construct a Websocket
        let Connection = new W3CWebSocket(testRemoteWebsocketSite);

        // While open a Websocket
        Connection.onopen = () => {
            if (config.log.event) {
                console.log(testRemoteWebsocketSite + "  opened");
            }
            Connection.close();
            done();     // Return to this test
        };
    }, connectTimeout + 2000);

    test(`should connect to "${testServerUrl}".`, done => {

        let Connection = new W3CWebSocket(testServerUrl);
        expect(Connection.readyState).toBe(W3CWebSocket.CONNECTING);
        
        Connection.onopen = OnOpen;

        function OnOpen (this, ev: Event) {
            expect(this.readyState).toBe(W3CWebSocket.OPEN);
            if (config.log.event) {
                console.log(testServerUrl + "  opened");
            }
            
            this.close();
            expect(this.readyState).toBe(W3CWebSocket.CLOSING);

            Connection.onclose = OnClose;
            function OnClose (this, ev: CloseEvent) {
                expect(this.readyState).toBe(W3CWebSocket.CLOSED);
                if (config.log.event) {
                    console.log(testServerUrl + "  closed");
                }
                done();
            }
        }

    }, connectTimeout);
});