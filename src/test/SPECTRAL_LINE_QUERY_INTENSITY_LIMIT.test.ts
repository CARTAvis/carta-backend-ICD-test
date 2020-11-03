import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
var W3CWebSocket = require('websocket').w3cwebsocket;

let testServerUrl: string = config.serverURL;
let connectTimeout: number = config.timeout.connection;
let spectralLineRequest: number = config.timeout.spectralLineRequest;

interface ISpectralLineResponseExt extends CARTA.ISpectralLineResponse {
    lengthOfheaders: number;
    speciesOfline1st: string;
    speciesOflineIndex1st: number;
    freqSpeciesOfline1st: string;
    speciesOflineLast: string;
    speciesOflineIndexLast: number;
    freqSpeciesOflineLast: string;
}

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
            frequencyRange: { min: 230500, max: 230600 },
            lineIntensityLowerLimit: NaN,
        },
        {
            frequencyRange: { min: 230500, max: 230600 },
            lineIntensityLowerLimit: -7,
        },
        {
            frequencyRange: { min: 230500, max: 230600 },
            lineIntensityLowerLimit: -5,
        },
        {
            frequencyRange: { min: 230500, max: 230600 },
            lineIntensityLowerLimit: -3,
        },
        {
            frequencyRange: { min: 230500, max: 230600 },
            lineIntensityLowerLimit: -0.01,
        },
        {
            frequencyRange: { min: 230500, max: 230600 },
            lineIntensityLowerLimit: 0,
        },
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
        {
            success: true,
            dataSize: 303,
            lengthOfheaders: 19,
            speciesOfline1st: "CH3CHNH2COOH-I",
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: "230500.38600",
            speciesOflineLast: "NH2CO2CH3v=1",
            speciesOflineIndexLast: 302,
            freqSpeciesOflineLast: "230599.22700",
        },
        {
            success: true,
            dataSize: 18,
            lengthOfheaders: 19,
            speciesOfline1st: "30SiC2",
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: "230509.08430",
            speciesOflineLast: "c-C3H5CN",
            speciesOflineIndexLast: 17,
            freqSpeciesOflineLast: "230588.61690",
        },
        {
            success: true,
            dataSize: 0,
            lengthOfheaders: 19,
            speciesOfline1st: undefined,
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: undefined,
            speciesOflineLast: undefined,
            speciesOflineIndexLast: 0,
            freqSpeciesOflineLast: undefined,
        },
        {
            success: true,
            dataSize: 0,
            lengthOfheaders: 19,
            speciesOfline1st: undefined,
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: undefined,
            speciesOflineLast: undefined,
            speciesOflineIndexLast: 0,
            freqSpeciesOflineLast: undefined,
        },
    ]
};


describe("Query the spectral line directly:", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(W3CWebSocket.OPEN);
    });

    assertItem.setSpectralLineReq.map((request, index) => {
        describe(`(Case ${index}: Line intensity lower limit = ${assertItem.setSpectralLineReq[index].lineIntensityLowerLimit})`, () => {
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
                expect(response.spectralLineData[0].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndex1st]).toEqual(assertItem.SpectraLineResponse[index].speciesOfline1st);
                expect(response.spectralLineData[2].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndex1st]).toEqual(assertItem.SpectraLineResponse[index].freqSpeciesOfline1st);
                expect(response.spectralLineData[0].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndexLast]).toEqual(assertItem.SpectraLineResponse[index].speciesOflineLast);
                expect(response.spectralLineData[2].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndexLast]).toEqual(assertItem.SpectraLineResponse[index].freqSpeciesOflineLast);
            });
        });

    });

    afterAll(() => Connection.close());
});