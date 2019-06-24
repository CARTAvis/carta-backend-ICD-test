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
    setImageViewGroup: CARTA.ISetImageView[],
    rasterImageDataGroup: CARTA.IRasterImageData[],
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
    setImageViewGroup: [
        {
            fileId: 0,
            imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
            mip: 1,
            compressionType: CARTA.CompressionType.NONE,
        },
        {
            fileId: 1,
            imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
            mip: 2,
            compressionType: CARTA.CompressionType.NONE,
        },
        {
            fileId: 2,
            imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
            mip: 4,
            compressionType: CARTA.CompressionType.NONE,
        },
        {
            fileId: 3,
            imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
            mip: 8,
            compressionType: CARTA.CompressionType.NONE,
        },
    ],
    rasterImageDataGroup: [
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
            await Utility.setEvent(Connection, CARTA.CloseFile, {fileId: -1});
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
                }, openFileTimeout);

                test(`OPEN_FILE_ACK.success = $${fileOpenAck.success}`, () => {
                    expect(OpenFileAckTemp.success).toBe(fileOpenAck.success);
                });

                test(`OPEN_FILE_ACK.file_id = ${fileOpenAck.fileId}`, () => {                    
                    expect(OpenFileAckTemp.fileId).toEqual(fileOpenAck.fileId);
                });

            });

            describe(`set image view for the file "${assertItem.fileOpenGroup[index].file}"`, () => {
                let RasterImageDataTemp: CARTA.RasterImageData;
                test(`RASTER_IMAGE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.SetImageView, assertItem.setImageViewGroup[index]);
                    await Utility.getEventAsync(Connection, CARTA.RasterImageData,  
                        (RasterImageData: CARTA.RasterImageData, resolve) => {
                            RasterImageDataTemp = RasterImageData;
                            resolve();
                        }
                    );
                }, readFileTimeout);

                test(`RASTER_IMAGE_DATA.file_id = ${assertItem.rasterImageDataGroup[index].fileId}`, () => {
                    expect(RasterImageDataTemp.fileId).toEqual(assertItem.rasterImageDataGroup[index].fileId);
                });

            });
            
        });
    });

    afterAll( () => {
        Connection.close();
    });
});