import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let changeChannelTimeout = config.timeout.changeChannel;
let messageReturnTimeout = config.timeout.messageEvent;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    fileOpens: CARTA.IOpenFile[];
    setImageViews: CARTA.ISetImageView[];
    setImageChannels: CARTA.ISetImageChannels[];
    rasterImageDatas: CARTA.IRasterImageData[];
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
    },
    fileOpens: [
        {
            directory: testSubdirectory,
            file: "HH211_IQU.hdf5",
            fileId: 0,
            hdu: "0",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            fileId: 1, 
            hdu: "0",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageViews: [
        {
            fileId: 0,
            imageBounds: {xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
            mip: 2,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            numSubsets: 4,
        },
        {
            fileId: 1,
            imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
            mip: 2,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            numSubsets: 4,
        },
    ],
    setImageChannels: [
        {
            fileId: 0,
            channel: 2,
            stokes: 1,
        },
        {
            fileId: 1,
            channel: 12,
        },
        {
            fileId: 0,
            channel: 100,
            stokes: 3,
        },
        {
            fileId: 1,
            channel: 100,
            stokes: 1,
        },
        {
            fileId: 2,
            channel: 0,
            stokes: 0,
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
        },
    ],
    rasterImageDatas: [
        {
            fileId: 0,
            imageBounds: {xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
            channel: 2,
            stokes: 1,
            mip: 2,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 1,
            imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
            channel: 12,
            stokes: 0,
            mip: 2,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: -1,
        },
        {
            fileId: -1,
        },
        {
            fileId: -1,
        },
        {
            fileId: 0,
            imageBounds: {xMin: 0, xMax: 1049, yMin: 0, yMax: 1049},
            channel: 0,
            stokes: 0,
            mip: 2,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    ],
}

describe("ANIMATOR_NAVIGATION test: Testing using animator to see different frames/channels/stokes", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }        
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open images`, () => {

        beforeAll( async () => {            
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1});
            for(let i = 0; i < assertItem.fileOpens.length; i++){
                await Utility.setEventAsync(Connection, CARTA.OpenFile, assertItem.fileOpens[i]);
                await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
                await Utility.setEventAsync(Connection, CARTA.SetImageView, assertItem.setImageViews[i]);
                await Utility.getEventAsync(Connection, CARTA.RasterImageData);
            }
        });

        assertItem.rasterImageDatas.map( (rasterImageData: CARTA.IRasterImageData, index: number) => {
            describe(`Set ${JSON.stringify(assertItem.setImageChannels[index])}`, () => {
                if(rasterImageData.fileId < 0){                
                    test(`RASTER_IMAGE_DATA should not arrive within ${messageReturnTimeout} ms.`, async () => {
                        await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannels[index]);
                        await Utility.getEventAsync(Connection, CARTA.RasterImageData, () => {}, messageReturnTimeout);
                    }, changeChannelTimeout + messageReturnTimeout);
                }else{
                    let RasterImageDataTemp: CARTA.RasterImageData;
                    test(`RASTER_IMAGE_DATA should arrive within ${changeChannelTimeout} ms.`, async () => {
                        await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannels[index]);
                        await Utility.getEventAsync(Connection, CARTA.RasterImageData,  
                            (RasterImageData: CARTA.RasterImageData, resolve) => {
                                RasterImageDataTemp = RasterImageData;
                                resolve();
                            }
                        );
                    }, changeChannelTimeout);

                    test(`RASTER_IMAGE_DATA.file_id = ${rasterImageData.fileId}`, () => {
                        expect(RasterImageDataTemp.fileId).toEqual(rasterImageData.fileId);
                    });

                    test(`RASTER_IMAGE_DATA.channel = ${rasterImageData.channel}`, () => {
                        expect(RasterImageDataTemp.channel).toEqual(rasterImageData.channel);
                    });

                    test(`RASTER_IMAGE_DATA.stokes = ${rasterImageData.stokes}`, () => {
                        expect(RasterImageDataTemp.stokes).toEqual(rasterImageData.stokes);
                    });

                    test(`RASTER_IMAGE_DATA.image_bounds = ${JSON.stringify(rasterImageData.imageBounds)}`, () => {
                        expect(RasterImageDataTemp.imageBounds).toEqual(rasterImageData.imageBounds);
                    });

                    test(`RASTER_IMAGE_DATA.mip = ${rasterImageData.mip}`, () => {
                        expect(RasterImageDataTemp.mip).toEqual(rasterImageData.mip);
                    });

                    test(`RASTER_IMAGE_DATA.compression_type = ${CARTA.CompressionType[rasterImageData.compressionType]}`, () => {
                        expect(RasterImageDataTemp.compressionType).toEqual(rasterImageData.compressionType);
                    });

                    test(`RASTER_IMAGE_DATA.compression_quality = ${rasterImageData.compressionQuality}`, () => {
                        expect(RasterImageDataTemp.compressionQuality).toEqual(rasterImageData.compressionQuality);
                    });
                }
            });
        });

    });

    afterAll( () => {
        Connection.close();
    });
});