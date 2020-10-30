import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
var W3CWebSocket = require('websocket').w3cwebsocket;

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.moment;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile

interface ISpectralLineResponseExt extends CARTA.ISpectralLineResponse {
    lengthOfheaders: number;
    speciesOfline: string;
}

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setSpectralLineReq: CARTA.ISpectralLineRequest[];
    SpectraLineResponse: CARTA.ISpectralLineResponseExt[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "HD163296_13CO_2-1.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 216, y: 216 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
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
        },
        {
            success: true,
            dataSize: 203,
            lengthOfheaders: 19,
            speciesOfline: "Carbon Monoxide",
        },
    ],
};

describe("Test for Close one file:", () => {

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

    afterAll(() => Connection.close());
});