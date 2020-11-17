import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

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
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Preparation`, () => {
        test(`Open image`, async () => {
            await Connection.openFile(assertItem.openFile);
        }, readFileTimeout);
    });

    let FileId: number[] = [];
    describe(`Moment generator cancel`, () => {
        let ack: AckStream;
        let MomentResponse: CARTA.MomentResponse;
        test(`Request a moment progress but cancel after receiving 5 MomentProgress`, async () => {
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest);
            ack = await Connection.streamUntil((type, data, ack) => ack.MomentProgress.length==5);
            FileId = ack.RegionHistogramData.map(data => data.fileId);
            await Connection.send(CARTA.StopMomentCalc, { fileId: 0 });
            MomentResponse = await Connection.receive(CARTA.MomentResponse);
            expect(ack.MomentProgress.length).toEqual(5);
        }, momentTimeout);

        test(`Assert MomentProgress.progress < 1.0`, () => {
            ack.MomentProgress.map(ack => {
                expect(ack.progress).toBeLessThan(1.0);
            });
        });

        test(`Receive no MomentProgress till 500 ms`, async () => {
            await Connection.receive(CARTA.MomentProgress, 500, false);
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
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
        let ack: AckStream;
        test(`Receive a series of moment progress`, async () => {
            await Connection.send(CARTA.MomentRequest, {
                ...assertItem.momentRequest,
                moments: [12],
            });
            ack = await Connection.streamUntil(type => type == CARTA.MomentResponse);
            expect(ack.MomentProgress.length).toBeGreaterThan(0);
        }, momentTimeout);

        test(`Assert MomentResponse.success = true`, () => {
            expect(ack.MomentResponse[0].success).toBe(true);
        });

        test(`Assert openFileAcks[].fileInfo.name = "HD163296_CO_2_1.fits.moment.minimum_coord"`, () => {
            expect(ack.MomentResponse[0].openFileAcks[0].fileInfo.name).toEqual("HD163296_CO_2_1.fits.moment.minimum_coord");
        });

        test(`Assert openFileAcks[].fileInfoExtended`, () => {
            ack.MomentResponse[0].openFileAcks.map(ack => {
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