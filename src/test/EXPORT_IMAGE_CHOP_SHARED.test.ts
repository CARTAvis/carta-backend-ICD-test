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
    fileOpen: CARTA.IOpenFile[];
    setRegion: CARTA.ISetRegion[];
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
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "M17_SWex.fits",
            hdu: "",
            fileId: 200,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            hdu: "",
            fileId: 201,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setRegion: [
        {
            fileId: 200,
            regionId: 100,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 200.0, y: 600.0 }, { x: 350.0, y: 350.0 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 200,
            regionId: 100,
            regionInfo: {
                regionType: CARTA.RegionType.POLYGON,
                controlPoints: [{ x: 25.0, y: 775.0 }, { x: 375.0, y: 775.0 }, { x: 375.0, y: 425.0 }, { x: 25.0, y: 425.0 }],
                rotation: 0.0,
            },
        },
    ],
    saveFile: [
        {
            fileId: 201,
            outputFileName: "M17_SWex_Chop_Shared.fits",
            outputFileType: CARTA.FileType.FITS,
            regionId: 100,
            keepDegenerate: true,
        },
        {
            fileId: 201,
            outputFileName: "M17_SWex_Chop_Shared.image",
            outputFileType: CARTA.FileType.CASA,
            regionId: 100,
            keepDegenerate: true,
        },
    ],
    exportedFileOpen: [
        {
            file: "M17_SWex_Chop_Shared.fits",
            hdu: "",
            fileId: 300,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            file: "M17_SWex_Chop_Shared.image",
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

describe("EXPORT_IMAGE_CHOP_SHARED: Exporting of a chopped image via the shared region", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        for (let fileOpen of assertItem.fileOpen) {
            await Connection.openFile(fileOpen);
        }
    }, openFileTimeout);

    assertItem.setRegion.map((region, regionIndex) => {
        describe(`set a ${CARTA.RegionType[region.regionInfo.regionType]} region`, () => {
            test(`set region`, async () => {
                await Connection.send(CARTA.SetRegion, region);
                await Connection.receiveAny();
            }, saveFileTimeout);

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

                        test(`OPEN_FILE_ACK.fileInfoExtended.computedEntries['Shape'] = [351, 351, 25, 1]`, () => {
                            expect(OpenFileAck.fileInfoExtended.computedEntries.find(o => o.name == 'Shape').value).toMatchSnapshot();
                        });

                        test(`OPEN_FILE_ACK should match snapshot`, () => {
                            expect(OpenFileAck).toMatchSnapshot();
                        });
                    });

                    describe(`request raster image of the file "${saveFile.outputFileName}"`, () => {
                        let RasterTileDataTemp: CARTA.RasterTileData;
                        test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                            await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel);
                            RasterTileDataTemp = await Connection.receive(CARTA.RasterTileData);
                            expect(RasterTileDataTemp.tiles.length).toEqual(assertItem.setImageChannel.requiredTiles.tiles.length);
                        }, readFileTimeout);

                        afterAll(async () => {
                            await Connection.send(CARTA.CloseFile, { fileId: assertItem.setImageChannel.fileId });
                        });
                    });

                });
            });

        });
    });

    afterAll(() => {
        Connection.close();
        describe(`Delete test image`,()=>{
            const output = execSync('rm -r /tmp/M17_SWex_Chop_Shared.fits /tmp/M17_SWex_Chop_Shared.image',{encoding: 'utf-8'});
            console.log(output);
        });
    });
});