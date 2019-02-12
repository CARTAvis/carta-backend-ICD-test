/// Manual
// let testServerUrl = "ws://127.0.0.1:1234";
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let connectTimeout = 200;
let testTimeout = 1000;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testNumber = 10;
let Connection: WebSocket[] = Array(testNumber);

describe("Access Websocket concurrent test", () => {

    test(`establish ${testNumber} connections to "${testServerUrl}".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber).fill(Promise);
        
        promiseSet.forEach( (item, index, array) => {
            array[index] = new Promise( (resolve, reject) => {
                Connection[index] = new WebSocket(testServerUrl);
                Connection[index].onopen = () => {
                    if (Connection[index].readyState === WebSocket.OPEN) {
                        resolve();
                    } else {
                        console.log(`connection #${index + 1} can not open. @${new Date()}`);
                        reject();
                    }
                };
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectTimeout);
            });
        }, Promise);

        Promise.all(promiseSet).then( () => done() );

    }, testTimeout);

    test(`assert connections to "${testServerUrl}".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber).fill(Promise);
        
        promiseSet.forEach( (item, index, array) => {
            array[index] = new Promise( (resolve, reject) => {
                Connection[index].onclose = () => {
                    expect(Connection[index].readyState).toBe(WebSocket.CLOSED);
                    resolve();
                };
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectTimeout);
            });
        }, Promise);

        Promise.all(promiseSet).then( () => done() );

        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx].close();
        }

    }, testTimeout);
        
});

describe("ACCESS_CARTA_DEFAULT_CONCURRENT test: Testing multiple concurrent connections to the backend.", () => {
    
    test(`establish ${testNumber} connections to "${testServerUrl}".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber).fill(Promise);
        
        promiseSet.forEach( (item, index, array) => {
            array[index] = new Promise( (resolve, reject) => {
                Connection[index] = new WebSocket(testServerUrl);
                Connection[index].binaryType = "arraybuffer";
                Connection[index].onopen = () => {
                    if (Connection[index].readyState === WebSocket.OPEN) {
                        resolve();
                    } else {
                        console.log(`connection #${index + 1} can not open. @${new Date()}`);
                        reject();
                    }
                };
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectTimeout);
            });
        }, Promise);

        Promise.all(promiseSet).then( () => done() );
        
    });

    let registerViewerAck: CARTA.RegisterViewerAck[] = Array(testNumber).fill(CARTA.RegisterViewerAck);

    test(`${testNumber} connections send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}" with no session_id & api_key "1234".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber).fill(Promise);
        
        promiseSet.forEach( (item, index, array) => {
            array[index] = new Promise( (resolve, reject) => {
                Connection[index].onmessage = (event: MessageEvent) => {
                    expect(event.data.byteLength).toBeGreaterThan(40);
                    let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                    if (eventName === "REGISTER_VIEWER_ACK") {
                        let eventData = new Uint8Array(event.data, 36);
                        registerViewerAck[index] = CARTA.RegisterViewerAck.decode(eventData);
                        resolve();
                    }
                };
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectTimeout);
            });
        }, Promise);

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
        registerViewerAck.forEach( (item, index, array) => {
            expect(registerViewerAck[index].success).toBe(true);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is not None.`, 
    () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(item.sessionId).toBeDefined();
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is unique.`, 
    () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(array.filter(f => f.sessionId === item.sessionId).length).toEqual(1);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_type is 0.`, 
    () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(item.sessionType).toEqual(CARTA.SessionType.NEW);
        });
    });
    
    afterAll( () => {
        Connection.forEach( (item, index, array) => {
            item.close();
        });
    });

});