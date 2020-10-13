import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
import { async } from "q";
var W3CWebSocket = require('websocket').w3cwebsocket;

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen:
        [
            {
                directory: testSubdirectory,
                file: "M17_SWex.fits",
                hdu: "",
                fileId: 0,
                renderMode: CARTA.RenderMode.RASTER,
            },
            {
                directory: testSubdirectory,
                file: "M17_SWex.hdf5",
                hdu: "",
                fileId: 1,
                renderMode: CARTA.RenderMode.RASTER,
            },
            {
                directory: testSubdirectory,
                file: "M17_SWex.image",
                hdu: "",
                fileId: 2,
                renderMode: CARTA.RenderMode.RASTER,
            },
        ],
    addTilesReq:
        [
            {
                fileId: 0,
                compressionQuality: 11,
                compressionType: CARTA.CompressionType.ZFP,
                tiles: [0],
            },
            {
                fileId: 1,
                compressionQuality: 11,
                compressionType: CARTA.CompressionType.ZFP,
                tiles: [0],
            },
            {
                fileId: 2,
                compressionQuality: 11,
                compressionType: CARTA.CompressionType.ZFP,
                tiles: [0],
            },
        ],
    setCursor:
        [
            {
                fileId: 0,
                point: { x: 1, y: 1 },
            },
            {
                fileId: 1,
                point: { x: 1, y: 1 },
            },
            {
                fileId: 2,
                point: { x: 1, y: 1 },
            },
        ],
    setSpatialReq:
        [
            {
                fileId: 0,
                regionId: 0,
                spatialProfiles: ["x", "y"]
            },
            {
                fileId: 1,
                regionId: 0,
                spatialProfiles: ["x", "y"]
            },
            {
                fileId: 2,
                regionId: 0,
                spatialProfiles: ["x", "y"]
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
    describe("Prepare Image 1,2,3 for Case 1: ", () => {
        test(`(Image1, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.CloseFile, { fileId: 0 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen[0]);
            let OpenAck = await Connection.receive(CARTA.OpenFileAck)
            await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
            expect(OpenAck.success).toBe(true)
            expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file)
        }, openFileTimeout);

        let ack: AckStream;
        test(`(Image1, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            ack = await Connection.stream(5, 2500) as AckStream;
            // console.log(ack)
            expect(ack.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
            expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq[0].tiles.length) //only 1 Tile returned
        }, readFileTimeout);

        test(`(Image2, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 1 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen[1]);
            let OpenAck = await Connection.receive(CARTA.OpenFileAck)
            await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
            expect(OpenAck.success).toBe(true)
            expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[1].file)
        }, openFileTimeout);

        let ack2: AckStream;
        test(`(Image2, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            ack2 = await Connection.stream(6, 2500) as AckStream;
            // console.log(ack2)
            expect(ack2.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
            expect(ack2.RasterTileData.length).toEqual(assertItem.addTilesReq[1].tiles.length) //only 1 Tile returned
        }, readFileTimeout);

        test(`(Image3, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 2 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen[2]);
            let OpenAck = await Connection.receive(CARTA.OpenFileAck)
            await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
            expect(OpenAck.success).toBe(true)
            expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[2].file)
        }, openFileTimeout);

        let ack3: AckStream;
        test(`(Image3, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[2]);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[2]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[2]);
            ack3 = await Connection.stream(6, 2500) as AckStream;
            // console.log(ack3)
            expect(ack3.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
            expect(ack3.RasterTileData.length).toEqual(assertItem.addTilesReq[2].tiles.length) //only 1 Tile returned
        }, readFileTimeout);
    });

    describe(`Case 1:`, () => {
        let ack4: AckStream;
        test(`(Step 1) close 2nd image`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 2 });
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0])
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1])
            ack4 = await Connection.stream(2) as AckStream;
            expect(ack4.SpatialProfileData.length).toEqual(2)
        });

        let ack5: AckStream;
        test(`(Step 2) close 1st image`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 1 });
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0])
            ack5 = await Connection.stream(1) as AckStream;
            expect(ack5.SpatialProfileData.length).toEqual(1)
        });

        test(`(Step 3) Close file_id=0 image and then, make sure NO message returned & the backend is still alive`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 0 });

            let Response = await Connection.receiveAny(1000, false)
            expect(Response).toEqual(undefined)

            await Connection.send(CARTA.FileListRequest, assertItem.filelist)
            let BackendStatus = Connection.receive(CARTA.FileListResponse)
            expect(BackendStatus).toBeDefined()
        })
    });

    afterAll(() => Connection.close());
});