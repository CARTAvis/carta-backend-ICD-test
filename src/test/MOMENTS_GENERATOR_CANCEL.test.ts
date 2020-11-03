import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
var W3CWebSocket = require('websocket').w3cwebsocket;

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let momentTimeout = config.timeout.moment;
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    momentRequest: CARTA.IMomentRequest;
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_CO_2_1.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    momentRequest: {
        fileId: 0,
        regionId: 0,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 73, max: 114 },
    },
};

describe("MOMENTS_GENERATOR_CANCEL: Testing to cancel a moment generator for an image", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.registerViewer);
        await Connection.receive(CARTA.RegisterViewerAck);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Preparation`, () => {
        test(`Open image`, async () => {
            await Connection.send(CARTA.OpenFile, assertItem.openFile);
            await Connection.stream(2);
        }, readFileTimeout);
    });

    let FileId: number[] = [];
    describe(`Moment generator cancel`, () => {
        let MomentProgress: CARTA.MomentProgress[] = [];
        let MomentResponse: CARTA.MomentResponse;
        test(`Request a moment progress but cancel after receiving 2 messages`, async () => {
            let ack;
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest);
            do {
                ack = await Connection.receiveAny();
                switch (ack.constructor.name) {
                    case "MomentResponse":
                        MomentResponse = ack;
                        break;
                    case "MomentProgress":
                        MomentProgress.push(ack);
                        break;
                    case "RegionHistogramData":
                        FileId.push(ack.fileId);
                        break;
                    default:
                        break;
                }
            } while (MomentProgress.length < 5);
            await Connection.send(CARTA.StopMomentCalc, { fileId: 0 });
            MomentResponse = await Connection.receive(CARTA.MomentResponse);
            expect(MomentProgress.length).toEqual(5);
        }, momentTimeout);

        test(`Assert MomentProgress.progress < 1.0`, () => {
            MomentProgress.map(ack => {
                expect(ack.progress).toBeLessThan(1.0);
            });
        });

        test(`Receive no MomentProgress till 500 ms`, async () => {
            await Connection.receive(CARTA.MomentProgress, 500, false);
            expect(Connection.connection.readyState).toBe(W3CWebSocket.OPEN);
        });

        test(`Assert MomentResponse.success = true`, () => {
            expect(MomentResponse.success).toBe(true);
        });

        test(`Assert MomentResponse.cancel = true`, () => {
            expect(MomentResponse.cancel).toBe(true);
        });

        test(`Assert openFileAcks[] is empty`, () => {
            expect(MomentResponse.openFileAcks.length).toBe(0);
        });

    });

    describe(`Moment generator`, () => {
        let MomentProgress: CARTA.MomentProgress[] = [];
        let MomentResponse: CARTA.MomentResponse;
        test(`Receive a series of moment progress`, async () => {
            let ack;
            await Connection.send(CARTA.MomentRequest, {
                ...assertItem.momentRequest,
                moments: [12],
            });
            do {
                ack = await Connection.receiveAny();
                switch (ack.constructor.name) {
                    case "MomentResponse":
                        MomentResponse = ack;
                        break;
                    case "MomentProgress":
                        MomentProgress.push(ack);
                        break;
                    case "RegionHistogramData":
                        FileId.push(ack.fileId);
                        break;
                    default:
                        break;
                }
            } while (ack.constructor.name != "MomentResponse");
            expect(MomentProgress.length).toBeGreaterThan(0);
        }, momentTimeout);

        test(`Assert MomentResponse.success = true`, () => {
            expect(MomentResponse.success).toBe(true);
        });

        test(`Assert openFileAcks[].fileInfo.name = "HD163296_CO_2_1.fits.moment.minimum_coord"`, () => {
            expect(MomentResponse.openFileAcks[0].fileInfo.name).toEqual("HD163296_CO_2_1.fits.moment.minimum_coord");
        });

        test(`Assert openFileAcks[].fileInfoExtended`, () => {
            MomentResponse.openFileAcks.map(ack => {
                expect(ack.fileInfoExtended.height).toEqual(432);
                expect(ack.fileInfoExtended.width).toEqual(432);
                expect(ack.fileInfoExtended.dimensions).toEqual(4);
                expect(ack.fileInfoExtended.depth).toEqual(1);
                expect(ack.fileInfoExtended.stokes).toEqual(1);
            });
        });

    });

    afterAll(() => Connection.close());
});