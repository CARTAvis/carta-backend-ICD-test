import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = 7000;
let readFileTimeout: number = 20000;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels[];
    setCursor: CARTA.ISetCursor[];
    addRequireTiles: CARTA.IAddRequiredTiles[];
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
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
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
    setCursor: [
        {
            file_id: 0,
            point: { x: 0, y: 0 },
        },
    ],
    addRequireTiles: [
        {
            fileId: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [67141640, 67145736, 67145737, 67141641, 67137545, 67137544, 67137543, 67141639, 67145735, 67149831, 67149832, 67149833, 67149834, 67145738, 67141642, 67137546, 67133450, 67133449, 67133448, 67133447, 67133446, 67137542, 67141638, 67145734, 67149830, 67153926, 67153927, 67153928, 67153929, 67153930, 67153931, 67149835, 67145739, 67141643, 67137547, 67133451, 67129355, 67129354, 67129353, 67129352, 67129351, 67129350, 67129349, 67133445, 67137541, 67141637, 67145733, 67149829, 67153925, 67158021, 67158022, 67158023, 67158024, 67158025, 67158026, 67158027, 67158028, 67153932, 67149836, 67145740, 67141644, 67137548, 67133452, 67129356, 67125260, 67125259, 67125258, 67125257, 67125256, 67125255, 67125254, 67125253, 67125252, 67129348, 67133444, 67137540, 67141636, 67145732, 67149828, 67153924, 67158020],
        },
    ],
}

describe("PERF_RASTER_TILE_DATA", () => {

    assertItem.fileOpen.map((fileOpen: CARTA.IOpenFile, index) => {
        let Connection: Client;
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);


        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, connectTimeout);

            describe(`open the file "${fileOpen.directory}/${assertItem.fileOpen[index].file}"`, () => {
                test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.OpenFile, fileOpen);
                    await Connection.receiveAny()
                    await Connection.receiveAny() // OpenFileAck | RegionHistogramData
                }, openFileTimeout);

                test(`One RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
                    await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length);
                }, readFileTimeout);

                test(`81 RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addRequireTiles[0]);
                    await Connection.stream(assertItem.addRequireTiles[0].tiles.length);
                }, readFileTimeout);

            });

        });
        afterAll(() => Connection.close());
    });

});