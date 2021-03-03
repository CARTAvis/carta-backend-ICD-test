import { CARTA } from "carta-protobuf";

import { Client, AckStream, IOpenFile } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
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
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setRegion: CARTA.ISetRegion;
    regionAck: CARTA.ISetRegionAck;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setSpectralLineReq: CARTA.ISpectralLineRequest[];
    SpectraLineResponse: ISpectralLineResponseExt[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_13CO_2-1.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addRequiredTiles: {
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
            dataSize: 204,
            lengthOfheaders: 19,
            speciesOfline: "Carbon Monoxide",
            speciesOflineIndex: 201,
            freqSpeciesOfline: "220398.68420",
        },
    ],
};

describe("[Case 1] Open an image, and then query the spectral line (line freq does not match image's freq):", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        let ack = await Connection.openFile(assertItem.openFile) as IOpenFile;
        expect(ack.OpenFileAck.success).toBe(true);
        expect(ack.OpenFileAck.fileInfo.name).toEqual(assertItem.openFile.file);
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addRequiredTiles.tiles.length); //only 1 Tile returned
    }, readFileTimeout);

    test(`(Step 3) return SPECTRAL_LINE_RESPONSE within ${spectralLineRequest}ms and check response:`, async () => {
        await Connection.send(CARTA.SpectralLineRequest, assertItem.setSpectralLineReq[0]);
        let response = await Connection.receive(CARTA.SpectralLineResponse);
        // console.log(SpectralLineResponse)
        expect(response.success).toEqual(assertItem.SpectraLineResponse[0].success);
        expect(response.dataSize).toEqual(assertItem.SpectraLineResponse[0].dataSize);
        expect(response.headers.length).toEqual(assertItem.SpectraLineResponse[0].lengthOfheaders);
        let properties = Object.keys(response.spectralLineData);
        properties.map((num, index) => {
            expect(response.spectralLineData[index].stringData.length).toEqual(assertItem.SpectraLineResponse[0].dataSize);
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
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        let ack = await Connection.openFile(assertItem.openFile) as IOpenFile;
        expect(ack.OpenFileAck.success).toBe(true);
        expect(ack.OpenFileAck.fileInfo.name).toEqual(assertItem.openFile.file);
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addRequiredTiles.tiles.length); //only 1 Tile returned
    }, readFileTimeout);

    let SetRegionAck: CARTA.SetRegionAck;
    test(`(Step 3) Set REGION & SPECTRAL_PROFILE streaming until progress=1:`, async () => {
        // Set REGION
        await Connection.send(CARTA.SetRegion, assertItem.setRegion);
        SetRegionAck = await Connection.receive(CARTA.SetRegionAck);
        expect(SetRegionAck.regionId).toEqual(assertItem.regionAck.regionId);
        expect(SetRegionAck.success).toEqual(assertItem.regionAck.success);

        //Set SPECTRAL_PROFILE streaming
        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
        await Connection.streamUntil((type, data) => type == CARTA.SpectralProfileData && data.progress == 1);
    });

    test(`(Step 4) return SPECTRAL_LINE_RESPONSE within ${spectralLineRequest}ms and check response:`, async () => {
        await Connection.send(CARTA.SpectralLineRequest, assertItem.setSpectralLineReq[1]);
        let SpectralLineResponse = await Connection.receive(CARTA.SpectralLineResponse);
        expect(SpectralLineResponse.success).toEqual(assertItem.SpectraLineResponse[1].success);
        expect(SpectralLineResponse.dataSize).toEqual(assertItem.SpectraLineResponse[1].dataSize);
        expect(SpectralLineResponse.headers.length).toEqual(assertItem.SpectraLineResponse[1].lengthOfheaders);
        let properties = Object.keys(SpectralLineResponse.spectralLineData);
        properties.map((num, index) => {
            expect(SpectralLineResponse.spectralLineData[index].stringData.length).toEqual(assertItem.SpectraLineResponse[1].dataSize);
        });
        expect(SpectralLineResponse.spectralLineData[1].stringData[assertItem.SpectraLineResponse[1].speciesOflineIndex]).toEqual(assertItem.SpectraLineResponse[1].speciesOfline);
        expect(SpectralLineResponse.spectralLineData[2].stringData[assertItem.SpectraLineResponse[1].speciesOflineIndex]).toEqual(assertItem.SpectraLineResponse[1].freqSpeciesOfline);
    }, spectralLineRequest);

    afterAll(() => Connection.close());
});