import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;

interface IAddRequiredTilesExt extends CARTA.IAddRequiredTiles {
    rank: number;
};
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    initTilesReq: IAddRequiredTilesExt[];
    initSetCursor: CARTA.ISetCursor;
    initSpatialReq: CARTA.ISetSpatialRequirements;
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    registerViewer: {
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
    initTilesReq:
        [
            {
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
            {
                fileId: 0,
                compressionQuality: 11,
                compressionType: CARTA.CompressionType.ZFP,
                rank: 9,
                tiles: [33558529,
                    33562625,
                    33562626,
                    33558530,
                    33554434,
                    33554433,
                    33554432,
                    33558528,
                    33562624,
                    33566720,
                    33566721,
                    33566722,
                    33566723,
                    33562627,
                    33558531,
                    33554435]
            },
        ],
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
    },
};

describe("TILE_DATA_ORDER: Testing the order of returning tiles", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });
    assertItem.initTilesReq.map((initTilesReq, index) => {
        describe(`Go to "${testSubdirectory}" folder`, () => {

            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            });

            test(`OpenFileAck? | `, async () => {
                expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
                await Connection.openFile(assertItem.fileOpen);
            }, openFileTimeout);

            describe(`RASTER_TILE_DATA on the file "${assertItem.fileOpen.file}"`, () => {

                let ack: AckStream;
                test(`RasterTileData * ${initTilesReq.tiles.length} + SpatialProfileData * 1 + RasterTileSync *2 (start & end)? |`, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, initTilesReq);
                    await Connection.send(CARTA.SetCursor, assertItem.initSetCursor);
                    await Connection.send(CARTA.SetSpatialRequirements, assertItem.initSpatialReq);
                    ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                }, readFileTimeout);

                test(`Check len(RasterTileData) = ${initTilesReq.tiles.length} ? |`, () => {
                    expect(ack.RasterTileData.length).toBe(initTilesReq.tiles.length)
                });

                test(`Tile "${initTilesReq.tiles[0]}" should return within the ${initTilesReq.rank > 2 ? initTilesReq.rank + "th" : initTilesReq.rank > 1 ? initTilesReq.rank + "nd" : initTilesReq.rank + "st"} rank`, () => {
                    let _encodeTile = (ack.RasterTileData[0].tiles[0].layer << 24) | (ack.RasterTileData[0].tiles[0].y << 12) | ack.RasterTileData[0].tiles[0].x;
                    expect(initTilesReq.tiles.slice(0, initTilesReq.rank).findIndex(f => f === _encodeTile) >= 0).toBe(true);
                });

                test(`RASTER_TILE_DATA.tiles should contain ${initTilesReq.tiles.length} tiles`, () => {
                    let _seq: number[] = [];
                    initTilesReq.tiles.map(tile => {
                        let _index: number = ack.RasterTileData.findIndex(data => ((data.tiles[0].layer << 24) | (data.tiles[0].y << 12) | data.tiles[0].x) === tile);
                        expect(_index).toBeGreaterThanOrEqual(0);
                        _seq.push(_index + 1);
                    });
                    console.dir(`Sequence of returned tiles(1-indexed): ${JSON.stringify(_seq)}`);
                });

            });
        });
    });
    afterAll(() => Connection.close());
});