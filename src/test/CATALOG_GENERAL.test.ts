import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.catalogArtificial;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile

interface ICatalogFileInfoResponseExt extends CARTA.ICatalogFileInfoResponse {
    lengthOfHeaders: number;
};

interface IOpenCatalogFileAckExt extends CARTA.IOpenCatalogFileAck {
    lengthOfHeaders: number;
};

interface ICatalogFilterResponseExt extends CARTA.ICatalogFilterResponse {
    lengthOfColumns: number;
    fileid: number;
};

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    catalogListReq: CARTA.ICatalogListRequest;
    catalogListResponse: CARTA.ICatalogListResponse;
    catalogFileInfoReq: CARTA.ICatalogFileInfoRequest;
    catalogFileInfoResponse: ICatalogFileInfoResponseExt;
    openCatalogFile: CARTA.IOpenCatalogFile;
    openCatalogFileAck: IOpenCatalogFileAckExt;
    catalogFilterReq: CARTA.ICatalogFilterRequest[];
    catalogFilterResponse: ICatalogFilterResponseExt[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "Gaussian_J2000.fits",
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
        point: { x: 1250, y: 100 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
    },
    catalogListReq: {
        directory: testSubdirectory
    },
    catalogFileInfoReq: {
        directory: testSubdirectory,
        name: "artificial_catalog_J2000.xml"
    },
    openCatalogFile: {
        directory: testSubdirectory,
        fileId: 1,
        name: "artificial_catalog_J2000.xml",
        previewDataSize: 50
    },
    catalogFilterReq: [
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: null,
            imageBounds: {},
            regionId: null,
            sortColumn: "RA_d",
            sortingType: 0,
            subsetDataSize: 29,
            subsetStartIndex: 0
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: [
                { columnName: "RA_d", comparisonOperator: 5, value: 160 }
            ],
            imageBounds: {
                xColumnName: null,
                yColumnName: null
            },
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 29,
            subsetStartIndex: 0
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: [
                { columnName: "OTYPE_S", subString: "Star" }
            ],
            imageBounds: {
                xColumnName: null,
                yColumnName: null
            },
            regionId: null,
            sortColumn: null,
            sortingType: null,
            subsetDataSize: 29,
            subsetStartIndex: 0
        },
        {
            columnIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            fileId: 1,
            filterConfigs: [
                { columnName: "OTYPE_S", subString: "Star" },
                { columnName: "RA_d", comparisonOperator: 5, value: 160 }
            ],
            imageBounds: {
                xColumnName: null,
                yColumnName: null
            },
            regionId: null,
            sortColumn: "RA_d",
            sortingType: 0,
            subsetDataSize: 29,
            subsetStartIndex: 0
        },
    ],
    catalogListResponse: {
        directory: testSubdirectory,
        success: true,
        subdirectories: ["Gaussian_J2000.image"]
    },
    catalogFileInfoResponse: {
        fileInfo: { name: "artificial_catalog_J2000.xml", type: 1, fileSize: 113559 },
        success: true,
        lengthOfHeaders: 235,
    },
    openCatalogFileAck: {
        dataSize: 29,
        fileId: 1,
        fileInfo: { name: "artificial_catalog_J2000.xml", type: 1, fileSize: 113559 },
        lengthOfHeaders: 235,
        success: true
    },
    catalogFilterResponse: [
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 29,
            subsetEndIndex: 29,
            filterDataSize: 29,
            requestEndIndex: 29,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 26,
            subsetEndIndex: 26,
            filterDataSize: 26,
            requestEndIndex: 26,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 24,
            subsetEndIndex: 24,
            filterDataSize: 24,
            requestEndIndex: 24,
            progress: 1
        },
        {
            lengthOfColumns: 10,
            fileid: 1,
            subsetDataSize: 23,
            subsetEndIndex: 23,
            filterDataSize: 23,
            requestEndIndex: 23,
            progress: 1
        },
    ]
};

