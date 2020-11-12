import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.catalog;
let connectTimeout = config.timeout.connection;
let resumeTimeout = config.timeout.resume;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    precisionDigits: number;
    resumeSession?: CARTA.IResumeSession;
    resumeSessionAck?: CARTA.IResumeSessionAck;
    catalogFilterRequest: CARTA.ICatalogFilterRequest;
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
                    file: "model.fits",
                    fileId: 0,
                    hdu: "",
                    renderMode: CARTA.RenderMode.RASTER,
                    channel: 0,
                    stokes: 0,
                },
            ],
        catalogFiles: [
            {
                directory: testSubdirectory,
                name: "test_fk4.xml",
                fileId: 1,
                previewDataSize: 10,
            },
        ],
    },
    resumeSessionAck:
    {
        success: true,
        message: "",
    },
    catalogFilterRequest: {
        fileId: 1,
        columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        subsetStartIndex: 0,
        subsetDataSize: 6,
    },
}

describe("RESUME CATALOG: Test to resume catalog", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
    }, connectTimeout);

    describe(`Resume catalog`, () => {
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

    describe(`Resume catalog again`, () => {
        beforeAll(async () => {
            await Connection.registerViewer(assertItem.register);
            await Connection.send(CARTA.ResumeSession, assertItem.resumeSession);
            await Connection.streamUntil(type => type == CARTA.ResumeSessionAck);
        }, resumeTimeout);

        test(`Assert the CATALOG_FILTER_RESPONSE.columns.length = ${assertItem.catalogFilterRequest.columnIndices.length}`, async () => {
            await Connection.send(CARTA.CatalogFilterRequest, assertItem.catalogFilterRequest);
            let ack = await Connection.receive(CARTA.CatalogFilterResponse) as CARTA.CatalogFilterResponse;
            expect(Object.keys(ack.columns).length).toEqual(assertItem.catalogFilterRequest.columnIndices.length);
        });
    });
    afterAll(() => Connection.close());
});