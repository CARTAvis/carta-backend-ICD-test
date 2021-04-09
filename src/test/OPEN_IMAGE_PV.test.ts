import { CARTA } from "carta-protobuf";
import { Client, IOpenFile } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels[];
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "M17_SWex_pv.fits",
            hdu: "",
            fileId: 200,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex_pv.image",
            hdu: "",
            fileId: 201,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannel: [
        {
            fileId: 200,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 200,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 201,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 201,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
}

describe("OPEN_IMAGE_PV: Testing the case of opening multiple images one by one without closing former ones", () => {
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

        assertItem.fileOpen.map((fileOpen: CARTA.IOpenFile, index) => {

            describe(`open/append the file "${fileOpen.file}"`, () => {
                let ack: IOpenFile;
                test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    ack = await Connection.openFile(fileOpen);
                }, openFileTimeout);

                test(`OPEN_FILE_ACK should match snapshot`, () => {
                    expect(ack.OpenFileAck).toMatchSnapshot();
                });

                test(`REGION_HISTOGRAM_DATA should match snapshot`, () => {
                    expect(ack.RegionHistogramData.fileId).toMatchSnapshot();
                    expect(ack.RegionHistogramData.progress).toMatchSnapshot();
                    expect(ack.RegionHistogramData.regionId).toMatchSnapshot();
                    expect(ack.RegionHistogramData.stokes).toMatchSnapshot();
                });
            });

            describe(`set image channel for the file "${fileOpen.file}"`, () => {
                let RasterTileDataTemp: CARTA.RasterTileData;
                test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[index]);
                    RasterTileDataTemp = await Connection.receive(CARTA.RasterTileData);
                }, readFileTimeout);

                test(`RASTER_TILE_DATA should match snapshot`, () => {
                    expect(RasterTileDataTemp).toMatchSnapshot();
                });
            });

        });
    });

    afterAll(() => Connection.close());
});