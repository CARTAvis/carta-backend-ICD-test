import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
    fileOpenAckGroup: CARTA.IOpenFileAck[];
    setImageChannelGroup: CARTA.ISetImageChannels[];
    addRequiredTilesGroup: CARTA.IAddRequiredTiles[];
    rasterTileDataGroup: CARTA.IRasterTileData[];
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
    },
    filelist: {directory: testSubdirectory},    
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "M17_SWex.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            hdu: "0",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            hdu: "0",
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.miriad",
            hdu: "0",
            fileId: 3,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    fileOpenAckGroup: [
        {
            success: true,
            fileId: 0,
        },
        {
            success: true,
            fileId: 1,
        },
        {
            success: true,
            fileId: 2,
        },
        {
            success: true,
            fileId: 3,
        },
    ],
    setImageChannelGroup: [
        {
            fileId: 0,
            channel: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.NONE,
            },
        },
        {
            fileId: 1,
            channel: 0,
            requiredTiles: {
                fileId: 1,
                tiles: [0],
                compressionType: CARTA.CompressionType.NONE,
            },
        },
        {
            fileId: 2,
            channel: 0,
            requiredTiles: {
                fileId: 2,
                tiles: [0],
                compressionType: CARTA.CompressionType.NONE,
            },
        },
        {
            fileId: 3,
            channel: 0,
            requiredTiles: {
                fileId: 3,
                tiles: [0],
                compressionType: CARTA.CompressionType.NONE,
            },
        },
    ],
    addRequiredTilesGroup: [
        {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.NONE,
        },
        {
            fileId: 1,
            tiles: [0],
            compressionType: CARTA.CompressionType.NONE,
        },
        {
            fileId: 2,
            tiles: [0],
            compressionType: CARTA.CompressionType.NONE,
        },
        {
            fileId: 3,
            tiles: [0],
            compressionType: CARTA.CompressionType.NONE,
        },
    ],
    rasterTileDataGroup: [
        {fileId: 0},
        {fileId: 1},
        {fileId: 2},
        {fileId: 3},
    ],
}

describe("OPEN_IMAGE_APPEND test: Testing the case of opening multiple images one by one without closing former ones", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();   
        }
    }, connectTimeout);

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1});
        }, connectTimeout);

        assertItem.fileOpenAckGroup.map( (fileOpenAck: CARTA.IOpenFileAck, index) => {
                    
            describe(`open the file "${assertItem.fileOpenGroup[index].file}"`, () => {
                let OpenFileAckTemp: CARTA.OpenFileAck;
                test(`OPEN_FILE_ACK should arrive within ${openFileTimeout} ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.OpenFile, assertItem.fileOpenGroup[index]);
                    await Utility.getEventAsync(Connection, CARTA.OpenFileAck,  
                        (OpenFileAck: CARTA.OpenFileAck, resolve) => {
                            OpenFileAckTemp = OpenFileAck;
                            resolve();
                        }
                    );
                    await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
                }, openFileTimeout);

                test(`OPEN_FILE_ACK.success = ${fileOpenAck.success}`, () => {
                    expect(OpenFileAckTemp.success).toBe(fileOpenAck.success);
                });

                test(`OPEN_FILE_ACK.file_id = ${fileOpenAck.fileId}`, () => {                    
                    expect(OpenFileAckTemp.fileId).toEqual(fileOpenAck.fileId);
                });

            });

            describe(`add required tiles for the file "${assertItem.fileOpenGroup[index].file}"`, () => {
                let RasterTileDataTemp: CARTA.RasterTileData;
                test(`RASTER_TILE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannelGroup[index]);
                    // await Utility.setEventAsync(Connection, CARTA.AddRequiredTiles, assertItem.addRequiredTilesGroup[index]);
                    await Utility.getEventAsync(Connection, CARTA.RasterTileData,
                        (RasterTileData: CARTA.RasterTileData, resolve) => {
                            RasterTileDataTemp = RasterTileData;
                            resolve();
                        }
                    );
                }, readFileTimeout);

                test(`RASTER_TILE_DATA.file_id = ${assertItem.rasterTileDataGroup[index].fileId}`, () => {
                    expect(RasterTileDataTemp.fileId).toEqual(assertItem.rasterTileDataGroup[index].fileId);
                });

            });
            
        });
    });

    afterAll( () => {
        Connection.close();
    });
});