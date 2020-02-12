import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
import { async } from "q";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let cubeHistogramTimeout: number = 5000000;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels[];
    cursor: CARTA.ISetCursor;
    histogram: CARTA.ISetHistogramRequirements;
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_02400_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_04800_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_09600_z00100.fits",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_19200_z00100.fits",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_02400_z00100.image",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_04800_z00100.image",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_09600_z00100.image",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_19200_z00100.image",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_02400_z00100.hdf5",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_04800_z00100.hdf5",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_09600_z00100.hdf5",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
        // {
        //     directory: testSubdirectory + "/cube_A",
        //     file: "cube_A_19200_z00100.hdf5",
        //     hdu: "",
        //     fileId: 0,
        //     renderMode: CARTA.RenderMode.RASTER,
        // },
    ],
    setImageChannel: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [33558529, 33558528, 33554433, 33554432, 33562625, 33558530, 33562624, 33554434, 33562626],
            },
        },
    ],
    cursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    histogram: {
        fileId: 0,
        regionId: -2,
        histograms: [{ channel: -2, numBins: -1 }],
    },
};

describe("PERF_CUBE_HISTOGRAM", () => {
    assertItem.fileOpen.map((fileOpen: CARTA.IOpenFile, index) => {
        let Connection: Client;
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        // test(`(Step 0) Connection Open?`, () => {
        //     expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        // });

        describe(`Go to "${assertItem.fileOpen[index].directory}" folder and open image "${assertItem.fileOpen[index].file}":": `, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1, });
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen[index]);
                await Connection.receive(CARTA.OpenFileAck);
                await Connection.receive(CARTA.RegionHistogramData); // return OpenFileAck | RegionHistogramData (not sure the sequence)
            });

            test(`(Step 0) Connection Open?`, () => {
                expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            });

            let RasterTileDataTempTotal: any;
            let CursorResult: any;
            test(`(Step 1) Open file and Set "image channels" & "cursor:`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                RasterTileDataTempTotal = await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length);
                expect(RasterTileDataTempTotal.RasterTileData.length).toEqual(assertItem.setImageChannel[0].requiredTiles.tiles.length)

                await Connection.send(CARTA.SetCursor, assertItem.cursor);
                CursorResult = await Connection.receive(CARTA.SpatialProfileData);
            });

            describe(`(Step 2) Set histogram requirements:`, () => {
                test(`REGION_HISTOGRAM_DATA should arrive completely within ${cubeHistogramTimeout} ms:`, async () => {
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.histogram);
                    let RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                    let ReceiveProgress: number = RegionHistogramDataTemp.progress;

                    if (ReceiveProgress != 1) {
                        while (ReceiveProgress < 1) {
                            RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                            ReceiveProgress = RegionHistogramDataTemp.progress
                            console.warn('' + assertItem.fileOpen[index].file + ' Region Histogram progress :', ReceiveProgress)
                        };
                        expect(ReceiveProgress).toEqual(1);
                    };
                }, cubeHistogramTimeout);
            });


        });
        afterAll(() => Connection.close());
    });
});