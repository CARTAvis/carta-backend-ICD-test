import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.catalogLarge;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile
let openCatalogLargeTimeout: number = config.timeout.openCatalogLarge

interface ICatalogFileInfoResponseExt extends CARTA.ICatalogFileInfoResponse {
    lengthOfHeaders: number
};

interface IOpenCatalogFileAckExt extends CARTA.IOpenCatalogFileAck {
    lengthOfHeaders: number
};

interface ICatalogFilterResponseExt extends CARTA.ICatalogFilterResponse {
    lengthOfColumns: number
};

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    catalogListReq: CARTA.ICatalogListRequest;
    catalogListResponse: CARTA.ICatalogListResponse;
    catalogFileInfoReq: CARTA.ICatalogFileInfoRequest[];
    catalogFileInfoResponse: CARTA.ICatalogFileInfoResponseExt[];
    openCatalogFile: CARTA.IOpenCatalogFile[];
    openCatalogFileAck: CARTA.IOpenCatalogFileAckExt[];
    catalogFilterReq: CARTA.ICatalogFilterRequest[];
    catalogFilterResponse: CARTA.ICatalogFilterResponseExt[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "cosmos_herschel250micron.fits",
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
        point: { x: 3274, y: 3402 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
    },
    catalogListReq: {
        directory: testSubdirectory
    },
    catalogFileInfoReq: [
        {
            directory: testSubdirectory,
            name: "COSMOSOPTCAT.fits"
        },
        {
            directory: testSubdirectory,
            name: "COSMOSOPTCAT.vot"
        },
    ],
    openCatalogFile: [
        {
            directory: testSubdirectory,
            fileId: 1,
            name: "COSMOSOPTCAT.fits",
            previewDataSize: 50
        },
        {
            directory: testSubdirectory,
            fileId: 2,
            name: "COSMOSOPTCAT.vot",
            previewDataSize: 50
        },
    ],
    catalogListResponse: {
        directory: testSubdirectory,
        success: true,
        subdirectories: []
    },
    catalogFileInfoResponse: [
        {
            fileInfo: { name: "COSMOSOPTCAT.fits", fileSize: 444729600, description: 'Count: 918827' },
            success: true,
            lengthOfHeaders: 62,
        },
        {
            fileInfo: {
                name: "COSMOSOPTCAT.vot", type: 1, fileSize: 1631311089, description: 'Count: 918827'
            },
            success: true,
            lengthOfHeaders: 62,
        },
    ],
    openCatalogFileAck: [
        {
            dataSize: 918827,
            fileId: 1,
            fileInfo: { name: "COSMOSOPTCAT.fits", fileSize: 444729600 },
            lengthOfHeaders: 62,
            success: true
        },
        {
            dataSize: 918827,
            fileId: 2,
            fileInfo: { name: "COSMOSOPTCAT.vot", type: 1, fileSize: 1631311089 },
            lengthOfHeaders: 62,
            success: true
        },
    ],
    catalogFilterReq: [
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 918777,
            subsetStartIndex: 50
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 2,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 918777,
            subsetStartIndex: 50
        },
    ],
    catalogFilterResponse: [
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 18777,
            subsetEndIndex: 918827,
            filterDataSize: 918827,
            requestEndIndex: 918827,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 18777,
            subsetEndIndex: 918827,
            filterDataSize: 918827,
            requestEndIndex: 918827,
            progress: 1
        },
    ],
};

