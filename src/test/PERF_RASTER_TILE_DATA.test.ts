import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile; //7000
let readFileTimeout: number = 5000;//config.timeout.readFile; //5000

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setImageChannel: CARTA.ISetImageChannels[];
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.image",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33558529, 33558528, 33554433, 33554432, 33562625, 33558530, 33562624, 33554434, 33562626],
        },
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            // two tiles either works fine, the first one is the workable from KS, the second is from UI(layer=4)
            tiles: [67141640, 67145736, 67145737, 67141641, 67137545, 67137544, 67137543, 67141639, 67145735, 67133449, 67133448, 67133447, 67133446, 67137542, 67141638, 67145734, 67129353, 67129352, 67129351, 67129350, 67129349, 67133445, 67137541, 67141637, 67145733, 67125257, 67125256, 67125255, 67125254, 67125253, 67125252, 67129348, 67133444, 67137540, 67141636, 67145732],
            // tiles: [67121157, 67121158, 67125253, 67125254, 67117061, 67117062, 67121156, 67125252, 67121159, 67117060, 67125255, 67117063, 67121155, 67125251, 67117059, 67121160, 67125256, 67117064],
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setImageChannel: [
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
    ],
}

describe("PERF_LOAD_IMAGE", () => {

    assertItem.fileOpen.map((fileOpen: CARTA.IOpenFile, index) => {
        let Connection: Client;
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        // test(`Connection open? | `, () => {
        //     expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        // });

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, connectTimeout);

            describe(`open the file "${fileOpen.directory}/${assertItem.fileOpen[index].file}"`, () => {
                test(`(Step 1)"${assertItem.fileOpen[index].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.OpenFile, fileOpen);
                    await Connection.receiveAny()
                    await Connection.receiveAny() // OpenFileAck | RegionHistogramData
                }, openFileTimeout);

                let ack: AckStream;
                test(`(Step 1)"${assertItem.fileOpen[index].file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor);

                    ack = await Connection.stream(3) as AckStream;
                    // console.log(ack)
                }, readFileTimeout);

                let ack2: AckStream;
                test(`(Step 2)"${assertItem.fileOpen[index].file}" RasterTileData responses should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);

                    ack2 = await Connection.stream(assertItem.addTilesReq[1].tiles.length + 2) as AckStream;
                    // console.log(ack2)
                }, readFileTimeout);

                // console.log(assertItem.addTilesReq[1].tiles.length)
            });

        });
        afterAll(() => Connection.close());
    });

});
