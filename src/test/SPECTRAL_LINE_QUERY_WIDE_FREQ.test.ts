import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile
let spectralLineRequest: number = 60000;//config.timeout.spectralLineRequest;

interface ISpectralLineResponseExt extends CARTA.ISpectralLineResponse {
    lengthOfheaders: number;
    speciesOfline1st: string;
    speciesOflineIndex1st: number;
    freqSpeciesOfline1st: string;
    speciesOflineLast: string;
    speciesOflineIndexLast: number;
    freqSpeciesOflineLast: string;
};

interface AssertItem {
    register: CARTA.IRegisterViewer;
    setSpectralLineReq: CARTA.ISpectralLineRequest[];
    SpectraLineResponse: CARTA.ISpectralLineResponseExt[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    setSpectralLineReq: [
        {
            frequencyRange: { min: 230000, max: 240000 },
            lineIntensityLowerLimit: NaN,
        },
        // {
        //     frequencyRange: { min: 420000, max: 440000 },
        //     lineIntensityLowerLimit: -5,
        // },
    ],
    SpectraLineResponse: [
        {
            success: true,
            dataSize: 1013,
            lengthOfheaders: 19,
            speciesOfline1st: "gGG'g-CH2OHCH2CH2OH",
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: "230500.05580",
            speciesOflineLast: "t-H13COOH",
            speciesOflineIndexLast: 1012,
            freqSpeciesOflineLast: "230599.28000",
        },
        {
            success: true,
            dataSize: 771,
            lengthOfheaders: 19,
            speciesOfline1st: "gGG'g-CH2OHCH2CH2OH",
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: "230500.05580",
            speciesOflineLast: "NH2CO2CH3v=1",
            speciesOflineIndexLast: 770,
            freqSpeciesOflineLast: "230599.22700",
        },
    ],
};

async function delay(milliseconds: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

describe("Query the spectral line directly:", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);


    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });


    test(`(Step 3) return SPECTRAL_LINE_RESPONSE within ${spectralLineRequest}ms and check response:`, async () => {
        await Connection.send(CARTA.SpectralLineRequest, assertItem.setSpectralLineReq[0]);
        let response = await Connection.receive(CARTA.SpectralLineResponse);
        console.log(response)
    }, spectralLineRequest);

    // afterAll(() => Connection.close());
});