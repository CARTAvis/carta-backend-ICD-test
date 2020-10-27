import { CARTA } from "carta-protobuf";

import { AckStream } from "action/CLIENT";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let momentTimeout = config.timeout.momentLargeCube;
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    setCursor: CARTA.ISetCursor;
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
        file: "SDC335.579-0.292.spw0.line.image",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 0,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
    setCursor: {
        point: { x: 150, y: 150 },
    },
    momentRequest: {
        fileId: 0,
        regionId: 0,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0],
        pixelRange: { min: 0.2, max: 1.0 },
        spectralRange: { min: 2100, max: 2200 },
    },
};

describe("MOMENTS_GENERATOR_PROFILE_STREAM: Testing moments generator while streaming spectral profile", () => {
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
        test(`Request spectral profile data till get 2 SpectralProfileData`, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
            let ack = await Connection.stream(2) as AckStream;
            expect(ack.SpectralProfileData.slice(-1)[0].progress).toBeLessThan(1);
        }, readFileTimeout);
    });

    let FileId: number[] = [];
    describe(`Moment generator after starting spectral profile`, () => {
        let MomentProgress: CARTA.MomentProgress[] = [];
        let MomentResponse: CARTA.MomentResponse;
        let SpectralProfileData: CARTA.SpectralProfileData[] = [];
        test(`Request moment image and receive a few SpectralProfileData`, async () => {
            let ack;
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest);
            do {
                ack = await Connection.receiveAny();
                switch (ack.constructor.name) {
                    case "SpectralProfileData":
                        SpectralProfileData.push(ack);
                        break;
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
            expect(SpectralProfileData.length).toBeLessThanOrEqual(2);
            expect(ack.SpectralProfileData.slice(-1)[0].progress).toBeLessThan(1);
        }, momentTimeout);

        test(`Assert all MomentProgress.progress < 1`, () => {
            MomentProgress.map(ack => {
                expect(ack.progress).toBeLessThan(1);
            });
        });

        test(`Receive ${assertItem.momentRequest.moments.length} REGION_HISTOGRAM_DATA`, () => {
            expect(FileId.length).toEqual(assertItem.momentRequest.moments.length);
        });

        test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest.moments.length}`, () => {
            expect(MomentResponse.openFileAcks.length).toEqual(assertItem.momentRequest.moments.length);
        });

        test(`Assert all MomentResponse.openFileAcks[].success = true`, () => {
            MomentResponse.openFileAcks.map(ack => {
                expect(ack.success).toBe(true);
            });
        });

        test(`Assert all MomentResponse.openFileAcks[].fileId > 0`, () => {
            MomentResponse.openFileAcks.map(ack => {
                expect(ack.fileId).toBeGreaterThan(0);
            });
        });

        test(`Receive any message until a SpectralProfileData.progress = 1`, async () => {
            let SpectralProfileData: CARTA.SpectralProfileData[] = [];
            let ack;
            do {
                ack = await Connection.receiveAny();
                switch (ack.constructor.name) {
                    case "SpectralProfileData":
                        SpectralProfileData.push(ack);
                        break;
                    default:
                        break;
                }
            } while (SpectralProfileData.slice(-1)[0].progress != 1);
        }, momentTimeout);
    });

    afterAll(() => Connection.close());
});