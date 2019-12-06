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
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    fileOpenAck: CARTA.IOpenFileAck;
    regionHistogram: CARTA.IRegionHistogramData;
    setImageChannel: CARTA.ISetImageChannels;
    rasterTileData: IRasterTileDataExt;
    addRequiredTilesGroup: CARTA.IAddRequiredTiles[];
    rasterTileDataGroup: IRasterTileDataExt[];
}
let assertItem: AssertItem = {
    precisionDigit: 4,
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "cluster_04096.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
        tileSize: 256,
    },
    fileOpenAck: {
        success: true,
        fileFeatureFlags: 0,
        tileSize: 256,
    },
    regionHistogram: {
        fileId: 0,
        stokes: 0,
    },
    setImageChannel: {
        fileId: 0,
        channel: 0,
        requiredTiles: {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.NONE,
        },
    },
    rasterTileData: {
        fileId: 0,
        channel: 0,
        stokes: 0,
        compressionType: CARTA.CompressionType.NONE,
        tiles: [
            {
                x: 0,
                y: 0,
                layer: 0,
                height: 256,
                width: 256,
            },
        ],
        assert: {
            lengthTiles: 1,
            index: { x: 256, y: 256 },
            value: 2.72519,
        }
    },
    addRequiredTilesGroup: [
        {
            fileId: 0,
            tiles: [16781313], // Hex1001001
            compressionType: CARTA.CompressionType.NONE,
        },
        {
            fileId: 0,
            tiles: [33566723], // Hex2003003
            compressionType: CARTA.CompressionType.NONE,
        },
        {
            fileId: 0,
            tiles: [50360327], // Hex3007007
            compressionType: CARTA.CompressionType.NONE,
        },
        {
            fileId: 0,
            tiles: [67170319], // Hex400F00F
            compressionType: CARTA.CompressionType.NONE,
        },
    ],
    rasterTileDataGroup: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.NONE,
            tiles: [
                {
                    x: 1,
                    y: 1,
                    layer: 1,
                    height: 256,
                    width: 256,
                },
            ],
            assert: {
                lengthTiles: 1,
                index: { x: 256, y: 256 },
                value: 2.85753,
            }
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.NONE,
            tiles: [
                {
                    x: 3,
                    y: 3,
                    layer: 2,
                    height: 256,
                    width: 256,
                },
            ],
            assert: {
                lengthTiles: 1,
                index: { x: 256, y: 256 },
                value: 2.40348,
            }
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.NONE,
            tiles: [
                {
                    x: 7,
                    y: 7,
                    layer: 3,
                    height: 256,
                    width: 256,
                },
            ],
            assert: {
                lengthTiles: 1,
                index: { x: 256, y: 256 },
                value: 2.99947,
            }
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.NONE,
            tiles: [
                {
                    x: 15,
                    y: 15,
                    layer: 4,
                    height: 256,
                    width: 256,
                },
            ],
            assert: {
                lengthTiles: 1,
                index: { x: 256, y: 256 },
                value: 3.74704,
            }
        },
    ],
}

