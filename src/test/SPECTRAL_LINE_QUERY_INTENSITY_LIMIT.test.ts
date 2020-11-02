import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
var W3CWebSocket = require('websocket').w3cwebsocket;

let testServerUrl: string = config.serverURL;
let connectTimeout: number = config.timeout.connection;
let spectralLineRequest: number = config.timeout.spectralLineRequest;


interface ISpectralLineResponseExt extends CARTA.ISpectralLineResponse {
    lengthOfheaders: number;
    speciesOfline: string;
    speciesOflineIndex: number;
    freqSpeciesOfline: string;
}

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
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
            lineIntensityLowerLimit: -10,
        },
        {
            frequencyRange: { min: 220350, max: 220400 },
            lineIntensityLowerLimit: -5,
        },
    ],
    SpectraLineResponse: [
        {
            success: true,
            dataSize: 919,
            lengthOfheaders: 19,
            speciesOfline: "COv=0",
            speciesOflineIndex: 351,
            freqSpeciesOfline: "230538.00000",
        },
        {
            success: true,
            dataSize: 203,
            lengthOfheaders: 19,
            speciesOfline: "Carbon Monoxide",
            speciesOflineIndex: 200,
            freqSpeciesOfline: "220398.68420",
        },
    ]
};


describe("[Case 1] Open an image, and then query the spectral line (line freq does not match image's freq):", () => {

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

    test(`(Step 3) return SPECTRAL_LINE_RESPONSE within ${spectralLineRequest}ms and check response:`, async () => {
        await Connection.send(CARTA.SpectralLineRequest, assertItem.setSpectralLineReq[0]);
        let response = await Connection.receive(CARTA.SpectralLineResponse);
        // console.log(response)
        expect(response.success).toEqual(assertItem.SpectraLineResponse[0].success);
        expect(response.dataSize).toEqual(assertItem.SpectraLineResponse[0].dataSize);
        expect(response.headers.length).toEqual(assertItem.SpectraLineResponse[0].lengthOfheaders);
        let properties = Object.keys(response.spectralLineData);
        properties.map((num, index) => {
            expect(response.spectralLineData[index].stringData.length).toEqual(assertItem.SpectraLineResponse[0].dataSize)
        });
        expect(response.spectralLineData[0].stringData[assertItem.SpectraLineResponse[0].speciesOflineIndex]).toEqual(assertItem.SpectraLineResponse[0].speciesOfline);
        expect(response.spectralLineData[5].stringData[assertItem.SpectraLineResponse[0].speciesOflineIndex]).toEqual(assertItem.SpectraLineResponse[0].freqSpeciesOfline);
    }, spectralLineRequest);

    afterAll(() => Connection.close());
});