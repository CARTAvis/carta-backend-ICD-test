import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

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
            dataSize: 1034,
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
            dataSize: 789,
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
            dataSize: 310,
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
            dataSize: 21,
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

assertItem.setSpectralLineReq.map((request, index) => {
    describe(`(Case ${index}: Line intensity lower limit = ${assertItem.setSpectralLineReq[index].lineIntensityLowerLimit})`, () => {
        let Connection: Client;
        beforeAll(async()=>{
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        test(`(Step 0) Connection open? | `,async()=>{
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        })

        describe(`Query the spectral line directly:`,()=>{
            let response: AckStream;
            let response2: any;
            test(`(Step 1) Sent & return SPECTRAL_LINE_RESPONSE within ${spectralLineRequest}ms`, async () => {
                await Connection.send(CARTA.SpectralLineRequest, request);
                response = await Connection.streamUntil(type => type == CARTA.SpectralLineResponse);
                response2 = response.SpectralLineResponse[0]
                // console.log(response2.success)
            }, spectralLineRequest);

            test(`(Step 2)Check information & total number = ${assertItem.SpectraLineResponse[index].dataSize}`, () => {
                if (response2 != undefined && response2.dataSize === assertItem.SpectraLineResponse[index].dataSize) {
                    expect(response2.success).toEqual(assertItem.SpectraLineResponse[index].success);
                    expect(response2.dataSize).toEqual(assertItem.SpectraLineResponse[index].dataSize);
                    expect(response2.headers.length).toEqual(assertItem.SpectraLineResponse[index].lengthOfheaders);
                    expect(response2.spectralLineData[0].stringData.length).toEqual(assertItem.SpectraLineResponse[index].dataSize)
                } else {
                    console.warn("Does not receive proper SpectralLineResponse");
                    expect(response2.dataSize).toEqual(assertItem.SpectraLineResponse[index].dataSize);
                }
            });

            test(`(Step 3)Check the information of the first and the last molecular species`,async()=>{
                if (response2 != undefined && response2.dataSize === assertItem.SpectraLineResponse[index].dataSize) {
                    if (index == 4 || index == 5){
                        expect(response2.spectralLineData[0].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndex1st]).toEqual(assertItem.SpectraLineResponse[index].speciesOfline1st);
                        expect(response2.spectralLineData[2].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndex1st]).toEqual(assertItem.SpectraLineResponse[index].freqSpeciesOfline1st);
                        expect(response2.spectralLineData[0].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndexLast]).toEqual(assertItem.SpectraLineResponse[index].speciesOflineLast);
                        expect(response2.spectralLineData[2].stringData[assertItem.SpectraLineResponse[index].speciesOflineIndexLast]).toEqual(assertItem.SpectraLineResponse[index].freqSpeciesOflineLast);
                    } else {
                        // check at least two molecules freq inside a returned array
                    expect(response2.spectralLineData[2].stringData).toEqual(expect.arrayContaining([assertItem.SpectraLineResponse[index].freqSpeciesOfline1st]));
                    expect(response2.spectralLineData[2].stringData).toEqual(expect.arrayContaining([assertItem.SpectraLineResponse[index].freqSpeciesOflineLast]));
                    // find the index of these two molecules freq
                    const is1st = (element) => element ===  assertItem.SpectraLineResponse[index].freqSpeciesOfline1st;
                    let tar1Index = response2.spectralLineData[2].stringData.findIndex(is1st);
                    const islast = (element) => element ===  assertItem.SpectraLineResponse[index].freqSpeciesOflineLast;
                    let tarlastIndex = response2.spectralLineData[2].stringData.findIndex(islast);
                    // matching these two molecules' name
                    expect(response2.spectralLineData[0].stringData[tar1Index]).toMatch(assertItem.SpectraLineResponse[index].speciesOfline1st)
                    expect(response2.spectralLineData[0].stringData[tarlastIndex]).toMatch(assertItem.SpectraLineResponse[index].speciesOflineLast)
                    }
                } else {
                    console.warn("Does not receive proper SpectralLineResponse");
                    expect(response2.dataSize).toEqual(assertItem.SpectraLineResponse[index].dataSize);
                };
            })
        })
        afterAll(() => Connection.close());
    });
});