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
                    regions: {
                        "1": {
                            regionType: CARTA.RegionType.RECTANGLE,
                            controlPoints: [{ x: 276.066, y: 377.278 }, { x: 84.8485, y: 68.6869 }],
                            rotation: 0,
                        },
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
                    regions: {
                        "2": {
                            regionType: CARTA.RegionType.RECTANGLE,
                            controlPoints: [{ x: 276.066, y: 377.278 }, { x: 84.8485, y: 68.6869 }],
                            rotation: 0,
                        },
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

describe("RESUME REGION: Test to resume regions", () => {
    let Connection: Client;
    beforeEach(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        let ack = await Connection.receiveAny();
        expect(ack.constructor.name).toEqual(CARTA.RegisterViewerAck.name);
    }, connectTimeout);

    describe(`Resume Regions`, () => {
        let Ack: AckStream;
        test(`2 REGION_HISTOGRAM_DATA & RESUME_SESSION_ACK should arrive within ${resumeTimeout} ms`, async () => {
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

    describe(`Resume Regions again`, () => {
        let Ack: AckStream;
        test(`2 REGION_HISTOGRAM_DATA & RESUME_SESSION_ACK should arrive within ${resumeTimeout} ms`, async () => {
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