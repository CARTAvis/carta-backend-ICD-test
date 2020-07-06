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
    }[];
}
interface AssertItem {
    precisionDigit: number;
    register: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile;
    fileOpenAck: CARTA.IOpenFileAck;
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialReq: CARTA.ISetSpatialRequirements;
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
    initSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
    },
    rasterTileData: {
        fileId: 0,
        channel: 0,
        stokes: 0,
        compressionType: CARTA.CompressionType.NONE,
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
    addRequiredTilesGroup: [
        {
            fileId: 0,
            tiles: [33558529, 33562626, 33566723],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 0,
            tiles: [33558529, 33562626, 33566723, 33570820],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            // Jest only received one returned message from Backend {RasterTileSync: [RasterTileSync {}]} as Stream
            // No RASTER_TILE_DATA returned
            // BackendLog:
            // Mean filter 0x0 raster data to 0x0 in 0.003 ms at 0 MPix/s
            // Bus error(core dumped)
            // or BackendLog:
            // Mean filter 0x0 raster data to 0x0 in 0.002 ms at 0 MPix/s
            // Segmentation fault(core dumped)
        },
        // {
        //     fileId: 0,
        //     tiles: [33570820],
        //     compressionType: CARTA.CompressionType.ZFP,
        //     compressionQuality: 11,
        //     // BackendLog:
        //     // Mean filter 0x0 raster data to 0x0 in 0.01 ms at 0 MPix / s 
        //     // Segmentation fault(core dumped)
        // },
        // {
        //     fileId: 0,
        //     tiles: [50364424],
        //     compressionType: CARTA.CompressionType.ZFP,
        //     compressionQuality: 11,
        //     // BackendLog:
        //     // Mean filter 0x0 raster data to 0x0 in 0.012 ms at 0 MPix / s 
        //     // Segmentation fault(core dumped)
        //     // or BackendLog:
        //     // Mean filter 0x0 raster data to 0x0 in 0.002 ms at 0 MPix / s 
        //     // Bus error(core dumped)
        // },
    ],
    rasterTileDataGroup: [
        {
            tiles: [
                { x: 1, y: 1, layer: 2, },
                { x: 2, y: 2, layer: 2, },
                { x: 3, y: 3, layer: 2, },
            ],
            assert: [
                { lengthTiles: 1, },
                { lengthTiles: 1, },
                { lengthTiles: 1, },
            ],
        },
        {
            tiles: [
                { x: 1, y: 1, layer: 2, },
                { x: 2, y: 2, layer: 2, },
                { x: 3, y: 3, layer: 2, },
            ],
            assert: [
                { lengthTiles: 1, },
                { lengthTiles: 1, },
                { lengthTiles: 1, },
            ],
        },
        // {
        //     tiles: [],
        //     assert: [],
        // },
        // {
        //     tiles: [],
        //     assert: [],
        // },
    ],
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
    let RasterTileDataTemp2: CARTA.RasterTileData;
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
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.initSpatialReq);
            ack = await Connection.stream(assertItem.initTilesReq.tiles.length + 3) as AckStream;
            console.log(ack);
            RasterTileDataTemp = ack.RasterTileData
            // console.log(RasterTileDataTemp)
        }, readFileTimeout);

        assertItem.rasterTileData.tiles.map((tiles, index) => {
            describe(`(Step1-3) Check each RASTER_TILE_DATA`, () => {
                test(`(#${index})RASTER_TILE_DATA.tiles.length = 1 |`, () => {
                    expect(RasterTileDataTemp[index].tiles.length).toBe(assertItem.rasterTileData.assert[index].lengthTiles);
                });

                test(`(#${index})RASTER_TILE_DATA.tiles[0].x = ${tiles.x} & RASTER_TILE_DATA.tiles[0].y = ${tiles.y} & RASTER_TILE_DATA.tiles[0].layer = ${tiles.layer}|`, () => {
                    let TempTiles = assertItem.rasterTileData.tiles.filter(f => f.x === RasterTileDataTemp[index].tiles[0].x && f.y === RasterTileDataTemp[index].tiles[0].y && f.layer === RasterTileDataTemp[index].tiles[0].layer)
                    // console.log(TempTiles);
                    expect(TempTiles).toBeDefined();
                })
            });
        });

//        assertItem.rasterTileDataGroup.map((rasterTileData, index) => {
//            describe(`ADD_REQUIRED_TILES ${assertItem.addRequiredTilesGroup[index].tiles}`, () => {
//                let ack2: AckStream;
//                if (rasterTileData.tiles.length) {
//                    test(`RASTER_TILE_DATA x${rasterTileData.tiles.length} should arrive within ${readFileTimeout} ms`, async () => {
//                        await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTilesGroup[index]);
//                        ack2 = await Connection.stream(assertItem.addRequiredTilesGroup[index].tiles.length + 2) as AckStream;
//                        console.log(ack2) //RasterTileData * 3 + RasterTileSync *2 (start & end)?
//                        // ack2 = await Connection.stream(assertItem.rasterTileData.tiles.length) as AckStream;
//                        expect(ack2.RasterTileData.length).toEqual(rasterTileData.tiles.length);
//                        RasterTileDataTemp2 = ack2.RasterTileData
//                    }, readFileTimeout);
//
//                    if (index == 0) {
//                        assertItem.rasterTileDataGroup[index].tiles.map((tiles, index2) => {
//                            describe(`(Step4-7) Check each RASTER_TILE_DATA`, () => {
//                                test(`(#${index2})RASTER_TILE_DATA.tiles.length = 1 |`, () => {
//                                    expect(RasterTileDataTemp2[index2].tiles.length).toBe(assertItem.rasterTileDataGroup[index].assert[index2].lengthTiles);
//                                });
//
//                                test(`(#${index2})RASTER_TILE_DATA.tiles[0].x = ${tiles.x} & RASTER_TILE_DATA.tiles[0].y = ${tiles.y} & RASTER_TILE_DATA.tiles[0].layer = ${tiles.layer}|`, () => {
//                                    let TempTiles = assertItem.rasterTileDataGroup[index].tiles.filter(f => f.x === RasterTileDataTemp2[index2].tiles[0].x && f.y === RasterTileDataTemp2[index2].tiles[0].y && f.layer === RasterTileDataTemp2[index2].tiles[0].layer)
//                                    // console.log(TempTiles);
//                                    expect(TempTiles).toBeDefined();
//                                });
//
//                            });
//                        });
//                    }
//
//                } else {
//                    test(`RASTER_TILE_DATA should NOT arrive within ${readFileTimeout} ms`, async () => {
//                        await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTilesGroup[index]);
//                        await Connection.receive(CARTA.RasterTileData, readFileTimeout * .5, false);
//                    }, readFileTimeout);
//                }
//
//                test("Backend be still alive (After send/receive, plz try several times, because the backend may automatically restart!)", () => {
//                    setTimeout(() => {
//                        console.log('waiting for 100ms')
//                    }, 100);
//                    expect(Connection.connection.readyState).toEqual(WebSocket.OPEN);
//                });
//            });
//        });
//
    });
    afterAll(() => Connection.close());
});
