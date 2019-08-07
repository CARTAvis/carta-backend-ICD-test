import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
interface IRasterTileDataExt extends CARTA.IRasterTileData {
    assert: {
        lengthTiles: number,
        index?: {x: number, y: number}, 
        value?: number,
    }[];
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
    filelist: {directory: testSubdirectory},    
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
    setImageChannel: {
        fileId: 0,
        channel: 0,
        stokes: 0,
        requiredTiles: {
            fileId: 0,
            tiles: [16777216, 16781312, 16777217, 16781313],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    },
    rasterTileData:{
        fileId: 0,
        channel: 0,
        stokes: 0,
        compressionType: CARTA.CompressionType.ZFP,
        compressionQuality: 11,
        tiles: [
            {x: 0, y: 0, layer: 1,},
            {x: 1, y: 0, layer: 1,},
            {x: 0, y: 1, layer: 1,},
            {x: 1, y: 1, layer: 1,},
        ],
        assert: [
            {lengthTiles: 1,},
            {lengthTiles: 1,},
            {lengthTiles: 1,},
            {lengthTiles: 1,},
        ],
    },
    addRequiredTilesGroup: [
        {
            fileId: 0,
            tiles:  [33558529, 33562626, 33566723, 33570820],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 0,
            tiles:  [50364424],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    ],
    rasterTileDataGroup: [
        {
            tiles: [
                {x: 1, y: 1, layer: 2,},
                {x: 2, y: 2, layer: 2,},
                {x: 3, y: 3, layer: 2,},
            ],
            assert: [
                {lengthTiles: 1,},
                {lengthTiles: 1,},
                {lengthTiles: 1,},
            ],
        },
        {
            tiles: [],
            assert: [],
        },
    ],
}

describe(`TILE_DATA_REQUEST test: Testing tile requesting messages "SET_IMAGE_CHANNELS" and "ADD_REQUIRED_TILES"`, () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();   
        }
    }, connectTimeout);
    
    describe(`Go to "${testSubdirectory}" folder`, () => {

        beforeAll( async () => {            
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, assertItem.fileOpen);
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
        });
        
        describe(`SET_IMAGE_CHANNELS on the file "${assertItem.fileOpen.file}"`, () => {
            let ack: Utility.AckStream;
            test(`Only RASTER_TILE_DATA x${assertItem.rasterTileData.tiles.length} should arrive within ${readFileTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannel);
                ack = <Utility.AckStream> await Utility.getStreamAsync(Connection, assertItem.rasterTileData.tiles.length);
                expect(ack.RasterTileData.length).toEqual(assertItem.rasterTileData.tiles.length);
            }, readFileTimeout);

            test("Assert RASTER_TILE_DATA.tiles.length", () => {
                assertItem.rasterTileData.tiles.map( (tile, index) => {
                    let _length = ack.RasterTileData.find(data => (
                        data.tiles[0].x === tile.x && data.tiles[0].y === tile.y && data.tiles[0].layer === tile.layer
                    )).tiles.length;
                    expect(_length).toEqual(assertItem.rasterTileData.assert[index].lengthTiles);
                });
            });

            test(`Assert RASTER_TILE_DATA.tiles has ${JSON.stringify(assertItem.rasterTileData.tiles)}`, () => {                
                assertItem.rasterTileData.tiles.map( (tile, index) => {
                    let _tile = ack.RasterTileData.find(data => (
                        data.tiles[0].x === tile.x && data.tiles[0].y === tile.y && data.tiles[0].layer === tile.layer
                    )).tiles;
                    expect(_tile).toBeDefined();
                });
            });

        });

        assertItem.rasterTileDataGroup.map((rasterTileData, index) => {
            describe(`ADD_REQUIRED_TILES [${assertItem.addRequiredTilesGroup[index].tiles}]`, () => {
                let ack: Utility.AckStream;
                if (rasterTileData.tiles.length) {
                    test(`RASTER_TILE_DATA x${rasterTileData.tiles.length} should arrive within ${readFileTimeout} ms`, async () => {
                        await Utility.setEventAsync(Connection, CARTA.AddRequiredTiles, assertItem.addRequiredTilesGroup[index]);
                        ack = <Utility.AckStream> await Utility.getStreamAsync(Connection, rasterTileData.tiles.length);
                        expect(ack.RasterTileData.length).toEqual(rasterTileData.tiles.length);
                    }, readFileTimeout);

                    test("Assert RASTER_TILE_DATA.tiles.length", () => {
                        rasterTileData.tiles.map( (tile, index) => {
                            let _length = ack.RasterTileData.find(data => (
                                data.tiles[0].x === tile.x && data.tiles[0].y === tile.y && data.tiles[0].layer === tile.layer
                            )).tiles.length;
                            expect(_length).toEqual(rasterTileData.assert[index].lengthTiles);
                        });
                    });
                } else {
                    test(`RASTER_TILE_DATA should not arrive within ${readFileTimeout} ms`, async () => {
                        await Utility.setEventAsync(Connection, CARTA.AddRequiredTiles, assertItem.addRequiredTilesGroup[index]);
                        await Utility.getEventAsync(Connection, CARTA.RasterTileData, readFileTimeout * .5);
                    }, readFileTimeout);
                }
                
                test("Backend be still alive", () => {
                    expect(Connection.readyState).toEqual(WebSocket.OPEN);
                });
            });
        });
    }); 

    afterAll( () => {
        Connection.close();
    });
});