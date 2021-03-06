import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addRequiredTiles: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
};

let assertItem: AssertItem = {
    registerViewer: {
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
    addRequiredTiles:
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
                spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
            },
            {
                fileId: 1,
                regionId: 0,
                spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
            },
            {
                fileId: 2,
                regionId: 0,
                spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
            },
        ],
};


describe("Test for Close one file (run1):", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    test(`(Step 0) Start a new Session, Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe("Prepare Image 1,2,3 for Case 1: ", () => {
        test(`(Image1, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await Connection.openFile(assertItem.fileOpen[0]);
            expect(OpenAck.OpenFileAck.success).toBe(true);
            expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file);
        }, openFileTimeout);

        let ack: AckStream;
        test(`(Image1, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[0]);
            ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            expect(ack.RasterTileData.length).toEqual(assertItem.addRequiredTiles[0].tiles.length); //only 1 Tile returned
        }, readFileTimeout);

        test(`(Image2, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await Connection.openFile(assertItem.fileOpen[1]);
            expect(OpenAck.OpenFileAck.success).toBe(true);
            expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen[1].file);
        }, openFileTimeout);

        let ack2: AckStream;
        test(`(Image2, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[1]);
            ack2 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*3
            expect(ack2.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            expect(ack2.RasterTileData.length).toEqual(assertItem.addRequiredTiles[1].tiles.length); //only 1 Tile returned
        }, readFileTimeout);

        test(`(Image3, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await Connection.openFile(assertItem.fileOpen[2]);
            expect(OpenAck.OpenFileAck.success).toBe(true);
            expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen[2].file);
        }, openFileTimeout);

        let ack3: AckStream;
        test(`(Image3, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[2]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[2]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[2]);
            ack3 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*3
            expect(ack3.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            expect(ack3.RasterTileData.length).toEqual(assertItem.addRequiredTiles[2].tiles.length); //only 1 Tile returned
        }, readFileTimeout);
    });

    describe(`Case 1 (close image 2 -> close image 1 -> close image 0 ):`, () => {
        let ack4: AckStream;
        test(`(Step 1) close image 2`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 2 });
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            ack4 = await Connection.stream(2) as AckStream; //SPATIAL_PROFILE_DATA * 2
            expect(ack4.SpatialProfileData.length).toEqual(2);
        });

        let ack5: AckStream;
        test(`(Step 2) close image 1`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 1 });
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            ack5 = await Connection.stream(1) as AckStream; //SPATIAL_PROFILE_DATA
            expect(ack5.SpatialProfileData.length).toEqual(1);
        });

        test(`(Step 3) Close image 0 and then, make sure NO message returned & the backend is still alive`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 0 });

            let Response = await Connection.receiveAny(1000, false);
            expect(Response).toEqual(null);

            await Connection.send(CARTA.FileListRequest, assertItem.filelist);
            let BackendStatus = Connection.receive(CARTA.FileListResponse);
            expect(BackendStatus).toBeDefined();
        })
    });

    afterAll(() => Connection.close());
});

describe("Test for Close one file (run2):", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    test(`(Step 0) Start a new Session, Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe("Prepare Image 1,2,3 for Case 2: ", () => {
        test(`(Image1, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await Connection.openFile(assertItem.fileOpen[0]);
            expect(OpenAck.OpenFileAck.success).toBe(true);
            expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file);
        }, openFileTimeout);

        let ack: AckStream;
        test(`(Image1, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[0]);
            ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            expect(ack.RasterTileData.length).toEqual(assertItem.addRequiredTiles[0].tiles.length); //only 1 Tile returned
        }, readFileTimeout);

        test(`(Image2, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await Connection.openFile(assertItem.fileOpen[1]);
            expect(OpenAck.OpenFileAck.success).toBe(true);
            expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen[1].file);
        }, openFileTimeout);

        let ack2: AckStream;
        test(`(Image2, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[1]);
            ack2 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*3
            expect(ack2.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            expect(ack2.RasterTileData.length).toEqual(assertItem.addRequiredTiles[1].tiles.length); //only 1 Tile returned
        }, readFileTimeout);

        test(`(Image3, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await Connection.openFile(assertItem.fileOpen[2]);
            expect(OpenAck.OpenFileAck.success).toBe(true);
            expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen[2].file);
        }, openFileTimeout);

        let ack3: AckStream;
        test(`(Image3, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[2]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[2]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[2]);
            ack3 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            // console.log(ack3) //RasterTileData + RasterTileSync*2 + SpatialProfileData*3
            expect(ack3.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            expect(ack3.RasterTileData.length).toEqual(assertItem.addRequiredTiles[2].tiles.length); //only 1 Tile returned
        }, readFileTimeout);
    });

    describe(`Case 2 (close image 0 & 1 -> close image 2):`, () => {
        let ack6: AckStream;
        test(`(Step 1) close image 0 & image 1 at once`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 0 });
            await Connection.send(CARTA.CloseFile, { fileId: 1 });
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[2]);
            ack6 = await Connection.receiveAny(1000, false);
            expect(ack6).toEqual(null);
        });

        test(`(Step 2) Close image 2 and then, make sure NO message returned & the backend is still alive`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 2 });

            let Response = await Connection.receiveAny(1000, false);
            expect(Response).toEqual(null);

            await Connection.send(CARTA.FileListRequest, assertItem.filelist);
            let BackendStatus = await Connection.receive(CARTA.FileListResponse);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toBe(assertItem.filelist.directory);
        })
    });
    afterAll(() => Connection.close());
});

