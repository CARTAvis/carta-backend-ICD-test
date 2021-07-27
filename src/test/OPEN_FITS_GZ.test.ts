import { CARTA } from "carta-protobuf";
import { Client, AckStream, IOpenFile } from "./CLIENT";
import config from "./config.json";

const WebSocket = require('isomorphic-ws');
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.compressed_fits;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addRequiredTiles: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "tu2310418.fits.gz",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
}

describe("Open a fit.gz image:", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        let ack = await Connection.openFile(assertItem.openFile) as IOpenFile;
        expect(ack.OpenFileAck.success).toBe(true);
        expect(ack.OpenFileAck.fileInfo.name).toEqual(assertItem.openFile.file);
    }, openFileTimeout);

    // let ack: AckStream;
    // test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
    //     await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequiredTiles);
    //     await Connection.send(CARTA.SetCursor, assertItem.setCursor);
    //     await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
    //     ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
    //     expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
    //     expect(ack.RasterTileData.length).toEqual(assertItem.addRequiredTiles.tiles.length); //only 1 Tile returned
    // }, readFileTimeout);

    afterAll(() => Connection.close());
});