import { CARTA } from "carta-protobuf";
import { Client, IOpenFile } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
interface IRasterTileDataExt extends CARTA.IRasterTileData {
    tilesLength: number;
}
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
    fileOpenAckGroup: CARTA.IOpenFileAck[];
    regionHistogramDataGroup: CARTA.IRegionHistogramData[];
    setImageChannelGroup: CARTA.ISetImageChannels[];
    addRequiredTilesGroup: CARTA.IAddRequiredTiles[];
    rasterTileDataGroup: IRasterTileDataExt[];
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "M17_SWex.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.miriad",
            hdu: "",
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            hdu: "",
            fileId: 3,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    fileOpenAckGroup: [
        {
            success: true,
            fileId: 0,
        },
        {
            success: true,
            fileId: 1,
        },
        {
            success: true,
            fileId: 2,
        },
        {
            success: true,
            fileId: 3,
        },
    ],
    regionHistogramDataGroup: [
        {
            fileId: 0,
            stokes: 0,
            regionId: -1,
            progress: 1,
        },
        {
            fileId: 1,
            stokes: 0,
            regionId: -1,
            progress: 1,
        },
        {
            fileId: 2,
            stokes: 0,
            regionId: -1,
            progress: 1,
        },
        {
            fileId: 3,
            stokes: 0,
            regionId: -1,
            progress: 1,
        },
    ],
    setImageChannelGroup: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 1,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 2,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 2,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 3,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 3,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
    addRequiredTilesGroup: [
        {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 1,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 2,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 3,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    ],
    rasterTileDataGroup: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tilesLength: 1,
            tiles: [
                {
                    x: 0,
                    y: 0,
                    layer: 0,
                    width: 160,
                    height: 200,
                },
            ],
        },
        {
            fileId: 1,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tilesLength: 1,
            tiles: [
                {
                    x: 0,
                    y: 0,
                    layer: 0,
                    width: 160,
                    height: 200,
                },
            ],
        },
        {
            fileId: 2,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tilesLength: 1,
            tiles: [
                {
                    x: 0,
                    y: 0,
                    layer: 0,
                    width: 160,
                    height: 200,
                },
            ],
        },
        {
            fileId: 3,
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tilesLength: 1,
            tiles: [
                {
                    x: 0,
                    y: 0,
                    layer: 0,
                    width: 160,
                    height: 200,
                },
            ],
        },
    ],
}

