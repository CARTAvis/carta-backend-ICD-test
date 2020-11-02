import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
var W3CWebSocket = require('websocket').w3cwebsocket;

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.moment;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile
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
    setRegion: CARTA.ISetRegion;
    regionAck: CARTA.ISetRegionAck;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
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
    setRegion:
    {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 214.0, y: 227.0 }, { x: 237.0, y: 252.0 }],
            rotation: 0.0,
        }
    },
    regionAck:
    {
        success: true,
        regionId: 1,
    },
    setSpectralRequirements:
    {
        fileId: 0,
        regionId: 1,
        spectralProfiles: [
            {
                coordinate: "z",
                statsTypes: [
                    CARTA.StatsType.Mean,
                ],
            }
        ],
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
    ],
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

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
        let OpenAck = await Connection.receive(CARTA.OpenFileAck)
        await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
        expect(OpenAck.success).toBe(true)
        expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen.file)
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        ack = await Connection.stream(5, 2500) as AckStream;
        expect(ack.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length) //only 1 Tile returned
    }, readFileTimeout);

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

describe("[Case 2] Open an image, set a region then ask the spectral profiler, then query the spectral line.:", () => {

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

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
        let OpenAck = await Connection.receive(CARTA.OpenFileAck)
        await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
        expect(OpenAck.success).toBe(true)
        expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen.file)
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        ack = await Connection.stream(5, 2500) as AckStream;
        expect(ack.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length) //only 1 Tile returned
    }, readFileTimeout);

    let SetRegionAckTemp: CARTA.SetRegionAck;
    let SpectralProfileDataTemp: CARTA.SpectralProfileData;
    let ReceiveProgress: number;
    test(`(Step 3) Set REGION & SPECTRAL_PROFILE streaming until progress=1:`, async () => {
        // Set REGION
        await Connection.send(CARTA.SetRegion, assertItem.setRegion);
        SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck);
        expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAck.regionId)
        expect(SetRegionAckTemp.success).toEqual(assertItem.regionAck.success)

        //Set SPECTRAL_PROFILE streaming
        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
        SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
        ReceiveProgress = SpectralProfileDataTemp.progress;
        if (ReceiveProgress != 1) {
            while (ReceiveProgress <= 1) {
                SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                ReceiveProgress = SpectralProfileDataTemp.progress
                console.warn('' + assertItem.fileOpen.file + ' SPECTRAL_PROFILE progress :', ReceiveProgress)
            };
        };
    });

    test(`(Step 4) return SPECTRAL_LINE_RESPONSE within ${spectralLineRequest}ms and check response:`, async () => {
        await Connection.send(CARTA.SpectralLineRequest, assertItem.setSpectralLineReq[1]);
        let response = await Connection.receive(CARTA.SpectralLineResponse);
        // console.log(response)
        expect(response.success).toEqual(assertItem.SpectraLineResponse[1].success);
        expect(response.dataSize).toEqual(assertItem.SpectraLineResponse[1].dataSize);
        expect(response.headers.length).toEqual(assertItem.SpectraLineResponse[1].lengthOfheaders);
        let properties = Object.keys(response.spectralLineData);
        properties.map((num, index) => {
            expect(response.spectralLineData[index].stringData.length).toEqual(assertItem.SpectraLineResponse[1].dataSize)
        });
        expect(response.spectralLineData[1].stringData[assertItem.SpectraLineResponse[1].speciesOflineIndex]).toEqual(assertItem.SpectraLineResponse[1].speciesOfline);
        expect(response.spectralLineData[2].stringData[assertItem.SpectraLineResponse[1].speciesOflineIndex]).toEqual(assertItem.SpectraLineResponse[1].freqSpeciesOfline);
    }, spectralLineRequest);

    afterAll(() => Connection.close());
});