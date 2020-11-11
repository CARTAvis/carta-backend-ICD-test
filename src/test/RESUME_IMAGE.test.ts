import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let resumeTimeout = config.timeout.resume;
let renderTimeout = config.timeout.renderImages;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    precisionDigits: number;
    resumeSession?: CARTA.IResumeSession;
    resumeSessionAck?: CARTA.IResumeSessionAck;
    addRequiredTiles?: CARTA.IAddRequiredTiles[];
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
                },
                {
                    directory: testSubdirectory,
                    file: "M17_SWex.image",
                    fileId: 1,
                    hdu: "",
                    renderMode: CARTA.RenderMode.RASTER,
                    channel: 0,
                    stokes: 0,
                },
            ]
    },
    resumeSessionAck:
    {
        success: true,
        message: "",
    },
    addRequiredTiles: [
        {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 1,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    ],
}

describe("RESUME IMAGE: Test to resume images", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
    }, connectTimeout);

    describe(`Resume Images`, () => {
        beforeAll(async () => {
            await Connection.registerViewer(assertItem.register);
        }, connectTimeout);

        let Ack: AckStream;
        test(`2 REGION_HISTOGRAM_DATA & RESUME_SESSION_ACK should arrive within ${resumeTimeout} ms`, async () => {
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

    describe(`Resume Images again`, () => {
        beforeAll(async () => {
            await Connection.registerViewer(assertItem.register); await Connection.send(CARTA.ResumeSession, assertItem.resumeSession);
            await Connection.streamUntil(type => type == CARTA.ResumeSessionAck);
        }, connectTimeout);

        assertItem.resumeSession.images.map((image, index) => {
            test(`Try to render file ID ${image.fileId}`, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[index]);
                await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            }, renderTimeout);
        });


    });
    afterAll(() => Connection.close());
});