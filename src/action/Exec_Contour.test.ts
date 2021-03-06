import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait, Monitor } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testSubdirectory: string = config.path.performance;
let testImage: string = config.image.singleChannel;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let readfileTimeout: number = config.timeout.readFile;
let contourTimeout: number = config.timeout.contour;
let contourRepeat: number = config.repeat.contour;
let monitorPeriod: number = config.wait.monitor;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesReq: CARTA.IAddRequiredTiles;
    setContour: CARTA.ISetContourParameters;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: testImage,
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: []
        },
    },
    addTilesReq:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    setContour: {
        fileId: 0,
        referenceFileId: 0,
        levels: [
            // 1.27, 2.0, 2.2, 3.0,
            3.75, 4.0, 4.99, 5.2,
            6.23, 6.6, 7.47, 7.8,
            8.71, 9.0, 9.95, 10.2,
        ],
        smoothingMode: CARTA.SmoothingMode.GaussianBlur,
        smoothingFactor: 4,
        decimationFactor: 4,
        compressionLevel: 0,
        contourChunkSize: 100000,
    },
}

describe("Contour action: ", () => {
    let Connection: Client;
    let cartaBackend: any;
    let logFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_contour.txt";
    let usageFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_contour_usage.txt";
    test(`Empty the record files`, async () => {
        await EmptyTxt(logFile);
        await EmptyTxt(usageFile);
    });

    for (let idx: number = 0; idx < contourRepeat; idx++) {
        let port = config.port + idx;
        let testServerUrl: string = config.localHost + ":" + port;
        describe(`Repeat ${idx + 1}`, () => {
            test(`CARTA is ready`, async () => {
                cartaBackend = await Socket.CartaBackend(
                    logFile,
                    port,
                );
                await Wait(config.wait.exec);
            }, execTimeout + config.wait.exec);

            describe(`Start the action: contour`, () => {
                test(`Connection is ready`, async () => {
                    Connection = new Client(testServerUrl);
                    await Connection.open();
                    await Connection.send(CARTA.RegisterViewer, assertItem.register);
                    await Connection.receive(CARTA.RegisterViewerAck);
                }, connectTimeout);

                describe(`open the file "${assertItem.fileOpen.file}"`, () => {
                    let ack: AckStream;
                    beforeAll(async () => {
                        await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                        ack = await Connection.stream(2) as AckStream; // OpenFileAck | RegionHistogramData

                        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                        while ((await Connection.receiveAny() as CARTA.RasterTileSync).endSync) { }
                    }, readfileTimeout);

                    test(`should return contour data`, async () => {
                        let monitor = Monitor(cartaBackend.pid, monitorPeriod);
                        await Connection.send(CARTA.SetContourParameters, {
                            imageBounds: {
                                xMin: 0, xMax: <CARTA.OpenFile>(ack.Responce[0]).fileInfoExtended.width,
                                yMin: 0, yMax: <CARTA.OpenFile>(ack.Responce[0]).fileInfoExtended.height,
                            },
                            ...assertItem.setContour,
                        });

                        let count: number = 0;
                        while (count < assertItem.setContour.levels.length) {
                            await Connection.receive(CARTA.ContourImageData)
                                .then((contourImageData: CARTA.ContourImageData) => {
                                    if (contourImageData.progress == 1) count++;
                                });
                        }

                        clearInterval(monitor.id);
                        if (monitor.data.cpu.length === 0) {
                            await AppendTxt(usageFile, await Usage(cartaBackend.pid));
                        } else {
                            await AppendTxt(usageFile, monitor.data);
                        }

                        await Connection.send(CARTA.SetContourParameters, {
                            fileId: 0,
                            referenceFileId: 0,
                        }); // Clear contour
                    }, contourTimeout);

                    // test(`should wait ${config.wait.contour} ms`, async () => {
                    //     await Wait(config.wait.contour);
                    // }, config.wait.contour + 500);
                });

                afterAll(async done => {
                    await Connection.close();
                    cartaBackend.kill();
                    cartaBackend.on("close", () => done());
                }, execTimeout);
            });
        });
    }
});