describe("CHECK_RASTER_TILE_DATA test: Testing data values at different layers in RASTER_TILE_DATA", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        });

        describe(`Open image "${assertItem.fileOpen.file}"`, () => {
            let OpenFileAckTemp: CARTA.OpenFileAck;
            let ack: any = [];
            test(`OPEN_FILE_ACK should arrive within ${openFileTimeout} ms.`, async () => {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                ack.push(await Connection.receiveAny());
                ack.push(await Connection.receiveAny()); // OpenFileAck | RegionHistogramData
                OpenFileAckTemp = ack.find(r => r.constructor.name === "OpenFileAck") as CARTA.OpenFileAck;
            }, openFileTimeout);

            test(`OPEN_FILE_ACK.success = ${assertItem.fileOpenAck.success}`, () => {
                expect(OpenFileAckTemp.success).toBe(assertItem.fileOpenAck.success);
            });

            test(`OPEN_FILE_ACK.file_info.tile_size = ${assertItem.fileOpenAck.tileSize}`, () => {
                expect(OpenFileAckTemp.tileSize).toEqual(assertItem.fileOpenAck.tileSize);
            });

        });

        describe(`SET_IMAGE_CHANNELS on the file "${assertItem.fileOpen.file}"`, () => {
            let RasterTileDataTemp: CARTA.RasterTileData;
            test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel);
                RasterTileDataTemp = await Connection.receive(CARTA.RasterTileData);
            }, readFileTimeout);

            test(`RASTER_TILE_DATA.file_id = ${assertItem.rasterTileData.fileId}`, () => {
                expect(RasterTileDataTemp.fileId).toEqual(assertItem.rasterTileData.fileId);
            });

            test(`RASTER_TILE_DATA.channel = ${assertItem.rasterTileData.channel}`, () => {
                expect(RasterTileDataTemp.channel).toEqual(assertItem.rasterTileData.channel);
            });

            test(`RASTER_TILE_DATA.stokes = ${assertItem.rasterTileData.stokes}`, () => {
                expect(RasterTileDataTemp.stokes).toEqual(assertItem.rasterTileData.stokes);
            });

            test(`RASTER_TILE_DATA.compression_type = ${assertItem.rasterTileData.compressionType}`, () => {
                expect(RasterTileDataTemp.compressionType).toEqual(assertItem.rasterTileData.compressionType);
            });

            test(`RASTER_TILE_DATA.tiles.length = ${assertItem.rasterTileData.assert.lengthTiles}`, () => {
                expect(RasterTileDataTemp.tiles.length).toEqual(assertItem.rasterTileData.assert.lengthTiles);
            });

            test(`RASTER_TILE_DATA.tiles[0].x = ${assertItem.rasterTileData.tiles[0].x}`, () => {
                expect(RasterTileDataTemp.tiles[0].x).toEqual(assertItem.rasterTileData.tiles[0].x);
            });

            test(`RASTER_TILE_DATA.tiles[0].y = ${assertItem.rasterTileData.tiles[0].y}`, () => {
                expect(RasterTileDataTemp.tiles[0].y).toEqual(assertItem.rasterTileData.tiles[0].y);
            });

            test(`RASTER_TILE_DATA.tiles[0].layer = ${assertItem.rasterTileData.tiles[0].layer}`, () => {
                expect(RasterTileDataTemp.tiles[0].layer).toEqual(assertItem.rasterTileData.tiles[0].layer);
            });

            test(`RASTER_TILE_DATA.tiles[0].height = ${assertItem.rasterTileData.tiles[0].height}`, () => {
                expect(RasterTileDataTemp.tiles[0].height).toEqual(assertItem.rasterTileData.tiles[0].height);
            });

            test(`RASTER_TILE_DATA.tiles[0].width = ${assertItem.rasterTileData.tiles[0].width}`, () => {
                expect(RasterTileDataTemp.tiles[0].width).toEqual(assertItem.rasterTileData.tiles[0].width);
            });

            test(`RASTER_TILE_DATA.tiles[0].image_data${JSON.stringify(assertItem.rasterTileData.assert.index)} = ${assertItem.rasterTileData.assert.value}`, () => {
                const _x = assertItem.rasterTileData.assert.index.x;
                const _y = assertItem.rasterTileData.assert.index.y;
                const _dataView = new DataView(RasterTileDataTemp.tiles[0].imageData.slice((_x * _y - 1) * 4, _x * _y * 4).buffer);
                expect(_dataView.getFloat32(0, true)).toBeCloseTo(assertItem.rasterTileData.assert.value, assertItem.precisionDigit);
            });

        });

        assertItem.rasterTileDataGroup.map((rasterTileData, index) => {
            describe(`ADD_REQUIRED_TILES [${assertItem.addRequiredTilesGroup[index].tiles}]`, () => {
                let RasterTileDataTemp: CARTA.RasterTileData;
                test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTilesGroup[index]);
                    RasterTileDataTemp = await Connection.receive(CARTA.RasterTileData);
                }, readFileTimeout);

                test(`RASTER_TILE_DATA.file_id = ${rasterTileData.fileId}`, () => {
                    expect(RasterTileDataTemp.fileId).toEqual(rasterTileData.fileId);
                });

                test(`RASTER_TILE_DATA.channel = ${rasterTileData.channel}`, () => {
                    expect(RasterTileDataTemp.channel).toEqual(rasterTileData.channel);
                });

                test(`RASTER_TILE_DATA.stokes = ${rasterTileData.stokes}`, () => {
                    expect(RasterTileDataTemp.stokes).toEqual(rasterTileData.stokes);
                });

                test(`RASTER_TILE_DATA.compression_type = ${rasterTileData.compressionType}`, () => {
                    expect(RasterTileDataTemp.compressionType).toEqual(rasterTileData.compressionType);
                });

                test(`RASTER_TILE_DATA.tiles.length = ${rasterTileData.assert.lengthTiles}`, () => {
                    expect(RasterTileDataTemp.tiles.length).toEqual(rasterTileData.assert.lengthTiles);
                });

                test(`RASTER_TILE_DATA.tiles[0].x = ${rasterTileData.tiles[0].x}`, () => {
                    expect(RasterTileDataTemp.tiles[0].x).toEqual(rasterTileData.tiles[0].x);
                });

                test(`RASTER_TILE_DATA.tiles[0].y = ${rasterTileData.tiles[0].y}`, () => {
                    expect(RasterTileDataTemp.tiles[0].y).toEqual(rasterTileData.tiles[0].y);
                });

                test(`RASTER_TILE_DATA.tiles[0].layer = ${rasterTileData.tiles[0].layer}`, () => {
                    expect(RasterTileDataTemp.tiles[0].layer).toEqual(rasterTileData.tiles[0].layer);
                });

                test(`RASTER_TILE_DATA.tiles[0].height = ${rasterTileData.tiles[0].height}`, () => {
                    expect(RasterTileDataTemp.tiles[0].height).toEqual(rasterTileData.tiles[0].height);
                });

                test(`RASTER_TILE_DATA.tiles[0].width = ${rasterTileData.tiles[0].width}`, () => {
                    expect(RasterTileDataTemp.tiles[0].width).toEqual(rasterTileData.tiles[0].width);
                });

                test(`RASTER_TILE_DATA.tiles[0].image_data${JSON.stringify(rasterTileData.assert.index)} = ${rasterTileData.assert.value}`, () => {
                    const _x = assertItem.rasterTileData.assert.index.x;
                    const _y = assertItem.rasterTileData.assert.index.y;
                    const _dataView = new DataView(RasterTileDataTemp.tiles[0].imageData.slice((_x * _y - 1) * 4, _x * _y * 4).buffer);
                    expect(_dataView.getFloat32(0, true)).toBeCloseTo(rasterTileData.assert.value, assertItem.precisionDigit);
                });

            });
        });
    });

    afterAll(() => Connection.close());
});