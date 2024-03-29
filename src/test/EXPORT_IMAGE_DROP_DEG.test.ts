import { CARTA } from "carta-protobuf";
import { Client, IOpenFile, AckStream } from "./CLIENT";
import config from "./config.json";
import { execSync } from "child_process";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let tmpdirectory: string = config.path.save;
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
            outputFileName: "M17_SWex_Drop_Deg.fits",
            outputFileType: CARTA.FileType.FITS,
            keepDegenerate: false,
        },
        {
            fileId: 200,
            outputFileName: "M17_SWex_Drop_Deg.image",
            outputFileType: CARTA.FileType.CASA,
            keepDegenerate: false,
        },
    ],
    exportedFileOpen: [
        {
            file: "M17_SWex_Drop_Deg.fits",
            hdu: "",
            fileId: 300,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            file: "M17_SWex_Drop_Deg.image",
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

describe("EXPORT_IMAGE_DROP_DEG: Exporting of an image without modification but only drop degenerated axes", () => {
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
                await Connection.send(CARTA.SaveFile, {
                    outputFileDirectory: tmpdirectory,
                    ...saveFile});
                await Connection.receiveAny();
            }, saveFileTimeout);

            describe(`reopen the exported file "${saveFile.outputFileName}"`, () => {
                let OpenFileAck: CARTA.IOpenFileAck
                test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.OpenFile,{
                        directory: tmpdirectory,
                        ...assertItem.exportedFileOpen[fileIndex]});
                    let responses = await Connection.stream(2) as AckStream;
                    OpenFileAck = responses.Responce[0];
                }, openFileTimeout);

                test(`OPEN_FILE_ACK.fileInfoExtended.computedEntries['Shape'] = [640, 800, 25]`, () => {
                    expect(OpenFileAck.fileInfoExtended.computedEntries.find(o => o.name == 'Shape').value).toMatchSnapshot();
                });

                test(`OPEN_FILE_ACK should match snapshot`, () => {
                    expect(OpenFileAck).toMatchSnapshot({
                        fileInfoExtended: {
                            headerEntries: expect.any(Object)
                        },
                    });
                    OpenFileAck.fileInfoExtended.headerEntries.map(item => {
                        if(item.name === "DATE"){
                            expect(item).toMatchSnapshot({
                                value: expect.any(String)
                            })
                        } else {
                            expect(item).toMatchSnapshot();
                        }
                    })
                });
            });

            describe(`request raster image of the file "${saveFile.outputFileName}"`, () => {
                let RasterTileDataTemp: CARTA.RasterTileData;
                test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel);
                    let temp2 = await Connection.stream(3);  //RasterTileerTile * 1 + RasterTileSync * 2(start & end)
                    RasterTileDataTemp = temp2.RasterTileData[0]
                    expect(RasterTileDataTemp.tiles.length).toEqual(assertItem.setImageChannel.requiredTiles.tiles.length);
                }, readFileTimeout);

                afterAll(async () => {
                    await Connection.send(CARTA.CloseFile, { fileId: assertItem.setImageChannel.fileId });
                });
            });

        });
    });

    afterAll(() => {
        Connection.close();
        describe(`Delete test image`,()=>{
            const output = execSync('rm -r /tmp/M17_SWex_Drop_Deg.fits /tmp/M17_SWex_Drop_Deg.image',{encoding: 'utf-8'});
            console.log(output);
        });
    });
});