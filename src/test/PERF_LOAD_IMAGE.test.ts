import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config2.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = 7000;
let readFileTimeout: number = 5000;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels[];
    setCursor: CARTA.ISetCursor[];
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
            file: "cube_A_02400_z00100.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_04800_z00100.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_19200_z00100.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_02400_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_04800_z00100.image",
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
            file: "cube_A_19200_z00100.image",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_02400_z00100.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_04800_z00100.hdf5",
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
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_19200_z00100.hdf5",
            hdu: "0",
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
                tiles: [33558529, 33558528, 33554433, 33554432, 33562625, 33558530, 33562624, 33554434, 33562626],
            },
        },
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 0, y: 0 },
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

                test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
                    await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length);
                }, readFileTimeout);

            });

        });
        afterAll(() => Connection.close());
    });

});