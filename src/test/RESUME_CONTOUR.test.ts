import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let resumeTimeout = config.timeout.resume;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    precisionDigits: number;
    resumeSession?: CARTA.IResumeSession;
    resumeSessionAck?: CARTA.IResumeSessionAck;
    openFileAck?: CARTA.IOpenFileAck[];
    setRegionAck?: CARTA.ISetRegionAck[];
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    precisionDigits: 4,
    resumeSession:
    {
        images:
            [
                {
                    directory: testSubdirectory,
                    file: "M17_SWex.fits",
                    fileId: 0,
                    hdu: "",
                    renderMode: CARTA.RenderMode.RASTER,
                    channel: 0,
                    stokes: 0,
                    contourSettings: {
                        fileId: 0,
                        referenceFileId: 0,
                        imageBounds: { xMin: 0, xMax: 800, yMin: 0, yMax: 800 },
                        levels: [
                            1.27, 2.0, 2.51, 3.0,
                            3.75, 4.0, 4.99, 5.2,
                            6.23, 6.6, 7.47, 7.8,
                            8.71, 9.0, 9.95, 10.2,
                        ],
                        smoothingMode: CARTA.SmoothingMode.GaussianBlur,
                        smoothingFactor: 4,
                        decimationFactor: 4,
                        compressionLevel: 8,
                        contourChunkSize: 100000,
                    },
                },
                {
                    directory: testSubdirectory,
                    file: "M17_SWex.image",
                    fileId: 1,
                    hdu: "",
                    renderMode: CARTA.RenderMode.RASTER,
                    channel: 0,
                    stokes: 0,
                    contourSettings: {
                        fileId: 0,
                        referenceFileId: 0,
                        imageBounds: { xMin: 0, xMax: 800, yMin: 0, yMax: 800 },
                        levels: [
                            1.27, 2.0, 2.51, 3.0,
                            3.75, 4.0, 4.99, 5.2,
                            6.23, 6.6, 7.47, 7.8,
                            8.71, 9.0, 9.95, 10.2,
                        ],
                        smoothingMode: CARTA.SmoothingMode.GaussianBlur,
                        smoothingFactor: 4,
                        decimationFactor: 4,
                        compressionLevel: 8,
                        contourChunkSize: 100000,
                    },
                },
            ]
    },
    resumeSessionAck:
    {
        success: true,
        message: "",
    },
    openFileAck:
        [
            {
                success: true,
            },
            {
                success: true,
            },
        ],
    setRegionAck:
        [
            {
                success: true,
            },
            {
                success: true,
            },
        ],
}

describe("RESUME SESSION IMAGE: Test to resume images", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        let ack = await Connection.receiveAny();
        expect(ack.constructor.name).toEqual(CARTA.RegisterViewerAck.name);
    }, connectTimeout);

    describe(`Resume Images`, () => {
        let Ack: AckStream;
        test(`Some REGION_HISTOGRAM_DATA & RESUME_SESSION_ACK should arrive within ${resumeTimeout} ms`, async () => {
            await Connection.send(CARTA.ResumeSession, assertItem.resumeSession);
            Ack = await Connection.stream(3) as AckStream;
        }, resumeTimeout);

        test(`RESUME_SESSION_ACK.success = ${assertItem.resumeSessionAck.success}`, () => {
            let ResumeSessionAckTemp = Ack.Responce.filter(r => r.constructor.name === "ResumeSessionAck")[0] as CARTA.ResumeSessionAck;
            expect(ResumeSessionAckTemp.success).toBe(assertItem.resumeSessionAck.success);
            if (ResumeSessionAckTemp.message) {
                console.warn(`RESUME_SESSION_ACK error message: 
                        ${ResumeSessionAckTemp.message}`);
            }
        });

    });

    afterAll(() => Connection.close());
});