describe("Test for general CATALOG related messages:", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms | `, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        let Ack = await Connection.openFile(assertItem.fileOpen);
        expect(Ack.OpenFileAck.success).toBe(true);
        expect(Ack.OpenFileAck.fileInfo.name).toEqual(assertItem.fileOpen.file);
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length | `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
        ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        expect(ack.RasterTileSync.length).toEqual(2);//RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length); //only 1 Tile returned
    }, readFileTimeout);

    test(`(Step 3) Request CatalogList & check CatalogListResponse | `, async () => {
        await Connection.send(CARTA.CatalogListRequest, assertItem.catalogListReq);
        let CatalogListAck = await Connection.receive(CARTA.CatalogListResponse);
        expect(CatalogListAck.directory).toEqual(assertItem.catalogListResponse.directory);
        expect(CatalogListAck.success).toEqual(assertItem.catalogListResponse.success);
        expect(CatalogListAck.subdirectories).toEqual(expect.arrayContaining(assertItem.catalogListResponse.subdirectories));
    });

    test(`(Step 4) Request CatalogFileInfo & check CatalogFileInfoAck | `, async () => {
        await Connection.send(CARTA.CatalogFileInfoRequest, assertItem.catalogFileInfoReq);
        let CatalogFileInfoAck = await Connection.receive(CARTA.CatalogFileInfoResponse);
        expect(CatalogFileInfoAck.success).toEqual(assertItem.catalogFileInfoResponse.success);
        expect(CatalogFileInfoAck.fileInfo.name).toEqual(assertItem.catalogFileInfoResponse.fileInfo.name);
        expect(CatalogFileInfoAck.fileInfo.type).toEqual(assertItem.catalogFileInfoResponse.fileInfo.type);
        expect(CatalogFileInfoAck.fileInfo.fileSize.low).toEqual(assertItem.catalogFileInfoResponse.fileInfo.fileSize);
        expect(CatalogFileInfoAck.headers.length).toEqual(assertItem.catalogFileInfoResponse.lengthOfHeaders);
    });

    test(`(Step 5) Request CatalogFile & check CatalogFileAck | `, async () => {
        await Connection.send(CARTA.OpenCatalogFile, assertItem.openCatalogFile);
        let CatalogFileAck = await Connection.receive(CARTA.OpenCatalogFileAck);
        expect(CatalogFileAck.success).toEqual(assertItem.openCatalogFileAck.success);
        expect(CatalogFileAck.dataSize).toEqual(assertItem.openCatalogFileAck.dataSize);
        expect(CatalogFileAck.fileId).toEqual(assertItem.openCatalogFileAck.fileId);
        expect(CatalogFileAck.fileInfo.name).toEqual(assertItem.openCatalogFileAck.fileInfo.name);
        expect(CatalogFileAck.fileInfo.type).toEqual(assertItem.openCatalogFileAck.fileInfo.type);
        expect(CatalogFileAck.fileInfo.fileSize.low).toEqual(assertItem.openCatalogFileAck.fileInfo.fileSize);
        expect(CatalogFileAck.headers.length).toEqual(assertItem.openCatalogFileAck.lengthOfHeaders);
    });

    test(`(Step 6) Request CatalogFilter: Sorting & check CatalogFilterResponse | `, async () => {
        await Connection.send(CARTA.CatalogFilterRequest, assertItem.catalogFilterReq[0]);
        let CatalogFilterResponse = await Connection.receive(CARTA.CatalogFilterResponse);
        expect(Object.keys(CatalogFilterResponse.columns).length).toEqual(assertItem.catalogFilterResponse[0].lengthOfColumns);
        expect(CatalogFilterResponse.fileid).toEqual(assertItem.catalogFilterResponse[0].fileId);
        expect(CatalogFilterResponse.subsetDataSize).toEqual(assertItem.catalogFilterResponse[0].subsetDataSize);
        expect(CatalogFilterResponse.subsetEndIndex).toEqual(assertItem.catalogFilterResponse[0].subsetEndIndex);
        expect(CatalogFilterResponse.filterDataSize).toEqual(assertItem.catalogFilterResponse[0].filterDataSize);
        expect(CatalogFilterResponse.requestEndIndex).toEqual(assertItem.catalogFilterResponse[0].requestEndIndex);
        expect(CatalogFilterResponse.progress).toEqual(assertItem.catalogFilterResponse[0].progress);
    });

    test(`(Step 7) Request CatalogFilter: Filter(number) & check CatalogFilterResponse | `, async () => {
        await Connection.send(CARTA.CatalogFilterRequest, assertItem.catalogFilterReq[1]);
        let CatalogFilterResponse2 = await Connection.receive(CARTA.CatalogFilterResponse);
        expect(Object.keys(CatalogFilterResponse2.columns).length).toEqual(assertItem.catalogFilterResponse[1].lengthOfColumns);
        expect(CatalogFilterResponse2.fileid).toEqual(assertItem.catalogFilterResponse[1].fileId);
        expect(CatalogFilterResponse2.subsetDataSize).toEqual(assertItem.catalogFilterResponse[1].subsetDataSize);
        expect(CatalogFilterResponse2.subsetEndIndex).toEqual(assertItem.catalogFilterResponse[1].subsetEndIndex);
        expect(CatalogFilterResponse2.filterDataSize).toEqual(assertItem.catalogFilterResponse[1].filterDataSize);
        expect(CatalogFilterResponse2.requestEndIndex).toEqual(assertItem.catalogFilterResponse[1].requestEndIndex);
        expect(CatalogFilterResponse2.progress).toEqual(assertItem.catalogFilterResponse[1].progress);
    });

    test(`(Step 8) Request CatalogFilter: Filter(string) & check CatalogFilterResponse | `, async () => {
        await Connection.send(CARTA.CatalogFilterRequest, assertItem.catalogFilterReq[2]);
        let CatalogFilterResponse3 = await Connection.receive(CARTA.CatalogFilterResponse);
        expect(Object.keys(CatalogFilterResponse3.columns).length).toEqual(assertItem.catalogFilterResponse[2].lengthOfColumns);
        expect(CatalogFilterResponse3.fileid).toEqual(assertItem.catalogFilterResponse[2].fileId);
        expect(CatalogFilterResponse3.subsetDataSize).toEqual(assertItem.catalogFilterResponse[2].subsetDataSize);
        expect(CatalogFilterResponse3.subsetEndIndex).toEqual(assertItem.catalogFilterResponse[2].subsetEndIndex);
        expect(CatalogFilterResponse3.filterDataSize).toEqual(assertItem.catalogFilterResponse[2].filterDataSize);
        expect(CatalogFilterResponse3.requestEndIndex).toEqual(assertItem.catalogFilterResponse[2].requestEndIndex);
        expect(CatalogFilterResponse3.progress).toEqual(assertItem.catalogFilterResponse[2].progress);
    });

    test(`(Step 9) Request CatalogFilter: Sorting when Filter(string+number) is applied & check CatalogFilterResponse | `, async () => {
        await Connection.send(CARTA.CatalogFilterRequest, assertItem.catalogFilterReq[3]);
        let CatalogFilterResponse3 = await Connection.receive(CARTA.CatalogFilterResponse);
        expect(Object.keys(CatalogFilterResponse3.columns).length).toEqual(assertItem.catalogFilterResponse[3].lengthOfColumns);
        expect(CatalogFilterResponse3.fileid).toEqual(assertItem.catalogFilterResponse[3].fileId);
        expect(CatalogFilterResponse3.subsetDataSize).toEqual(assertItem.catalogFilterResponse[3].subsetDataSize);
        expect(CatalogFilterResponse3.subsetEndIndex).toEqual(assertItem.catalogFilterResponse[3].subsetEndIndex);
        expect(CatalogFilterResponse3.filterDataSize).toEqual(assertItem.catalogFilterResponse[3].filterDataSize);
        expect(CatalogFilterResponse3.requestEndIndex).toEqual(assertItem.catalogFilterResponse[3].requestEndIndex);
        expect(CatalogFilterResponse3.progress).toEqual(assertItem.catalogFilterResponse[3].progress);
    });

    afterAll(() => Connection.close());
});
