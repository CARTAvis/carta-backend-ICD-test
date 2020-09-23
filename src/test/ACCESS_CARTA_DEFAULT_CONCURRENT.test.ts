import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
var W3CWebSocket = require('websocket').w3cwebsocket;
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

describe("Access Websocket concurrently", () => {

    test(`establish ${testNumber} connections to "${testServerUrl}".`, async () => {

        for (let i = 0; i < client.length; i++) {
            client[i] = new Client(testServerUrl);
            expect(client[i].connection.readyState).toBe(W3CWebSocket.CONNECTING);

            await client[i].open(connectionTimeout).then(() =>
                expect(client[i].connection.readyState).toBe(W3CWebSocket.OPEN)
            );
        }

    }, concurrentTimeout);

    test(`close ${testNumber} connections from "${testServerUrl}".`, async () => {

        for (let i = 0; i < client.length; i++) {
            await client[i].close().then(() =>
                expect(client[i].connection.readyState).toBe(W3CWebSocket.CLOSED)
            );
        }

    }, concurrentTimeout);

});

describe("ACCESS_CARTA_DEFAULT_CONCURRENT: Testing multiple concurrent connections to the backend.", () => {

    test(`establish ${testNumber} connections to "${testServerUrl}".`, async () => {
        for (let i = 0; i < client.length; i++) {
            client[i] = new Client(testServerUrl);
            expect(client[i].connection.readyState).toBe(W3CWebSocket.CONNECTING);
            await client[i].open(connectionTimeout).then(() =>
                expect(client[i].connection.readyState).toBe(W3CWebSocket.OPEN)
            );
        }
    }, concurrentTimeout);

    let registerViewerAck: CARTA.RegisterViewerAck[] = [];

    test(`${testNumber} connections send EventName: "REGISTER_VIEWER" to CARTA "${testServerUrl}".`, async () => {
        for (let index = 0; index < client.length; index++) {
            client[index].send(CARTA.RegisterViewer, assertItem.register);
            registerViewerAck.push(await client[index].receive(CARTA.RegisterViewerAck));
        }
    }, concurrentTimeout);

    test(`assert every REGISTER_VIEWER_ACK.success is True.`, () => {
        registerViewerAck.forEach((item, index, array) => {
            expect(item.success).toBe(true);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is not None.`, () => {
        registerViewerAck.forEach((item, index, array) => {
            expect(item.sessionId).toBeDefined();
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_id is unique.`, () => {
        registerViewerAck.forEach((item, index, array) => {
            expect(array.filter(f => f.sessionId === item.sessionId).length).toEqual(1);
        });
    });

    test(`assert every REGISTER_VIEWER_ACK.session_type is "CARTA.SessionType.NEW".`, () => {
        registerViewerAck.forEach((item, index, array) => {
            expect(item.sessionType).toEqual(CARTA.SessionType.NEW);
        });
    });

    afterAll(async () => {
        for (let i = 0; i < client.length; i++) {
            await client[i].close();
        }
    });

});


