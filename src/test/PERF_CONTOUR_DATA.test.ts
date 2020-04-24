import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile; //5000
let playContourTimeout: number = 8000;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels[];
    setCursor: CARTA.ISetCursor;
    setContour: CARTA.ISetContourParameters[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen:
        [
            {
                directory: testSubdirectory,
                file: "h_m51_b_s05_drz_sci.fits",
                hdu: "0",
                fileId: 0,
                renderMode: CARTA.RenderMode.RASTER,
            },
            {
                directory: testSubdirectory,
                file: "h_m51_b_s05_drz_sci.fits",
                hdu: "0",
                fileId: 0,
                renderMode: CARTA.RenderMode.RASTER,
            },
            {
                directory: testSubdirectory,
                file: "h_m51_b_s05_drz_sci.fits",
                hdu: "0",
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
    setCursor: {
        fileId: 0,
        point: { x: 0, y: 0 },
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 2,
            smoothingFactor: 4,
            levels: [0.10, 0.36, 0.72, 1.09, 1.46],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 0,
            smoothingFactor: 4,
            levels: [0.10, 0.36, 0.72, 1.09, 1.46],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 1,
            smoothingFactor: 4,
            levels: [0.10, 0.36, 0.72, 1.09, 1.46],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
};

describe("PERF_CONTOUR_DARA", () => {
    assertItem.setContour.map((ContourItem, index) => {
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

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, connectTimeout);

            describe(`With smoothingMode of "${assertItem.setContour[index].smoothingMode}"`, () => {
                test(`(Step 1) smoothingMode of ${assertItem.setContour[index].smoothingMode} OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.OpenFile, assertItem.fileOpen[index]);
                    await Connection.receiveAny()
                    await Connection.receiveAny() // OpenFileAck | RegionHistogramData
                }, openFileTimeout);

                let ack: AckStream;
                test(`(Step 1) smoothingMode of ${assertItem.setContour[index].smoothingMode} SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor);

                    ack = await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length + 2) as AckStream;
                    // console.log(ack)
                }, readFileTimeout);

                let ack2: AckStream;
                test(`(Step 2) smoothingMode of ${assertItem.setContour[index].smoothingMode} ContourImageData responses should arrive within ${playContourTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetContourParameters, assertItem.setContour[index]);

                    for (let i = 0; i < assertItem.setContour[index].levels.length; i++) {
                        let ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
                        let ReceiveProgress: number = ContourImageDataTemp.progress;

                        if (ReceiveProgress != 1) {
                            while (ReceiveProgress < 1) {
                                ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
                                ReceiveProgress = ContourImageDataTemp.progress
                                // console.log(ContourImageDataTemp)
                                // console.warn('' + ContourImageDataTemp.contourSets.level + ' ContourImageData progress with ' + assertItem.setContour[index].smoothingMode + ':', ReceiveProgress)
                            };
                            expect(ReceiveProgress).toEqual(1);
                        };
                        // console.log(ContourImageDataTemp);
                    };


                }, playContourTimeout);
            });
        });

        afterAll(() => Connection.close());
    })
});
