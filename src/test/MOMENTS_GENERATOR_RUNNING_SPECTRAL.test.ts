import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let momentTimeout = config.timeout.moment;
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    momentRequest: CARTA.IMomentRequest;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
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
        moments: [0, 1,],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 73, max: 114 },
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 0,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
};

describe("MOMENTS_GENERATOR_RUNNING_SPECTRAL: Testing moments generator while requesting spectral profile", () => {
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
    describe(`Moment generator after starting spectral profile`, () => {
        let MomentProgress: CARTA.MomentProgress[] = [];
        let MomentResponse: CARTA.MomentResponse;
        let SpectralProfileData: CARTA.SpectralProfileData;
        test(`Receive a series messages`, async () => {
            let ack;
            await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest);
            do {
                ack = await Connection.receiveAny();
                switch (ack.constructor.name) {
                    // case "SpectralProfileData":
                    //     SpectralProfileData = ack;
                    //     break;
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

        test(`Assert a SpectralProfileData.progress = 1`, async () => {
            SpectralProfileData = await Connection.receive(CARTA.SpectralProfileData);
            expect(SpectralProfileData.progress).toEqual(1);
        }, momentTimeout);
    });

    afterAll(() => Connection.close());
});