assertItem.catalogFileInfoReq.map((data, index) => {
    describe(`Test for "${assertItem.catalogFileInfoReq[index].name}" catalog:`, () => {

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

        test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
            let Ack = await Connection.stream(2) as AckStream;
            let OpenAck = Ack.Responce[0] as CARTA.OpenFileAck;
            expect(OpenAck.success).toBe(true)
            expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen.file)
        }, openFileTimeout);

        let ack: AckStream;
        test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length | `, async () => {
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
            ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false) as AckStream;
            expect(ack.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
            expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length) //only 1 Tile returned
        }, readFileTimeout);

        test(`(Step 3) Request CatalogList & check CatalogListResponse | `, async () => {
            await Connection.send(CARTA.CatalogListRequest, assertItem.catalogListReq);
            let CatalogListAck = await Connection.receive(CARTA.CatalogListResponse)
            expect(CatalogListAck.directory).toEqual(assertItem.catalogListResponse.directory)
            expect(CatalogListAck.success).toEqual(assertItem.catalogListResponse.success)
            expect(CatalogListAck.subdirectories).toEqual(expect.arrayContaining(assertItem.catalogListResponse.subdirectories))
        });

        test(`(Step 4) Request CatalogFileInfo & check CatalogFileInfoAck | `, async () => {
            await Connection.send(CARTA.CatalogFileInfoRequest, assertItem.catalogFileInfoReq[index]);
            let CatalogFileInfoAck = await Connection.receive(CARTA.CatalogFileInfoResponse);
            // console.log(CatalogFileInfoAck.fileInfo)
            expect(CatalogFileInfoAck.success).toEqual(assertItem.catalogFileInfoResponse[index].success);
            expect(CatalogFileInfoAck.fileInfo.name).toEqual(assertItem.catalogFileInfoResponse[index].fileInfo.name);
            expect(CatalogFileInfoAck.fileInfo.fileSize.low).toEqual(assertItem.catalogFileInfoResponse[index].fileInfo.fileSize);
            expect(CatalogFileInfoAck.fileInfo.description).toMatch(assertItem.catalogFileInfoResponse[index].fileInfo.description)
            if (CatalogFileInfoAck.fileInfo.type) {
                expect(CatalogFileInfoAck.fileInfo.type).toEqual(assertItem.catalogFileInfoResponse[index].fileInfo.type);
            };
            expect(CatalogFileInfoAck.headers.length).toEqual(assertItem.catalogFileInfoResponse[index].lengthOfHeaders);
        });

        test(`(Step 5) Request CatalogFile & check CatalogFileAck | `, async () => {
            await Connection.send(CARTA.OpenCatalogFile, assertItem.openCatalogFile[index]);
            let CatalogFileAck = await Connection.receive(CARTA.OpenCatalogFileAck);
            // console.log(CatalogFileAck.fileInfo)
            expect(CatalogFileAck.success).toEqual(assertItem.openCatalogFileAck[index].success);
            expect(CatalogFileAck.dataSize).toEqual(assertItem.openCatalogFileAck[index].dataSize);
            expect(CatalogFileAck.fileId).toEqual(assertItem.openCatalogFileAck[index].fileId);
            expect(CatalogFileAck.fileInfo.name).toEqual(assertItem.openCatalogFileAck[index].fileInfo.name);
            expect(CatalogFileAck.fileInfo.fileSize.low).toEqual(assertItem.openCatalogFileAck[index].fileInfo.fileSize);
            if (CatalogFileAck.fileInfo.type) {
                expect(CatalogFileAck.fileInfo.type).toEqual(assertItem.openCatalogFileAck[index].fileInfo.type);
            };
            expect(CatalogFileAck.headers.length).toEqual(assertItem.openCatalogFileAck[index].lengthOfHeaders);
        }, openCatalogLargeTimeout);

        test(`(Step 6) Request CatalogFilter: progress & check CatalogFilterResponse | `, async () => {
            await Connection.send(CARTA.CatalogFilterRequest, assertItem.catalogFilterReq[index]);
            let CatalogFilterResponse = await Connection.receive(CARTA.CatalogFilterResponse);
            let ReceiveProgress = CatalogFilterResponse.progress
            if (ReceiveProgress != 1) {
                while (ReceiveProgress < 1) {
                    CatalogFilterResponse = await Connection.receive(CARTA.CatalogFilterResponse);
                    ReceiveProgress = CatalogFilterResponse.progress
                    console.warn('' + assertItem.catalogFileInfoReq[index].name + ' Catalog loading progress :', ReceiveProgress)
                };
                expect(Object.keys(CatalogFilterResponse.columns).length).toEqual(assertItem.catalogFilterResponse[index].lengthOfColumns);
                expect(CatalogFilterResponse.fileid).toEqual(assertItem.catalogFilterResponse[index].fileId);
                expect(CatalogFilterResponse.subsetDataSize).toEqual(assertItem.catalogFilterResponse[index].subsetDataSize);
                expect(CatalogFilterResponse.subsetEndIndex).toEqual(assertItem.catalogFilterResponse[index].subsetEndIndex);
                expect(CatalogFilterResponse.filterDataSize).toEqual(assertItem.catalogFilterResponse[index].filterDataSize);
                expect(CatalogFilterResponse.requestEndIndex).toEqual(assertItem.catalogFilterResponse[index].requestEndIndex);
                expect(CatalogFilterResponse.progress).toEqual(assertItem.catalogFilterResponse[index].progress);
            };
        }, openCatalogLargeTimeout);

        afterAll(() => Connection.close());
    });

});