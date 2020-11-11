import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile
let spectralLineRequest: number = config.timeout.spectralLineRequestWide;

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
            frequencyRange: { min: 420000, max: 440000 },
            lineIntensityLowerLimit: -5,
        },
        {
            frequencyRange: { min: 420000, max: 440000 },
            lineIntensityLowerLimit: NaN,
        },
    ],
    SpectraLineResponse: [
        {
            success: true,
            dataSize: 75686,
            lengthOfheaders: 19,
            speciesOfline1st: "HOCH2CN",
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: "420000.32970",
            speciesOflineLast: "CH2CDCN",
            speciesOflineIndexLast: 75685,
            freqSpeciesOflineLast: "439999.26740",
        },
        {
            success: true,
            dataSize: 100000,
            lengthOfheaders: 19,
            speciesOfline1st: "HOCH2CN",
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: "420000.32970",
            speciesOflineLast: "NH2CH2CH2OHv26=1",
            speciesOflineIndexLast: 99999,
            freqSpeciesOflineLast: "430886.07520",
        },
    ],
};

async function delay(milliseconds: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

describe("Query the spectral line directly with a wide freq range:", () => {

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

    assertItem.setSpectralLineReq.map((request, index) => {
        describe(`(Case ${index}: Line intensity lower limit = ${assertItem.setSpectralLineReq[index].lineIntensityLowerLimit}) between 420GHz and 440GHz |`, () => {
            let response: CARTA.SpectralLineResponse;
            test(`Sent & return SPECTRAL_LINE_RESPONSE within ${spectralLineRequest}ms`, async () => {
                await Connection.send(CARTA.SpectralLineRequest, request);
                response = await Connection.receive(CARTA.SpectralLineResponse);
            }, spectralLineRequest);

            test(`Check information & total number = ${assertItem.SpectraLineResponse[index].dataSize}`, () => {
                expect(response.success).toEqual(assertItem.SpectraLineResponse[index].success);
                expect(response.dataSize).toEqual(assertItem.SpectraLineResponse[index].dataSize);
                expect(response.headers.length).toEqual(assertItem.SpectraLineResponse[index].lengthOfheaders);
                let properties = Object.keys(response.spectralLineData);
                properties.map((num, index2) => {
                    expect(response.spectralLineData[0].stringData.length).toEqual(assertItem.SpectraLineResponse[index].dataSize)
                });
            });

            test(`Check the information of the first and the last molecular species`, () => {
                // console.log(response.spectralLineData[0].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndex1st])
                // console.log(response.spectralLineData[2].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndex1st])
                // console.log(response.spectralLineData[0].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndexLast])
                // console.log(response.spectralLineData[2].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndexLast])
                expect(response.spectralLineData[0].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndex1st]).toEqual(assertItem.SpectraLineResponse[index].speciesOfline1st);
                expect(response.spectralLineData[2].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndex1st]).toEqual(assertItem.SpectraLineResponse[index].freqSpeciesOfline1st);
                expect(response.spectralLineData[0].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndexLast]).toEqual(assertItem.SpectraLineResponse[index].speciesOflineLast);
                expect(response.spectralLineData[2].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndexLast]).toEqual(assertItem.SpectraLineResponse[index].freqSpeciesOflineLast);
            });
        });

    });

    afterAll(() => Connection.close());
});