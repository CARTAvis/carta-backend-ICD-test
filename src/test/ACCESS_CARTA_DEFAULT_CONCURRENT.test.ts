/// Manual
let testServerUrl = "ws://carta.asiaa.sinica.edu.tw:4002";
let connectTimeout = 100;
let testTimeout = 1000;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testNumber = 10;
let Connection: WebSocket[] = new Array(testNumber);

describe("Access Websocket concurrent test", () => {

    test(`establish ${testNumber} connections to "${testServerUrl}".`, 
    done => {

        let promiseSet: Promise<void>[] = Array(testNumber);
        
        for (let idx = 0; idx < testNumber; idx++) {
            promiseSet[idx] = new Promise( (resolve, reject) => {
                Connection[idx] = new WebSocket(testServerUrl);
                Connection[idx].onopen = () => {
                    if (Connection[idx].readyState === WebSocket.OPEN) {
                        resolve();
                    } else {
                        console.log(`connection #${idx + 1} can not open. @${new Date()}`);
                        reject();
                    }
                };
            });
        }

        Promise.all(promiseSet).then( () => done() );
    }, testTimeout);

    test(`assert connections to "${testServerUrl}".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber);
        
        for (let idx = 0; idx < testNumber; idx++) {
            promiseSet[idx] = new Promise( (resolve, reject) => {
                Connection[idx].onclose = () => {
                    expect(Connection[idx].readyState).toBe(WebSocket.CLOSED);
                    resolve();
                };
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectTimeout);
            });
        }

        Promise.all(promiseSet).then( () => done() );

        for (let idx = 0; idx < testNumber; idx++) {
         Connection[idx].close();
        }
    }, testTimeout);
        
});

describe("ACCESS_CARTA_DEFAULT_CONCURRENT test: Testing multiple concurrent connections to the backend.", () => {
    
    test(`establish ${testNumber} connections to "${testServerUrl}".`, done => {
        let promiseSet: Promise<void>[] = Array(testNumber);
        
        for (let idx = 0; idx < testNumber; idx++) {
            promiseSet[idx] = new Promise( (resolve, reject) => {
                Connection[idx] = new WebSocket(testServerUrl);
                Connection[idx].binaryType = "arraybuffer";
                Connection[idx].onopen = () => {
                    if (Connection[idx].readyState === WebSocket.OPEN) {
                        resolve();
                    } else {
                        console.log(`connection #${idx + 1} can not open. @${new Date()}`);
                        reject();
                    }
                };
            });
        }

        Promise.all(promiseSet).then( () => done() );
    });

    let registerViewerAck: CARTA.RegisterViewerAck[] = Array(testNumber);

    test(`${testNumber} connections send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}" with no session_id & api_key "1234".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber);
        
        for (let idx = 0; idx < testNumber; idx++) {
            promiseSet[idx] = new Promise( (resolve, reject) => {
                Connection[idx].onmessage = (event: MessageEvent) => {
                    expect(event.data.byteLength).toBeGreaterThan(40);
                    let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                    if (eventName === "REGISTER_VIEWER_ACK") {
                        let eventData = new Uint8Array(event.data, 36);
                        registerViewerAck[idx] = CARTA.RegisterViewerAck.decode(eventData);
                        resolve();
                    }
                };
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectTimeout);
            });
        }

        Promise.all(promiseSet).then( () => done() );

        let messageRegisterViewer = CARTA.RegisterViewer.create({sessionId: "", apiKey: "1234"});
        let payloadRegisterViewer = CARTA.RegisterViewer.encode(messageRegisterViewer).finish();
        let eventDataRegisterViewer = new Uint8Array(32 + 4 + payloadRegisterViewer.byteLength);

        eventDataRegisterViewer.set(Utility.stringToUint8Array("REGISTER_VIEWER", 32));
        eventDataRegisterViewer.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
        eventDataRegisterViewer.set(payloadRegisterViewer, 36);

        Connection.forEach( (item, index, array) => {
            item.send(eventDataRegisterViewer);
        });
        
    }, testTimeout);
        
    test(`assert every REGISTER_VIEWER_ACK.success to be True.`, 
    () => {
        for (let idx = 0; idx < testNumber; idx++) {
            expect(registerViewerAck[idx].success).toBe(true);
        }
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is not None.`, 
    () => {
        for (let idx = 0; idx < testNumber; idx++) {
            expect(registerViewerAck[idx].sessionId).toBeDefined();
        }
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is unique.`, 
    () => {
        for (let idx = 0; idx < testNumber; idx++) {
            expect(registerViewerAck.filter(f => f.sessionId === registerViewerAck[idx].sessionId).length).toEqual(1);
        }
    });

    test(`assert every REGISTER_VIEWER_ACK.session_type is 0.`, 
    () => {
        for (let idx = 0; idx < testNumber; idx++) {
            expect(registerViewerAck[idx].sessionType).toEqual(CARTA.SessionType.NEW);
        }
    });
    
    afterAll( () => {
        Connection.forEach( (item, index, array) => {
            item.close();
        });
    });

});