describe("OPEN_IMAGE_APPEND: Testing the case of opening multiple images one by one without closing former ones", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);


    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        }, connectTimeout);

        assertItem.fileOpenAckGroup.map((fileOpenAck: CARTA.IOpenFileAck, index) => {

            describe(`open the file "${assertItem.fileOpenGroup[index].file}"`, () => {
                let ack: IOpenFile;
                test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    ack = await Connection.openFile(assertItem.fileOpenGroup[index]);
                }, openFileTimeout);

                test(`OPEN_FILE_ACK.success = ${fileOpenAck.success}`, () => {
                    expect(ack.OpenFileAck.success).toBe(fileOpenAck.success);
                });

                test(`OPEN_FILE_ACK.file_id = ${fileOpenAck.fileId}`, () => {
                    expect(ack.OpenFileAck.fileId).toEqual(fileOpenAck.fileId);
                });

                test(`REGION_HISTOGRAM_DATA.file_id = ${assertItem.regionHistogramDataGroup[index].fileId}`, () => {
                    expect(ack.RegionHistogramData.fileId).toEqual(assertItem.regionHistogramDataGroup[index].fileId);
                });

                test(`REGION_HISTOGRAM_DATA.stokes = ${assertItem.regionHistogramDataGroup[index].stokes}`, () => {
                    expect(ack.RegionHistogramData.stokes).toEqual(assertItem.regionHistogramDataGroup[index].stokes);
                });

                test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramDataGroup[index].regionId}`, () => {
                    expect(ack.RegionHistogramData.regionId).toEqual(assertItem.regionHistogramDataGroup[index].regionId);
                });

                test(`REGION_HISTOGRAM_DATA.progress = ${assertItem.regionHistogramDataGroup[index].progress}`, () => {
                    expect(ack.RegionHistogramData.progress).toEqual(assertItem.regionHistogramDataGroup[index].progress);
                });

            });

            describe(`set image channel for the file "${assertItem.fileOpenGroup[index].file}"`, () => {
                let RasterTileDataTemp: CARTA.RasterTileData;
                test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannelGroup[index]);
                    RasterTileDataTemp = await Connection.receive(CARTA.RasterTileData);
                }, readFileTimeout);

                test(`RASTER_TILE_DATA.file_id = ${assertItem.rasterTileDataGroup[index].fileId}`, () => {
                    expect(RasterTileDataTemp.fileId).toEqual(assertItem.rasterTileDataGroup[index].fileId);
                });

                test(`RASTER_TILE_DATA.channel = ${assertItem.rasterTileDataGroup[index].channel}`, () => {
                    expect(RasterTileDataTemp.channel).toEqual(assertItem.rasterTileDataGroup[index].channel);
                });

                test(`RASTER_TILE_DATA.stokes = ${assertItem.rasterTileDataGroup[index].stokes}`, () => {
                    expect(RasterTileDataTemp.stokes).toEqual(assertItem.rasterTileDataGroup[index].stokes);
                });

                test(`RASTER_TILE_DATA.compression_quality = ${assertItem.rasterTileDataGroup[index].compressionQuality}`, () => {
                    expect(RasterTileDataTemp.compressionQuality).toEqual(assertItem.rasterTileDataGroup[index].compressionQuality);
                });

                test(`RASTER_TILE_DATA.compression_type = ${assertItem.rasterTileDataGroup[index].compressionType}`, () => {
                    expect(RasterTileDataTemp.compressionType).toEqual(assertItem.rasterTileDataGroup[index].compressionType);
                });

                test(`RASTER_TILE_DATA.tiles.length = ${assertItem.rasterTileDataGroup[index].compressionQuality}`, () => {
                    expect(RasterTileDataTemp.compressionQuality).toEqual(assertItem.rasterTileDataGroup[index].compressionQuality);
                });

                test(`RASTER_TILE_DATA.tiles[0].x = ${assertItem.rasterTileDataGroup[index].tiles[0].x}`, () => {
                    expect(RasterTileDataTemp.tiles[0].x).toEqual(assertItem.rasterTileDataGroup[index].tiles[0].x);
                });

                test(`RASTER_TILE_DATA.tiles[0].y = ${assertItem.rasterTileDataGroup[index].tiles[0].y}`, () => {
                    expect(RasterTileDataTemp.tiles[0].y).toEqual(assertItem.rasterTileDataGroup[index].tiles[0].y);
                });

                test(`RASTER_TILE_DATA.tiles[0].layer = ${assertItem.rasterTileDataGroup[index].tiles[0].layer}`, () => {
                    expect(RasterTileDataTemp.tiles[0].layer).toEqual(assertItem.rasterTileDataGroup[index].tiles[0].layer);
                });

                test(`RASTER_TILE_DATA.tiles[0].width = ${assertItem.rasterTileDataGroup[index].tiles[0].width}`, () => {
                    expect(RasterTileDataTemp.tiles[0].width).toEqual(assertItem.rasterTileDataGroup[index].tiles[0].width);
                });

                test(`RASTER_TILE_DATA.tiles[0].height = ${assertItem.rasterTileDataGroup[index].tiles[0].height}`, () => {
                    expect(RasterTileDataTemp.tiles[0].height).toEqual(assertItem.rasterTileDataGroup[index].tiles[0].height);
                });

                test(`RASTER_TILE_DATA.tiles[0].image_data.length > 0`, () => {
                    expect(RasterTileDataTemp.tiles[0].imageData.length).toBeGreaterThan(0);
                });

                test(`RASTER_TILE_DATA.tiles[0].nan_encodings.length > 0`, () => {
                    expect(RasterTileDataTemp.tiles[0].nanEncodings.length).toBeGreaterThan(0);
                });

            });

        });
    });

    afterAll(() => Connection.close());
});