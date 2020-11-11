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
    setImageChannels: CARTA.ISetImageChannels;
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
                            1.5, 2.0, 2.5, 3.0,
                            3.5, 4.0, 4.5, 5.0,
                            5.5, 6.0, 6.5, 7.0,
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
    setImageChannels: {
        fileId: 0,
        channel: 1,
        stokes: 0,
        // requiredTiles: {
        //     fileId: 0,
        //     compressionQuality: 11,
        //     compressionType: CARTA.CompressionType.ZFP,
        //     tiles: [0],
        // },
    },
}

describe("RESUME CONTOUR: Test to resume contour lines", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
    }, connectTimeout);

    describe(`Resume Contours`, () => {
        beforeAll(async () => {
            await Connection.registerViewer(assertItem.register);
        }, connectTimeout);

        let Ack: AckStream;
        test(`REGION_HISTOGRAM_DATA & RESUME_SESSION_ACK should arrive within ${resumeTimeout} ms`, async () => {
            await Connection.send(CARTA.ResumeSession, assertItem.resumeSession);
            Ack = await Connection.streamUntil(type => type == CARTA.ResumeSessionAck);
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

    describe(`Resume Regions again and change channel`, () => {
        beforeAll(async () => {
            await Connection.registerViewer(assertItem.register);
            await Connection.send(CARTA.ResumeSession, assertItem.resumeSession);
            await Connection.streamUntil(type => type == CARTA.ResumeSessionAck);
        }, resumeTimeout);

        test(`Receive ${assertItem.resumeSession.images[0].contourSettings.levels.length} set of contour lines`, async () => {
            await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannels);
            await Connection.streamUntil((type, data, ack) => ack.ContourImageData.length == 12);
        });
    });
    afterAll(() => Connection.close());
});