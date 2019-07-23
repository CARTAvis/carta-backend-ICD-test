import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
interface AssertItem {
    precisionDigit: number;
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    fileOpenAck: CARTA.IOpenFileAck;
    regionHistogram: CARTA.IRegionHistogramData;
    setImageChannel: CARTA.ISetImageChannels;
}
let assertItem: AssertItem = {
    precisionDigit: 4,
    register: {
        sessionId: 0,
        apiKey: "",
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
}

describe(`TILE_DATA_ORDER test: Testing the order of returning tiles`, () => {   
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
            test(`RASTER_TILE_DATA x${assertItem.setImageChannel.requiredTiles.tiles.length} should arrive within ${readFileTimeout} ms`, async () => {
                await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannel);
                ack = <Utility.AckStream> await Utility.getStreamAsync(Connection, assertItem.setImageChannel.requiredTiles.tiles.length);
                expect(ack.RasterTileData.length).toEqual(assertItem.setImageChannel.requiredTiles.tiles.length);
            }, readFileTimeout);

            test(`Tile "${assertItem.setImageChannel.requiredTiles.tiles[0]}" might return first`, () => {
                let _encodeTile = (ack.RasterTileData[0].tiles[0].layer << 24) | (ack.RasterTileData[0].tiles[0].y << 12) | ack.RasterTileData[0].tiles[0].x;
                if (_encodeTile !== assertItem.setImageChannel.requiredTiles.tiles[0]) {
                    console.warn(`First tile: "${_encodeTile}" inequal to "${assertItem.setImageChannel.requiredTiles.tiles[0]}"`);
                }
                expect(_encodeTile).toEqual(assertItem.setImageChannel.requiredTiles.tiles[0]);
            });

            test(`RASTER_TILE_DATA.tiles should contain ${assertItem.setImageChannel.requiredTiles.tiles.length} tiles`, () => {
                let _seq: number[] = [];
                assertItem.setImageChannel.requiredTiles.tiles.map(tile => {
                    let _index: number = ack.RasterTileData.findIndex(data => ((data.tiles[0].layer << 24) | (data.tiles[0].y << 12) | data.tiles[0].x) === tile);
                    expect(_index).toBeGreaterThanOrEqual(0);
                    _seq.push(_index + 1);
                });
                console.dir(`Sequence of retruned tiles: ${JSON.stringify(_seq)}`);
            });

        });
        
    }); 

    afterAll( () => {
        Connection.close();
    });
});