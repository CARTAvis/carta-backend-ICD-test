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
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Preparation`, () => {
        test(`Open image`, async () => {
            await Connection.openFile(assertItem.openFile);
        }, readFileTimeout);
        test(`Request 3 moment images`, async () => {
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest[0]);
            await Connection.streamUntil(type => type == CARTA.MomentResponse);
        }, momentTimeout);
    });

    let FileId: number[] = [];
    describe(`Moment generator again`, () => {
        let ack: AckStream;
        test(`Receive a series of moment progress & MomentProgress.progress < 1`, async () => {
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest[1]);
            ack = await Connection.streamUntil(
                (type, data, ack) =>
                    ack.RegionHistogramData.length == assertItem.momentRequest[1].moments.length &&
                    ack.MomentResponse.length > 0
            );
            FileId = ack.RegionHistogramData.map(data => data.fileId);
            expect(ack.MomentProgress.length).toBeGreaterThan(0);
        }, momentTimeout);

        test(`Receive ${assertItem.momentRequest[1].moments.length} REGION_HISTOGRAM_DATA`, () => {
            expect(FileId.length).toEqual(assertItem.momentRequest[1].moments.length);
        });

        test(`Assert MomentResponse.success = true`, () => {
            expect(ack.MomentResponse[0].success).toBe(true);
        });

        test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest[1].moments.length}`, () => {
            expect(ack.MomentResponse[0].openFileAcks.length).toEqual(assertItem.momentRequest[1].moments.length);
        });

        test(`Assert all MomentResponse.openFileAcks[].success = true`, () => {
            ack.MomentResponse[0].openFileAcks.map(ack => {
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
            await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync && data.endSync);
        }, readFileTimeout * FileId.length);

        test(`Receive SpatialProfileData`, async () => {
            await Connection.send(CARTA.SetCursor, {
                fileId: FileId[1] + 1,
                ...assertItem.setCursor,
            });
            SpatialProfileData = await Connection.receive(CARTA.SpatialProfileData);
        });

        test(`Assert SpatialProfileData.value`, () => {
            expect(SpatialProfileData.value).toBeCloseTo(7.8840599, assertItem.precisionDigit);
        });

        test(`Assert backend is still alive`, () => {
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        });
    });
    afterAll(() => Connection.close());
});