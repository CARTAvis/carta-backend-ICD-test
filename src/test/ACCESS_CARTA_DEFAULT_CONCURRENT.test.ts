/// Manual
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let connectTimeout = 500;
let assertPeriod = 200;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testNumber = 10;
let Connection: WebSocket[] = new Array(testNumber);

describe("Access Websocket concurrent tests", () => {
    beforeAll( () => {
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx] = new WebSocket(testServerUrl);
        }
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx].onopen = () => {
                setTimeout( () => {
                    Connection[idx].close();
                }, assertPeriod);
            }; 
        }
    });

    for (let idx = 0; idx < testNumber; idx++) {
        test(`establish the connection #${idx + 1} to "${testServerUrl}".`, 
        done => {
            Connection[idx].onclose = () => {
                done(); // Return to this test
            };
        }, connectTimeout);
    }
});

describe("ACCESS_CARTA_DEFAULT_CONCURRENT tests: Testing multiple concurrent connections to the backend.", () => {
    
    beforeAll( () => {
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx] = new WebSocket(testServerUrl);
            Connection[idx].binaryType = "arraybuffer";
        }
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx].onopen = () => {
                setTimeout( () => {
                    // Checkout if Websocket server is ready
                    if (Connection[idx].readyState === WebSocket.OPEN) {
                        // Preapare the message on a eventData
                        let message = CARTA.RegisterViewer.create({sessionId: "", apiKey: "1234"});
                        let payload = CARTA.RegisterViewer.encode(message).finish();
                        let eventData = new Uint8Array(32 + 4 + payload.byteLength);

                        eventData.set(Utility.stringToUint8Array("REGISTER_VIEWER", 32));
                        eventData.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventData.set(payload, 36);

                        Connection[idx].send(eventData);
                    } else {
                        console.log(`connection #${idx} can not open. @${new Date()}`);
                    }
                }, assertPeriod);
            }; 
        }
    });

    let registerViewerAck: CARTA.RegisterViewerAck[] = new Array(testNumber);
    for (let idx = 0; idx < testNumber; idx++) {
        test(`connection #${idx + 1}: send EventName: "${"REGISTER_VIEWER"}" to CARTA "${testServerUrl}" with no session_id & api_key "1234".`, 
        done => {
            Connection[idx].onmessage = (event: MessageEvent) => {
                expect(event.data.byteLength).toBeGreaterThan(40);
                let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                if (eventName === "REGISTER_VIEWER_ACK") {
                    let eventData = new Uint8Array(event.data, 36);
                    registerViewerAck[idx] = CARTA.RegisterViewerAck.decode(eventData);
                    done();
                } // if
            };
        }, connectTimeout);

        test(`connection #${idx + 1}: assert REGISTER_VIEWER_ACK.success to be True.`, 
        () => {
            expect(registerViewerAck[idx].success).toBe(true);
        });

        test(`connection #${idx + 1}: assert REGISTER_VIEWER_ACK.session_id is not None.`, 
        () => {
            expect(registerViewerAck[idx].sessionId).toBeDefined();
        });

        test(`connection #${idx + 1}: assert REGISTER_VIEWER_ACK.session_id is unique.`, 
        () => {
            expect(registerViewerAck.filter(f => f.sessionId === registerViewerAck[idx].sessionId).length).toEqual(1);
        });

        test(`connection #${idx + 1}: assert REGISTER_VIEWER_ACK.session_type is 0.`, 
        () => {
            expect(registerViewerAck[idx].sessionType).toEqual(CARTA.SessionType.NEW);
        });
    }
    
    afterAll( () => {
        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx].close();
        }
    }, connectTimeout);

});