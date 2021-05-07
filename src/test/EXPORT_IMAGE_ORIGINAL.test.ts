import { CARTA } from "carta-protobuf";
import { Client, IOpenFile } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let saveSubdirectory: string = config.path.save;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let saveFileTimeout: number = config.timeout.saveFile;
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    precisionDigit?: number;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    saveFile: CARTA.ISaveFile[];
    exportedFileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels;
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    precisionDigit: 4,
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 200,
        renderMode: CARTA.RenderMode.RASTER,
    },
    saveFile: [
        {
            fileId: 200,
            outputFileDirectory: saveSubdirectory,
            outputFileName: "M17_SWex.fits",
            outputFileType: CARTA.FileType.FITS,
            keepDegenerate: true,
        },
        {
            fileId: 200,
            outputFileDirectory: saveSubdirectory,
            outputFileName: "M17_SWex.image",
            outputFileType: CARTA.FileType.CASA,
            keepDegenerate: true,
        },
    ],
    exportedFileOpen: [
        {
            directory: saveSubdirectory,
            file: "M17_SWex.fits",
            hdu: "",
            fileId: 300,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: saveSubdirectory,
            file: "M17_SWex.image",
            hdu: "",
            fileId: 300,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannel: {
        fileId: 300,
        channel: 0,
        stokes: 0,
        requiredTiles: {
            fileId: 300,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
    },
}

describe("EXPORT_IMAGE_ORIGINAL: Exporting of an image without modification", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        await Connection.openFile(assertItem.fileOpen);
    }, openFileTimeout);

    assertItem.saveFile.map((saveFile, fileIndex) => {

        describe(`try to save image "${saveFile.outputFileName}"`, () => {
            test(`save image`, async () => {
                await Connection.send(CARTA.SaveFile, saveFile);
                await Connection.receiveAny();
            }, saveFileTimeout);

            describe(`reopen the exported file "${saveFile.outputFileName}"`, () => {
                let ack: IOpenFile;
                test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    ack = await Connection.openFile(assertItem.exportedFileOpen[fileIndex]);
                }, openFileTimeout);

                test(`OPEN_FILE_ACK.fileInfoExtended.computedEntries['Shape'] = [640, 800, 25, 1]`, () => {
                    let OpenFileAck: CARTA.IOpenFileAck = ack.OpenFileAck;
                    expect(OpenFileAck.fileInfoExtended.computedEntries.find(o => o.name == 'Shape').value).toMatchSnapshot();
                });

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

            describe(`request raster image of the file "${saveFile.outputFileName}"`, () => {
                let RasterTileDataTemp: CARTA.RasterTileData;
                test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel);
                    RasterTileDataTemp = await Connection.receive(CARTA.RasterTileData);
                }, readFileTimeout);

                test(`RASTER_TILE_DATA should match snapshot`, () => {
                    expect(RasterTileDataTemp).toMatchSnapshot();
                });

                afterAll(async () => {
                    await Connection.send(CARTA.CloseFile, { fileId: assertItem.setImageChannel.fileId });
                });
            });

        });
    });

    afterAll(() => Connection.close());
});