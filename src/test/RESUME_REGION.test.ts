import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let resumeTimeout = config.timeout.resume;
let regionTimeout = config.timeout.region;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    precisionDigits: number;
    resumeSession?: CARTA.IResumeSession;
    resumeSessionAck?: CARTA.IResumeSessionAck;
    setStatsRequirements: CARTA.ISetStatsRequirements[];
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
                            controlPoints: [{ x: 250, y: 350 }, { x: 80, y: 60 }],
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
                            controlPoints: [{ x: 350, y: 250 }, { x: 60, y: 80 }],
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
    setStatsRequirements: [
        {
            fileId: 0,
            regionId: 1,
            stats: [0, 1, 2,],
        },
        {
            fileId: 1,
            regionId: 2,
            stats: [0, 1, 2,],
        },
    ],
}

describe("RESUME REGION: Test to resume regions", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
    }, connectTimeout);

    describe(`Resume Regions`, () => {
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

    describe(`Resume Regions again`, () => {
        beforeAll(async () => {
            await Connection.registerViewer(assertItem.register);
            await Connection.send(CARTA.ResumeSession, assertItem.resumeSession);
            await Connection.streamUntil(type => type == CARTA.ResumeSessionAck);
        }, resumeTimeout);

        assertItem.setStatsRequirements.map(stats => {
            test(`Try to request stats of region ${stats.regionId}`, async () => {
                await Connection.send(CARTA.SetStatsRequirements, stats);
                await Connection.receive(CARTA.RegionStatsData);
            }, regionTimeout);
        });
    });

    afterAll(() => Connection.close());
});