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
            dataSize: 75718,
            lengthOfheaders: 19,
            speciesOfline1st: "HOCH2CN",
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: "420000.32970",
            speciesOflineLast: "CH2CDCN",
            speciesOflineIndexLast: 75717,
            freqSpeciesOflineLast: "439999.26740",
        },
        {
            success: true,
            dataSize: 100000,
            lengthOfheaders: 19,
            speciesOfline1st: "HOCH2CN",
            speciesOflineIndex1st: 0,
            freqSpeciesOfline1st: "420000.32970",
            speciesOflineLast: "c-H2COCH2",
            speciesOflineIndexLast: 99999,
            freqSpeciesOflineLast: "430883.86380",
        },
    ],
};

async function delay(milliseconds: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

assertItem.setSpectralLineReq.map((request, index) => {
    describe(`(Case ${index}: Line intensity lower limit = ${assertItem.setSpectralLineReq[index].lineIntensityLowerLimit}) between 420GHz and 440GHz |`, () => {
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

        describe("Query the spectral line directly with a wide freq range:", () => {
            let response: AckStream;
            let response2: any;
            test(`(Step 1) Sent & return SPECTRAL_LINE_RESPONSE within ${spectralLineRequest}ms`, async () => {
                await Connection.send(CARTA.SpectralLineRequest, request);
                response = await Connection.streamUntil(type => type == CARTA.SpectralLineResponse);
                response2 = response.SpectralLineResponse[0]
            }, spectralLineRequest);

            test(`(Step 2)Check information & total number = ${assertItem.SpectraLineResponse[index].dataSize}`, () => {
                if (response2 != undefined && response2.dataSize === assertItem.SpectraLineResponse[index].dataSize) {
                    expect(response2.success).toEqual(assertItem.SpectraLineResponse[index].success);
                    expect(response2.dataSize).toEqual(assertItem.SpectraLineResponse[index].dataSize);
                    expect(response2.headers.length).toEqual(assertItem.SpectraLineResponse[index].lengthOfheaders);
                    expect(response2.spectralLineData[0].stringData.length).toEqual(assertItem.SpectraLineResponse[index].dataSize)
                } else {
                    console.warn("Does not receive proper SpectralLineResponse")
                }
            });

            test(`(Step 3)Check the information of two molecular species (one is near the 1st another is near the last)`,async()=>{
                if (response2 != undefined && response2.dataSize === assertItem.SpectraLineResponse[index].dataSize) {
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
                } else {
                    console.warn("Does not receive proper SpectralLineResponse")
                };
            })
        });
        afterAll(() => Connection.close());
    });
});