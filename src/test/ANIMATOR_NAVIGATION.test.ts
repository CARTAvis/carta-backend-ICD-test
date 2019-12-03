import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let changeChannelTimeout = config.timeout.changeChannel;
let messageReturnTimeout = config.timeout.messageEvent;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    fileOpens: CARTA.IOpenFile[];
    setImageChannels: CARTA.ISetImageChannels[];
    changeImageChannels: CARTA.ISetImageChannels[];
    regionHistogramDatas: CARTA.IRegionHistogramData[];
    rasterTileDatas: CARTA.IRasterTileData[];
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    fileOpens: [
        {
            directory: testSubdirectory,
            file: "HH211_IQU.hdf5",
            fileId: 0,
            hdu: "0",
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            fileId: 1,
            hdu: "0",
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
    ],
    setImageChannels: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
        {
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
    ],
    changeImageChannels: [
        {
            fileId: 0,
            channel: 2,
            stokes: 1,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 1,
            channel: 12,
            stokes: 0,
            requiredTiles: {
                fileId: 1,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
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
            requiredTiles: {
                fileId: 2,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                tiles: [0],
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
            },
        },
    ],
    regionHistogramDatas: [
        {
            fileId: 0,
            stokes: 1,
            regionId: -1,
            progress: 1,
            histograms: [{ channel: 2 }],
        },
        {
            fileId: 1,
            stokes: 0,
            regionId: -1,
            progress: 1,
            histograms: [{ channel: 12 }],
        },
        {},
        {},
        {},
        {
            fileId: 0,
            stokes: 0,
            regionId: -1,
            progress: 1,
            histograms: [{ channel: 0 }],
        },
    ],
    rasterTileDatas: [
        {
            fileId: 0,
            channel: 2,
            stokes: 1,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
        {
            fileId: 1,
            channel: 12,
            stokes: 0,
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
            channel: 0,
            stokes: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    ],
}

describe("ANIMATOR_NAVIGATION test: Testing using animator to see different frames/channels/stokes", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open images`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            for (let i = 0; i < assertItem.fileOpens.length; i++) {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpens[i]);
                await Connection.receive(CARTA.OpenFileAck);
                await Connection.receive(CARTA.RegionHistogramData);
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannels[i]);
                await Connection.receive(CARTA.RasterTileData);
            }
        });

        assertItem.rasterTileDatas.map((rasterTileData: CARTA.IRasterTileData, index: number) => {
            const { requiredTiles, ..._channel } = assertItem.changeImageChannels[index];
            describe(`Set Image Channel ${JSON.stringify(_channel)}`, () => {
                if (rasterTileData.fileId < 0) {
                    test(`REGION_HISTOGRAM_DATA should not arrive within ${messageReturnTimeout * .5} ms.`, async () => {
                        await Connection.send(CARTA.SetImageChannels, assertItem.changeImageChannels[index]);
                        await Connection.receive(CARTA.RegionHistogramData, messageReturnTimeout * .5, false);
                    }, changeChannelTimeout + messageReturnTimeout);
                    test(`RASTER_IMAGE_DATA should not arrive within ${messageReturnTimeout * .5} ms.`, async () => {
                        await Connection.receive(CARTA.RasterTileData, messageReturnTimeout * .5, false);
                    }, messageReturnTimeout);
                } else {
                    let RegionHistogramDataTemp: CARTA.RegionHistogramData;
                    let RasterTileDataTemp: CARTA.RasterTileData;
                    test(`REGION_HISTOGRAM_DATA should arrive within ${changeChannelTimeout} ms.`, async () => {
                        await Connection.send(CARTA.SetImageChannels, assertItem.changeImageChannels[index]);
                        RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                    }, changeChannelTimeout);

                    test(`REGION_HISTOGRAM_DATA.file_id = ${assertItem.regionHistogramDatas[index].regionId}`, () => {
                        expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramDatas[index].regionId);
                    });

                    test(`REGION_HISTOGRAM_DATA.stokes = ${assertItem.regionHistogramDatas[index].stokes}`, () => {
                        expect(RegionHistogramDataTemp.stokes).toEqual(assertItem.regionHistogramDatas[index].stokes);
                    });

                    test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramDatas[index].regionId}`, () => {
                        expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramDatas[index].regionId);
                    });

                    test(`REGION_HISTOGRAM_DATA.progress = ${assertItem.regionHistogramDatas[index].progress}`, () => {
                        expect(RegionHistogramDataTemp.progress).toEqual(assertItem.regionHistogramDatas[index].progress);
                    });

                    test(`REGION_HISTOGRAM_DATA.histograms.channel = ${assertItem.regionHistogramDatas[index].histograms[0].channel}`, () => {
                        expect(RegionHistogramDataTemp.histograms[0].channel).toEqual(assertItem.regionHistogramDatas[index].histograms[0].channel);
                    });

                    test(`RASTER_IMAGE_DATA should arrive within ${changeChannelTimeout} ms.`, async () => {
                        RasterTileDataTemp = await Connection.receive(CARTA.RasterTileData);
                    }, changeChannelTimeout);

                    test(`RASTER_IMAGE_DATA.file_id = ${rasterTileData.fileId}`, () => {
                        expect(RasterTileDataTemp.fileId).toEqual(rasterTileData.fileId);
                    });

                    test(`RASTER_IMAGE_DATA.channel = ${rasterTileData.channel}`, () => {
                        expect(RasterTileDataTemp.channel).toEqual(rasterTileData.channel);
                    });

                    test(`RASTER_IMAGE_DATA.stokes = ${rasterTileData.stokes}`, () => {
                        expect(RasterTileDataTemp.stokes).toEqual(rasterTileData.stokes);
                    });

                }
            });
        });

    });

    afterAll(() => Connection.close());
});