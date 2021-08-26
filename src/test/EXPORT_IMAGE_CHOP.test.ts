import { CARTA } from "carta-protobuf";
import { Client, IOpenFile, AckStream } from "./CLIENT";
import config from "./config.json";
import { execSync } from "child_process";

let testServerUrl: string = config.serverURL0;
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
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setRegion: [
        {
            fileId: 0,
            regionId: 100,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 200.0, y: 600.0 }, { x: 350.0, y: 350.0 }],
                rotation: 0.0,
            },
        },
        {
            fileId: 0,
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
            fileId: 0,
            outputFileName: "M17_SWex_Chop.fits",
            outputFileType: CARTA.FileType.FITS,
            regionId: 100,
            keepDegenerate: true,
        },
        {
            fileId: 0,
            outputFileName: "M17_SWex_Chop.image",
            outputFileType: CARTA.FileType.CASA,
            regionId: 100,
            keepDegenerate: true,
        },
    ],
    exportedFileOpen: [
        {
            file: "M17_SWex_Chop.fits",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            file: "M17_SWex_Chop.image",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannel: {
        fileId: 1,
        channel: 0,
        stokes: 0,
        requiredTiles: {
            fileId: 1,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
    },
}

describe("EXPORT_IMAGE_CHOP: Exporting of a chopped image", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        await Connection.openFile(assertItem.fileOpen);
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
                        await Connection.receive(CARTA.SaveFileAck);
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

        });
    });

    // afterAll(() => {
    //     Connection.close();
    //     describe(`Delete test image`,()=>{
    //         const output = execSync('rm -r /tmp/M17_SWex_Chop.fits /tmp/M17_SWex_Chop.image',{encoding: 'utf-8'});
    //         console.log(output);
    //     });
    // });
});