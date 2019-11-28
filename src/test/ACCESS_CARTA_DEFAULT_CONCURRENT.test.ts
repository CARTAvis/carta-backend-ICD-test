import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectionTimeout = config.timeout.connection;
let concurrentTimeout = config.timeout.concurrent;
let testNumber = config.repeat.concurrent;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "1234",
        clientFeatureFlags: 5,
    },
    filelist: {
        directory: config.path.base,
    },
}

let client: Client[] = Array(testNumber);

describe("Access Websocket concurrently test1", () => {

    test(`establish ${testNumber} connections to "${testServerUrl}".`, done => {

        let clientPromise: Promise<void>[] = Array(testNumber).fill(Promise);

        for (let i = 0; i< client.length; i++) {
            client[i] = new Client(testServerUrl);
            expect(client[i].connection.readyState).toBe(WebSocket.CONNECTING);

            clientPromise[i] = client[i].open(connectionTimeout).then( ()=>{
                expect(client[i].connection.readyState).toBe(WebSocket.OPEN);
            });
        }

        Promise.all(clientPromise).then( () => done() );

    }, concurrentTimeout);

    test(`close ${testNumber} connections from "${testServerUrl}".`, done => {

        let clientPromise: Promise<void>[] = Array(testNumber).fill(Promise);

        for (let i = 0; i< client.length; i++) {
            clientPromise[i] = client[i].close().then( ()=>{
                expect(client[i].connection.readyState).toBe(WebSocket.CLOSED);
            });
        }

        Promise.all(clientPromise).then( () => done() );

    }, concurrentTimeout);
        
});

describe("Access Websocket concurrently test2", () => {

    test(`establish ${testNumber} connections to "${testServerUrl}".`, async () => {

        for (let i = 0; i< client.length; i++) {
            client[i] = new Client(testServerUrl);
            expect(client[i].connection.readyState).toBe(WebSocket.CONNECTING);

            await client[i].open(connectionTimeout).then( ()=>{
                expect(client[i].connection.readyState).toBe(WebSocket.OPEN);
            });
        }

    }, concurrentTimeout);

    test(`close ${testNumber} connections from "${testServerUrl}".`, async () => {

        for (let i = 0; i< client.length; i++) {
            await client[i].close().then( ()=>{
                expect(client[i].connection.readyState).toBe(WebSocket.CLOSED);
            });
        }

    }, concurrentTimeout);
        
});

describe("ACCESS_CARTA_DEFAULT_CONCURRENT test1: Testing multiple concurrent connections to the backend.", () => {
    
    test(`establish ${testNumber} connections to "${testServerUrl}".`, done => {

        let clientPromise: Promise<void>[] = Array(testNumber).fill(Promise);

        for (let i = 0; i< client.length; i++) {
            client[i] = new Client(testServerUrl);
            expect(client[i].connection.readyState).toBe(WebSocket.CONNECTING);

            clientPromise[i] = client[i].open(connectionTimeout).then( ()=>{
                expect(client[i].connection.readyState).toBe(WebSocket.OPEN);
            });
        }

        Promise.all(clientPromise).then( () => done() );

    }, concurrentTimeout);

    let registerViewerAck: CARTA.RegisterViewerAck[] = Array(testNumber).fill(CARTA.RegisterViewerAck);

    test(`${testNumber} connections send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}".`, done => {

        let clientPromise: Promise<CARTA.RegisterViewerAck>[] = Array(testNumber).fill(Promise);

        for(let index = 0; index < client.length; index++) {
            client[index].send(CARTA.RegisterViewer, assertItem.register);
            clientPromise[index] = client[index].receive(CARTA.RegisterViewerAck) as Promise<CARTA.RegisterViewerAck>;
        }

        Promise.all(clientPromise).then( value => {
            registerViewerAck = value;
            done() ;
        });

    }, concurrentTimeout);

    test(`assert every REGISTER_VIEWER_ACK.success to be True.`, () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(item.success).toBe(true);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is not None.`, () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(item.sessionId).toBeDefined();
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is unique.`, () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(array.filter(f => f.sessionId === item.sessionId).length).toEqual(1);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_type is "CARTA.SessionType.NEW".`, () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(item.sessionType).toEqual(CARTA.SessionType.NEW);
        });
    });
        
    afterAll( done => {
        
        let clientPromise: Promise<void>[] = Array(testNumber).fill(Promise);

        for (let i = 0; i< client.length; i++) {
            clientPromise[i] = client[i].close();
        }

        Promise.all(clientPromise).then( () => done() );
    });

});


describe("ACCESS_CARTA_DEFAULT_CONCURRENT test2: Testing multiple concurrent connections to the backend.", () => {
    
    test(`establish ${testNumber} connections to "${testServerUrl}".`, async () => {
        for (let i = 0; i< client.length; i++) {
            client[i] = new Client(testServerUrl);
            expect(client[i].connection.readyState).toBe(WebSocket.CONNECTING);
            await client[i].open(connectionTimeout).then(()=>{
                expect(client[i].connection.readyState).toBe(WebSocket.OPEN);
            });
        }
    }, concurrentTimeout);

    let registerViewerAck: CARTA.RegisterViewerAck[] = Array(testNumber).fill(CARTA.RegisterViewerAck);

    test(`${testNumber} connections send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}" with no session_id & api_key "1234".`, async () => {
        for(let index = 0; index < client.length; index++) {
            await client[index].send(CARTA.RegisterViewer, assertItem.register);
            registerViewerAck[index] = await client[index].receive(CARTA.RegisterViewerAck) as CARTA.RegisterViewerAck;
        }
    }, concurrentTimeout);

    test(`assert every REGISTER_VIEWER_ACK.success to be True.`, () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(item.success).toBe(true);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is not None.`, () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(item.sessionId).toBeDefined();
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is unique.`, () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(array.filter(f => f.sessionId === item.sessionId).length).toEqual(1);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_type is "CARTA.SessionType.NEW".`, () => {
        registerViewerAck.forEach( (item, index, array) => {
            expect(item.sessionType).toEqual(CARTA.SessionType.NEW);
        });
    });
        
    afterAll( async () => {
        for (let i = 0; i< client.length; i++) {
            await client[i].close();
        }
    });

});


