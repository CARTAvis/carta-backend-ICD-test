import { CARTA } from "carta-protobuf";
import { Client, IOpenFile } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.casa_varients;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    precisionDigit?: number;
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
    precisionDigit: 4,
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "componentlist.image",
            hdu: "",
            fileId: 200,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "concatenated.image",
            hdu: "",
            fileId: 201,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "pVimage.image",
            hdu: "",
            fileId: 202,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "UVamp.image",
            hdu: "",
            fileId: 203,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "UVphase.image",
            hdu: "",
            fileId: 204,
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
        {
            fileId: 202,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 202,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 203,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 203,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
            fileId: 204,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 204,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
}

describe("OPEN_IMAGE_CASA_VARIENTS: Testing the case of opening variant casa images", () => {
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
                    let OpenFileAck: CARTA.IOpenFileAck = ack.OpenFileAck;
                    expect(OpenFileAck).toMatchSnapshot({
                        fileInfoExtended: {
                            headerEntries: expect.any(Object),
                        },
                    });
                    OpenFileAck.fileInfoExtended.headerEntries.map(item => {
                        if (item["numericValue"]) {
                            expect(item).toMatchSnapshot({
                                numericValue: expect.any(Number),
                            });
                            expect(item["numericValue"].toExponential(assertItem.precisionDigit)).toMatchSnapshot();
                        } else {
                            expect(item).toMatchSnapshot();
                        }
                    });
                });

                test(`REGION_HISTOGRAM_DATA should match snapshot`, () => {
                    expect(ack.RegionHistogramData).toMatchSnapshot({
                        histograms: expect.any(Object),
                    });
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