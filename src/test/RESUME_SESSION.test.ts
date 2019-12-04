import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let resumeTimeout = config.timeout.resume;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    precisionDigits: number;
    resumeSession?: CARTA.IResumeSession;
    resumeSessionAck?: CARTA.IResumeSessionAck;
    openFileAck?: CARTA.IOpenFileAck[];
    setRegionAck?: CARTA.ISetRegionAck[];
}
let assertItem: AssertItem = {
    registerViewer: {
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
                tileSize: 256,
                channel: 0,
                stokes: 0,
                regions:
                [
                    {
                        regionId: 1,
                        regionInfo: {                            
                            regionName: "",
                            regionType: CARTA.RegionType.RECTANGLE,
                            controlPoints: [{x: 276.066, y: 377.278}, {x: 84.8485, y: 68.6869}],
                            rotation: 0,
                        },
                    },
                ],
            },
            {
                directory: testSubdirectory, 
                file: "M17_SWex.image",
                fileId: 1,
                hdu: "",
                renderMode: CARTA.RenderMode.RASTER,
                tileSize: 256,
                channel: 0,
                stokes: 0,
                regions:
                [
                    {
                        regionId: 2,
                        regionInfo: {                            
                            regionName: "",
                            regionType: CARTA.RegionType.RECTANGLE,
                            controlPoints: [{x: 276.066, y: 385.359}, {x: 82.8283, y: 64.6465}],
                            rotation: 0,
                        },
                    },
                ],
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

describe("RESUME SESSION test: Test to resume images and regions", () => {   
    let Connection: WebSocket;
    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.registerViewer);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {

        beforeAll( async () => {
        });

        describe(`RESUME_SESSION`, () => {
            let Ack: Utility.AckStream;
            test(`OPEN_FILE_ACK & SET_REGION_ACK & RESUME_SESSION_ACK should arrive within ${resumeTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.ResumeSession, assertItem.resumeSession);
                Ack = await Utility.getStreamAsync(Connection, 3) as Utility.AckStream;
            }, resumeTimeout);

            test(`RESUME_SESSION_ACK.success = ${assertItem.resumeSessionAck.success}`, () => {
                expect(Ack.ResumeSessionAck[0].success).toBe(assertItem.resumeSessionAck.success);
                if (Ack.ResumeSessionAck[0].message) {
                    console.warn(`RESUME_SESSION_ACK error message: 
                        ${Ack.ResumeSessionAck[0].message}`);
                }
            });


        });

    });

    afterAll( () => Connection.close());
});