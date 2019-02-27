/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testEventName = "REGISTER_VIEWER";
let testReturnName = "REGISTER_VIEWER_ACK";

describe("ACCESS_CARTA_RESUME_SESSION test: Testing connections to the backend with a wrong session id.", () => {
    
    describe(`send EventName: "${testEventName}" to CARTA "${testServerUrl}" with session_id "an-unknown-session-id" & api_key "1234".`, 
    () => {

        let Connection: WebSocket;
    
        beforeEach( done => {
            // Construct a Websocket
            Connection = new WebSocket(testServerUrl);
            Connection.binaryType = "arraybuffer";
    
            // While open a Websocket
            Connection.onopen = () => {
                
                // Checkout if Websocket server is ready
                if (Connection.readyState === WebSocket.OPEN) {
                    //
                } else {
                    console.log(`"${testServerUrl}" can not open a connection. @${new Date()}`);
                }
                done();
            };
        }, connectTimeout);
    
        test(`assert the received EventName is "${testReturnName}" within ${connectTimeout} ms.`, 
        done => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                RegisterViewerAck => {
                    done();
                }
            );
            Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "an-unknown-session-id", 
                    apiKey: "1234"
                }
            );
        }, connectTimeout);
               
        test(`assert the "${testReturnName}.success" is false.`, 
        done => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                RegisterViewerAck => {
                    expect(RegisterViewerAck.success).toBe(false);
                    done();
                }
            );
            Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "an-unknown-session-id", 
                    apiKey: "1234"
                }
            );
        }, connectTimeout);
    
        test(`assert the "${testReturnName}.message" is not empty.`, 
        done => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                RegisterViewerAck => {
                    expect(RegisterViewerAck.message).toBeDefined();
                    expect(RegisterViewerAck.message).not.toEqual("");
                    if ( RegisterViewerAck.message !== "" ) {
                        console.log(`"REGISTER_VIEWER_ACK.message" returns: "${RegisterViewerAck.message}" @${new Date()}`);
                    }
                    done();
                }
            );
            Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "an-unknown-session-id", 
                    apiKey: "1234"
                }
            );
        }, connectTimeout);

        test(`assert the "${testReturnName}.session_type" is 1.`, 
        done => {
            Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                    expect(RegisterViewerAck.sessionType).toEqual(1);
                    done();
                }
            );
            Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "an-unknown-session-id", 
                    apiKey: "1234"
                }
            );
        }, connectTimeout);
    
        afterEach( done => {
            Connection.close();
            done();
        }, connectTimeout);    
    
    });
});