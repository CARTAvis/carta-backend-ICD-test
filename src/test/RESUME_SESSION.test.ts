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
    SetRegionAck?: CARTA.ISetRegionAck[];
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
    openFileAck:
    [
        {
            success: true,
        },
        {
            success: true,
        },
    ],
    SetRegionAck:
    [
        {
            success: true,
        },
        {
            success: true,
        },
    ],
}

describe("RESUME_SESSION test: Test to resume images and regions", () => {   
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

        describe(`RESUME SESSION`, () => {
            let OpenFileAckTemp: CARTA.OpenFileAck[];
            let SetRegionAckTemp: CARTA.SetRegionAck[];
            let ResumeSessionAckTemp: CARTA.ResumeSessionAck;
            test(`OPEN_FILE_ACK & SET_REGION_ACK & RESUME SESSION should arrive within ${resumeTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.ResumeSession, assertItem.resumeSession);
                OpenFileAckTemp[0] = await Utility.getEventAsync(Connection, CARTA.OpenFileAck) as CARTA.OpenFileAck;
                SetRegionAckTemp[0] = await Utility.getEventAsync(Connection, CARTA.SetRegionAck) as CARTA.SetRegionAck;
                OpenFileAckTemp[1] = await Utility.getEventAsync(Connection, CARTA.OpenFileAck) as CARTA.OpenFileAck;
                SetRegionAckTemp[1] = await Utility.getEventAsync(Connection, CARTA.SetRegionAck) as CARTA.SetRegionAck;
                ResumeSessionAckTemp = await Utility.getEventAsync(Connection, CARTA.ResumeSessionAck) as CARTA.ResumeSessionAck;
            }, resumeTimeout);

            assertItem.openFileAck.map( (openFile, index) => {
                test(`OPEN_FILE_ACK.success = ${openFile.success}`, () => {
                    expect(OpenFileAckTemp[index].success).toBe(openFile.success);
                });
                test(`SET_REGION_ACK.success = ${assertItem.SetRegionAck[index].success}`, () => {
                    expect(SetRegionAckTemp[index].success).toBe(assertItem.SetRegionAck[index].success);
                });
            });

            test(`RESUME SESSION.success = ${assertItem.resumeSessionAck.success}`, () => {
                expect(ResumeSessionAckTemp.success).toBe(assertItem.resumeSessionAck.success);
            });

        });

    });

    afterAll( () => Connection.close());
});