import { CARTA } from "carta-protobuf";
import { Client, AckStream, Wait } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;
let momentTimeout = config.timeout.momentLargeCube;
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    setRegion: CARTA.ISetRegion;
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
        file: "S255_IR_sci.spw29.cube.I.pbcor.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 1,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
    setRegion: {
        fileId: 0,
        regionId: 1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 900, y: 900 }, { x: 600.0, y: 600.0 }],
            rotation: 0,
        },
    },
    momentRequest: {
        fileId: 0,
        regionId: 1,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0],
        pixelRange: { min: 0.2, max: 1.0 },
        spectralRange: { min: 950, max: 1100 },
    },
};

describe("MOMENTS_GENERATOR_PROFILE_STREAM: Testing moments generator while streaming spectral profile", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Preparation`, () => {
        test(`Open image ${assertItem.openFile.file}`, async () => {
            await Connection.openFile(assertItem.openFile);
        }, readFileTimeout);
        test(`Set region`, async () => {
            await Connection.send(CARTA.SetRegion, assertItem.setRegion);
            await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
            await Connection.receiveAny();
        }, regionTimeout);
        test(`Request spectral profile data till get 2 SpectralProfileData`, async () => {
            await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
            let ack = await Connection.streamUntil((type, data, ack) => ack.SpectralProfileData.length == 2) as AckStream;
            expect(ack.SpectralProfileData.slice(-1)[0].progress).toBeLessThan(1);
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest);
        }, readFileTimeout);
    });

    let FileId: number[] = [];
    describe(`Moment generator after starting spectral profile`, () => {
        let ack: AckStream;
        test(`Request moment image and receive a few SpectralProfileData`, async () => {
            ack = await Connection.streamUntil(type => type == CARTA.MomentResponse);
            FileId = ack.RegionHistogramData.map(data => data.fileId);
            expect(ack.SpectralProfileData.length).toBeLessThanOrEqual(2);
            if (ack.SpectralProfileData.length > 0) {
                expect(ack.SpectralProfileData.slice(-1)[0].progress).toBeLessThan(1);
            }
        }, momentTimeout);

        test(`Assert all MomentProgress.progress < 1`, () => {
            ack.MomentProgress.map(ack => {
                expect(ack.progress).toBeLessThan(1);
            });
        });

        test(`Receive ${assertItem.momentRequest.moments.length} REGION_HISTOGRAM_DATA`, () => {
            expect(FileId.length).toEqual(assertItem.momentRequest.moments.length);
        });

        test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest.moments.length}`, () => {
            expect(ack.MomentResponse[0].openFileAcks.length).toEqual(assertItem.momentRequest.moments.length);
        });

        test(`Assert all MomentResponse.openFileAcks[].success = true`, () => {
            ack.MomentResponse[0].openFileAcks.map(ack => {
                expect(ack.success).toBe(true);
            });
        });

        test(`Assert all MomentResponse.openFileAcks[].fileId > 0`, () => {
            ack.MomentResponse[0].openFileAcks.map(ack => {
                expect(ack.fileId).toBeGreaterThan(0);
            });
        });

        test(`Receive any message until a SpectralProfileData.progress = 1`, async () => {
            await Connection.streamUntil((type, data) => type == CARTA.SpectralProfileData && data.progress == 1);
        }, momentTimeout);
    });

    afterAll(() => Connection.close());
});