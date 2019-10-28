import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectionTimeout = config.timeout.connection;
let concurrentTimeout = config.timeout.concurrent;
let testNumber = config.repeat.concurrent;

let Connection: WebSocket[] = Array(testNumber);

describe("Access Websocket concurrent test", () => {

    test(`establish ${testNumber} connections to "${testServerUrl}".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber).fill(Promise);
        
        promiseSet.forEach( (item, index, array) => {
            array[index] = new Promise( (resolve, reject) => {
                Connection[index] = new WebSocket(testServerUrl);
                expect(Connection[index].readyState).toBe(WebSocket.CONNECTING);
                Connection[index].onopen = OnOpen;

                function OnOpen (this: WebSocket, ev: Event) {
                    expect(this.readyState).toBe(WebSocket.OPEN);
                    resolve();
                }
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectionTimeout);
            });
        }, Promise);

        Promise.all(promiseSet).then( () => done() );

    }, concurrentTimeout);

    test(`close ${testNumber} connections from "${testServerUrl}".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber).fill(Promise);
        
        promiseSet.forEach( (item, index, array) => {
            array[index] = new Promise( (resolve, reject) => {
                Connection[index].onclose = OnClose;
                function OnClose (this: WebSocket, ev: CloseEvent) {
                    expect(this.readyState).toBe(WebSocket.CLOSED);
                    resolve();
                }
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectionTimeout);
            });
        }, Promise);

        Promise.all(promiseSet).then( () => done() );

        for (let idx = 0; idx < testNumber; idx++) {
            Connection[idx].close();
        }

    }, concurrentTimeout);
        
});

describe("ACCESS_CARTA_DEFAULT_CONCURRENT test: Testing multiple concurrent connections to the backend.", () => {
    
    test(`establish ${testNumber} connections to "${testServerUrl}".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber).fill(Promise);
        
        promiseSet.forEach( (item, index, array) => {
            array[index] = new Promise( (resolve, reject) => {
                Connection[index] = new WebSocket(testServerUrl);
                Connection[index].binaryType = "arraybuffer";
                expect(Connection[index].readyState).toBe(WebSocket.CONNECTING);
                Connection[index].onopen = OnOpen;

                function OnOpen (this: WebSocket, ev: Event) {
                    expect(this.readyState).toBe(WebSocket.OPEN);
                    resolve();
                }
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectionTimeout);
            });
        }, Promise);

        Promise.all(promiseSet).then( () => done() );
        
    }, concurrentTimeout);

    let registerViewerAck: CARTA.RegisterViewerAck[] = Array(testNumber).fill(CARTA.RegisterViewerAck);

    test(`${testNumber} connections send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}" with no session_id & api_key "1234".`, 
    done => {
        let promiseSet: Promise<void>[] = Array(testNumber).fill(Promise);
        
        promiseSet.forEach( (item, index, array) => {
            array[index] = new Promise( (resolve, reject) => {
                Utility.getEvent(Connection[index], CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        registerViewerAck[index] = RegisterViewerAck;
                        resolve();
                    }
                );
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, connectionTimeout);
            });
        }, Promise);

        Promise.all(promiseSet).then( () => done() );

        for (let connection of Connection) {
            Utility.setEvent(connection, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "1234"
                }
            );
        }        
    }, concurrentTimeout);
        
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
            expect(item.readyState).toBe(WebSocket.CLOSED);
        });
    });

});

import {Client} from "./CLIENT";
let client: Client[] = Array(testNumber);
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: {
        directory: config.path.base,
    },
}
describe("Access Websocket and register concurrently", () => {

    test(`establish ${testNumber} connections to "${testServerUrl}".`, async () => {

        for (let i = 0; i< client.length; i++) {
            client[i] = new Client(testServerUrl);
            await client[i].open();
        }

    }, concurrentTimeout);

    test(`close ${testNumber} connections from "${testServerUrl}".`, async () => {

        for (let i = 0; i< client.length; i++) {
            await client[i].send(CARTA.RegisterViewer, assertItem.register);
            await client[i].receiveMock();
            await client[i].close();
        }

    }, concurrentTimeout);
        
});
