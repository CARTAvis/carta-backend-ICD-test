import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;

interface SetIAddRequiredTilesExt extends CARTA.IAddRequiredTiles {
    rank: number;
};
interface AssertItem {
    precisionDigit: number;
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    fileOpenAck: CARTA.IOpenFileAck;
    initTilesReq: CARTA.IAddRequiredTilesExt;
    initSetCursor: CARTA.ISetCursor;
    // setImageChannel: SetImageChannelsExt[];
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "cluster_04096.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        rank: 9,
        tiles: [50343939,
            50348035,
            50348036,
            50343940,
            50339844,
            50339843,
            50339842,
            50343938,
            50348034,
            50352130,
            50352131,
            50352132,
            50352133,
            50348037,
            50343941,
            50339845,
            50335749,
            50335748,
            50335747,
            50335746,
            50335745,
            50339841,
            50343937,
            50348033,
            50352129,
            50356225,
            50356226,
            50356227,
            50356228,
            50356229,
            50356230,
            50352134,
            50348038,
            50343942,
            50339846,
            50335750,
            50331654,
            50331653,
            50331652,
            50331651,
            50331650,
            50331649,
            50331648,
            50335744,
            50339840,
            50343936,
            50348032,
            50352128,
            50356224]
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
};

describe("TILE_DATA_ORDER test: Testing the order of returning tiles", () => {
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

    describe(`Go to "${testSubdirectory}" folder`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        });

        test(`OpenFileAck? | `, async () => {
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
            let temp1 = await Connection.receive(CARTA.OpenFileAck)
            // console.log(temp1)
        }, openFileTimeout);

        test(`RegionHistogramData? | `, async () => {
            let temp2 = await Connection.receive(CARTA.RegionHistogramData);
            // console.log(temp2)
        }, openFileTimeout);

        let RasterTileDataTemp: CARTA.RasterTileData;

        describe(`RASTER_TILE_DATA on the file "${assertItem.fileOpen.file}"`, () => {

            let ack: AckStream;
            test(`RasterTileData * 49 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)? |`, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.initTilesReq);
                await Connection.send(CARTA.SetCursor, assertItem.initSetCursor);
                ack = await Connection.stream(assertItem.initTilesReq.tiles.length + 3) as AckStream;
                console.log(ack);
            }, readFileTimeout);

            test(`Check len(RasterTileData) = 49 ? |`, () => {
                let RasterTileDataTemp = ack.RasterTileData
                expect(RasterTileDataTemp.length).toBe(assertItem.initTilesReq.tiles.length)
            });

            test(`Tile "${assertItem.initTilesReq.tiles[0]}" should return within the ${assertItem.initTilesReq.rank > 2 ? assertItem.initTilesReq.rank + "th" : assertItem.initTilesReq.rank > 1 ? assertItem.initTilesReq.rank + "nd" : assertItem.initTilesReq.rank + "st"} rank`, () => {
                let _encodeTile = (ack.RasterTileData[0].tiles[0].layer << 24) | (ack.RasterTileData[0].tiles[0].y << 12) | ack.RasterTileData[0].tiles[0].x;
                expect(assertItem.initTilesReq.tiles.slice(0, assertItem.initTilesReq.rank).findIndex(f => f === _encodeTile) >= 0).toBe(true);
            });

            test(`RASTER_TILE_DATA.tiles should contain ${assertItem.initTilesReq.tiles.length} tiles`, () => {
                let _seq: number[] = [];
                assertItem.initTilesReq.tiles.map(tile => {
                    let _index: number = ack.RasterTileData.findIndex(data => ((data.tiles[0].layer << 24) | (data.tiles[0].y << 12) | data.tiles[0].x) === tile);
                    expect(_index).toBeGreaterThanOrEqual(0);
                    _seq.push(_index + 1);
                });
                console.dir(`Sequence of returned tiles(1-indexed): ${JSON.stringify(_seq)}`);
            });
        });
    });
});