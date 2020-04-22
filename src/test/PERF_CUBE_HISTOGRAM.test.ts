import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = 7000;//config.timeout.openFile; //7000
let readFileTimeout: number = 5000;//config.timeout.readFile; //5000
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
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_19200_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_02400_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_04800_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_19200_z00100.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_02400_z00100.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_04800_z00100.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_09600_z00100.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_19200_z00100.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
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
        point: { x: 0, y: 0 },
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
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, connectTimeout);

            test(`(Step 1)"${assertItem.fileOpen[index].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                await Connection.send(CARTA.OpenFile, fileOpen);
                await Connection.receiveAny()
                await Connection.receiveAny() // OpenFileAck | RegionHistogramData
            }, openFileTimeout);

            let ack: AckStream;
            test(`(Step 1)"${assertItem.fileOpen[index].file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                await Connection.send(CARTA.SetCursor, assertItem.cursor);

                ack = await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length + 2) as AckStream;
                // console.log(ack)
            }, readFileTimeout);

            describe(`Set histogram requirements:`, () => {
                test(`(Step 2)"${assertItem.fileOpen[index].file}" REGION_HISTOGRAM_DATA should arrive completely within ${cubeHistogramTimeout} ms:`, async () => {
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
