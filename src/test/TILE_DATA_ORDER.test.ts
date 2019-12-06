import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
interface SetImageChannelsExt extends CARTA.ISetImageChannels {
    rank: number;
}
interface AssertItem {
    precisionDigit: number;
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    fileOpenAck: CARTA.IOpenFileAck;
    regionHistogram: CARTA.IRegionHistogramData;
    setImageChannel: SetImageChannelsExt[];
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
    fileOpenAck: {},
    regionHistogram: {},
    setImageChannel: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            rank: 9,
            requiredTiles: {
                fileId: 0,
                tiles: [
                    50343939,
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
                    50356224,
                ],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            rank: 9,
            requiredTiles: {
                fileId: 0,
                tiles: [
                    33558529,
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
                    33554435,
                ],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            rank: 2,
            requiredTiles: {
                fileId: 0,
                tiles: [
                    16777216,
                    16781312,
                    16781313,
                    16777217,
                ],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
}

describe(`TILE_DATA_ORDER test: Testing the order of returning tiles`, () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    assertItem.setImageChannel.map(setImageChannel => {
        describe(`Go to "${testSubdirectory}" folder`, () => {

            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                await Connection.receiveAny();
                await Connection.receiveAny(); // OpenFileAck | RegionHistogramData
            });

            describe(`SET_IMAGE_CHANNELS on the file "${assertItem.fileOpen.file}" with ${setImageChannel.requiredTiles.tiles.length} tiles`, () => {
                let ack: AckStream;
                test(`RASTER_TILE_DATA x${setImageChannel.requiredTiles.tiles.length} should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, setImageChannel);
                    ack = await Connection.stream(setImageChannel.requiredTiles.tiles.length) as AckStream;
                    expect(ack.RasterTileData.length).toEqual(setImageChannel.requiredTiles.tiles.length);
                }, readFileTimeout);

                test(`Tile "${setImageChannel.requiredTiles.tiles[0]}" should return within the ${setImageChannel.rank > 2 ? setImageChannel.rank + "th" : setImageChannel.rank > 1 ? setImageChannel.rank + "nd" : setImageChannel.rank + "st"} rank`, () => {
                    let _encodeTile = (ack.RasterTileData[0].tiles[0].layer << 24) | (ack.RasterTileData[0].tiles[0].y << 12) | ack.RasterTileData[0].tiles[0].x;
                    expect(setImageChannel.requiredTiles.tiles.slice(0, setImageChannel.rank).findIndex(f => f === _encodeTile) >= 0).toBe(true);
                });

                test(`RASTER_TILE_DATA.tiles should contain ${setImageChannel.requiredTiles.tiles.length} tiles`, () => {
                    let _seq: number[] = [];
                    setImageChannel.requiredTiles.tiles.map(tile => {
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