describe("Test for Close one file (run3):", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    test(`(Step 0) Start a new Session, Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe("Prepare Image 1,2,3 for Case 3: ", () => {
        test(`(Image1, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await Connection.openFile(assertItem.fileOpen[0]);
            expect(OpenAck.OpenFileAck.success).toBe(true);
            expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file);
        }, openFileTimeout);

        let ack: AckStream;
        test(`(Image1, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[0]);
            ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*2
            expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            expect(ack.RasterTileData.length).toEqual(assertItem.addRequiredTiles[0].tiles.length); //only 1 Tile returned
        }, readFileTimeout);

        test(`(Image2, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await Connection.openFile(assertItem.fileOpen[1]);
            expect(OpenAck.OpenFileAck.success).toBe(true);
            expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen[1].file);
        }, openFileTimeout);

        let ack2: AckStream;
        test(`(Image2, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[1]);
            ack2 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*3
            expect(ack2.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            expect(ack2.RasterTileData.length).toEqual(assertItem.addRequiredTiles[1].tiles.length); //only 1 Tile returned
        }, readFileTimeout);

        test(`(Image3, step1)OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            let OpenAck = await Connection.openFile(assertItem.fileOpen[2]);
            expect(OpenAck.OpenFileAck.success).toBe(true);
            expect(OpenAck.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen[2].file);
        }, openFileTimeout);

        let ack3: AckStream;
        test(`(Image3, step2)return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[2]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[2]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles[2]);
            ack3 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            ////RasterTileData + RasterTileSync*2 + SpatialProfileData*3
            expect(ack3.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
            expect(ack3.RasterTileData.length).toEqual(assertItem.addRequiredTiles[2].tiles.length); //only 1 Tile returned
        }, readFileTimeout);
    });

    describe(`Case 3 (close image 0, 1 & 2 together):`, () => {
        let ack6: AckStream;
        test(`(Step 1) close image 0, image 1 & image 2 together, make sure NO message returned & the backend is still alive`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 0 });
            await Connection.send(CARTA.CloseFile, { fileId: 1 });
            await Connection.send(CARTA.CloseFile, { fileId: 2 });

            let Response = await Connection.receiveAny(1000, false);
            expect(Response).toEqual(null);

            await Connection.send(CARTA.FileListRequest, assertItem.filelist);
            let BackendStatus = await Connection.receive(CARTA.FileListResponse);
            expect(BackendStatus).toBeDefined();
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toBe(assertItem.filelist.directory);
        });
    });

    afterAll(() => Connection.close());
});
