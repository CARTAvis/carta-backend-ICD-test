import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;

interface IRasterTileDataExt extends CARTA.IRasterTileData {
    assert: {
        lengthTiles: number,
        index: {
            x: number,
            y: number
        },
        value: number,
    };
}
interface AssertItem {
    precisionDigit: number;
    register: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile;
    fileOpenAck: CARTA.IOpenFileAck;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    setImageChannel: CARTA.ISetImageChannels;
    rasterTileData: IRasterTileDataExt;
    addRequiredTilesGroup: CARTA.IAddRequiredTiles[];
    rasterTileDataGroup: IRasterTileDataExt[];
}
let assertItem: AssertItem = {
    precisionDigit: 4,
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    fileOpen: {
        directory: testSubdirectory,
        file: "cluster_04096.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    fileOpenAck: {
        success: true,
        fileFeatureFlags: 0,
    },
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.NONE,
        tiles: [16777216, 16781312, 16777217, 16781313],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    rasterTileData: {
        fileId: 0,
        channel: 0,
        stokes: 0,
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 11,
        tiles: [
            { x: 0, y: 0, layer: 1, },
            { x: 1, y: 0, layer: 1, },
            { x: 0, y: 1, layer: 1, },
            { x: 1, y: 1, layer: 1, },
        ],
        assert: [
            { lengthTiles: 1, },
            { lengthTiles: 1, },
            { lengthTiles: 1, },
            { lengthTiles: 1, },
        ],
    },
    // addRequiredTilesGroup: [
    //     {
    //         fileId: 0,
    //         tiles: [16781313], // Hex1001001
    //         compressionType: CARTA.CompressionType.NONE,
    //     },
    //     {
    //         fileId: 0,
    //         tiles: [33566723], // Hex2003003
    //         compressionType: CARTA.CompressionType.NONE,
    //     },
    //     {
    //         fileId: 0,
    //         tiles: [50360327], // Hex3007007
    //         compressionType: CARTA.CompressionType.NONE,
    //     },
    //     {
    //         fileId: 0,
    //         tiles: [67170319], // Hex400F00F
    //         compressionType: CARTA.CompressionType.NONE,
    //     },
    // ],
    // rasterTileDataGroup: [
    //     {
    //         fileId: 0,
    //         channel: 0,
    //         stokes: 0,
    //         compressionType: CARTA.CompressionType.NONE,
    //         tiles: [
    //             {
    //                 x: 1,
    //                 y: 1,
    //                 layer: 1,
    //                 height: 256,
    //                 width: 256,
    //             },
    //         ],
    //         assert: {
    //             lengthTiles: 1,
    //             index: { x: 256, y: 256 },
    //             value: 2.85753,
    //         }
    //     },
    //     {
    //         fileId: 0,
    //         channel: 0,
    //         stokes: 0,
    //         compressionType: CARTA.CompressionType.NONE,
    //         tiles: [
    //             {
    //                 x: 3,
    //                 y: 3,
    //                 layer: 2,
    //                 height: 256,
    //                 width: 256,
    //             },
    //         ],
    //         assert: {
    //             lengthTiles: 1,
    //             index: { x: 256, y: 256 },
    //             value: 2.40348,
    //         }
    //     },
    //     {
    //         fileId: 0,
    //         channel: 0,
    //         stokes: 0,
    //         compressionType: CARTA.CompressionType.NONE,
    //         tiles: [
    //             {
    //                 x: 7,
    //                 y: 7,
    //                 layer: 3,
    //                 height: 256,
    //                 width: 256,
    //             },
    //         ],
    //         assert: {
    //             lengthTiles: 1,
    //             index: { x: 256, y: 256 },
    //             value: 2.99947,
    //         }
    //     },
    //     {
    //         fileId: 0,
    //         channel: 0,
    //         stokes: 0,
    //         compressionType: CARTA.CompressionType.NONE,
    //         tiles: [
    //             {
    //                 x: 15,
    //                 y: 15,
    //                 layer: 4,
    //                 height: 256,
    //                 width: 256,
    //             },
    //         ],
    //         assert: {
    //             lengthTiles: 1,
    //             index: { x: 256, y: 256 },
    //             value: 3.74704,
    //         }
    //     },
    // ],
};

describe("CHECK_RASTER_TILE_DATA test: Testing data values at different layers in RASTER_TILE_DATA", () => {
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

    let RasterTileDataTemp: CARTA.RasterTileData;
    describe(`read the file "${assertItem.fileOpen.file}" on folder "${testSubdirectory}"`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        });

        test(`OpenFileAck? | `, async () => {
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
            let temp1 = await Connection.receive(CARTA.OpenFileAck)
            // console.log(temp1)
        }, openFileTimeout);

        test(`RegionHistogramData (would pass over if trying several times)? | `, async () => {
            let temp2 = await Connection.receive(CARTA.RegionHistogramData);
            // console.log(temp2)
        }, openFileTimeout);

        let ack: AckStream;
        test(`RasterTileData * 4 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)? |`, async () => {
            await Connection.send(CARTA.AddRequiredTiles, assertItem.initTilesReq);
            await Connection.send(CARTA.SetCursor, assertItem.initSetCursor);
            ack = await Connection.stream(7) as AckStream;
            // console.log(ack);
            RasterTileDataTemp = ack.RasterTileData
            // console.log(RasterTileDataTemp)
        }, readFileTimeout);

        assertItem.rasterTileData.tiles.map((tiles, index) => {
            describe(`Check each RASTER_TILE_DATA`, () => {
                test(`(#${index})RASTER_TILE_DATA.tiles.length = 1 |`, () => {
                    expect(RasterTileDataTemp[index].tiles.length).toBe(assertItem.rasterTileData.assert[index].lengthTiles);
                });

                test(`(#${index})RASTER_TILE_DATA.tiles[0].x = ${tiles.x} & RASTER_TILE_DATA.tiles[0].y = ${tiles.y} & RASTER_TILE_DATA.tiles[0].layer = ${tiles.layer}|`, () => {
                    let TempTiles = assertItem.rasterTileData.tiles.filter(f => f.x === RasterTileDataTemp[index].tiles[0].x && f.y === RasterTileDataTemp[index].tiles[0].y && f.layer === RasterTileDataTemp[index].tiles[0].layer)
                    // console.log(TempTiles);
                    expect(TempTiles).toBeDefined();
                })
            });
        })




    });

});
