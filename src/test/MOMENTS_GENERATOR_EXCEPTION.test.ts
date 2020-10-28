import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
var W3CWebSocket = require('websocket').w3cwebsocket;

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let momentTimeout = config.timeout.moment;
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    momentRequest: CARTA.IMomentRequest[];
    setCursor: CARTA.ISetCursor;
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
    momentRequest: [
        {
            fileId: 0,
            regionId: 0,
            axis: CARTA.MomentAxis.SPECTRAL,
            mask: CARTA.MomentMask.Include,
            moments: [0, 1, 2,],
            pixelRange: { min: 0.1, max: 1.0 },
            spectralRange: { min: 73, max: 114 },
        },
        {
            fileId: 0,
            regionId: 0,
            axis: CARTA.MomentAxis.SPECTRAL,
            mask: CARTA.MomentMask.Include,
            moments: [0, 1,],
            pixelRange: { min: 0.1, max: 1.0 },
            spectralRange: { min: 73, max: 114 },
        },
    ],
    setCursor: {
        point: { x: 218, y: 218 },
    },
};

describe("MOMENTS_GENERATOR_EXCEPTION: Testing moments generator for exception", () => {
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
        test(`Request 3 moment images`, async () => {
            let ack;
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest[0]);
            do {
                ack = await Connection.receiveAny();
            } while (ack.constructor.name != "MomentResponse");
        }, momentTimeout);
    });

    let FileId: number[] = [];
    describe(`Moment generator again`, () => {
        let MomentProgress: CARTA.MomentProgress[] = [];
        let MomentResponse: CARTA.MomentResponse;
        test(`Receive a series of moment progress & MomentProgress.progress < 1`, async () => {
            let ack;
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest[1]);
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

        test(`Receive ${assertItem.momentRequest[1].moments.length} REGION_HISTOGRAM_DATA`, () => {
            expect(FileId.length).toEqual(assertItem.momentRequest[1].moments.length);
        });

        test(`Assert MomentResponse.success = true`, () => {
            expect(MomentResponse.success).toBe(true);
        });

        test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest[1].moments.length}`, () => {
            expect(MomentResponse.openFileAcks.length).toEqual(assertItem.momentRequest[1].moments.length);
        });

        test(`Assert all MomentResponse.openFileAcks[].success = true`, () => {
            MomentResponse.openFileAcks.map(ack => {
                expect(ack.success).toBe(true);
            });
        });
    });

    describe(`Requset moment image`, () => {
        let SpatialProfileData: CARTA.SpatialProfileData;
        test(`Receive the image data until RasterTileSync.endSync = true`, async () => {
            await Connection.send(CARTA.AddRequiredTiles, {
                fileId: FileId[1] + 1,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            });
            let ack;
            do {
                ack = await Connection.receiveAny();
            } while (!(ack.constructor.name == "RasterTileSync" && ack.endSync));
        }, readFileTimeout * FileId.length);

        test(`Receive SpatialProfileData`, async () => {
            await Connection.send(CARTA.SetCursor, {
                fileId: FileId[1] + 1,
                ...assertItem.setCursor,
            });
            SpatialProfileData = await Connection.receiveAny();
        });

        test(`Assert SpatialProfileData.value`, () => {
            expect(SpatialProfileData.value).toBeCloseTo(7.8840599, assertItem.precisionDigit);
        });

        test(`Assert backend is still alive`, () => {
            expect(Connection.connection.readyState).toBe(W3CWebSocket.OPEN);
        });
    });
    afterAll(() => Connection.close());
});