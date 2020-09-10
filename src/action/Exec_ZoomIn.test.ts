import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait, Monitor } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testServerUrl: string = config.localHost + ":" + config.port;
let testSubdirectory: string = config.path.performance;
let testImage: string = config.image.cube;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;
let zoomTimeout: number = config.timeout.zoom;
let zoomRepeat: number = config.repeat.zoom;
let monitorPeriod: number = config.wait.monitor;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesReq: CARTA.IAddRequiredTiles[];
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
    addTilesReq: [
        {
            tiles: [16777216, 16781312, 16777217, 16781313],
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
        },
        {
            tiles: [
                50343939, 50343938, 50339843, 50339842, 50348035,
                50343940, 50348034, 50339844, 50343937, 50335747,
                50339841, 50335746, 50348036, 50348033, 50335748,
                50335745, 50352131, 50343941, 50352130, 50339845,
                50343936, 50331651, 50339840, 50331650, 50352132,
                50348037, 50352129, 50335749, 50348032, 50331652,
                50335744, 50331649, 50352133, 50356227, 50343942,
                50356226, 50339846, 50352128, 50331653, 50356228,
                50348038, 50331648, 50356225, 50335750, 50356229,
                50352134, 50356224, 50331654, 50356230
            ],
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
        },
    ],
}

describe("Zoom In Iamge action: ", () => {
    let Connection: Client;
    let cartaBackend: any;
    let logFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_ZoomIn.txt";
    let usageFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_ZoomIn_usage.txt";
    test(`Empty the record files`, async () => {
        await EmptyTxt(logFile);
        await EmptyTxt(usageFile);
    });

    test(`CARTA is ready`, async () => {
        cartaBackend = await Socket.CartaBackend(
            logFile,
            config.port,
        );
        await Wait(config.wait.exec);
    }, execTimeout + config.wait.exec);

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        describe(`start the action`, () => {
            test(`should open the file "${assertItem.fileOpen.file}"`, async () => {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.stream(2); // OpenFileAck | RegionHistogramData
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
                let ack: AckStream;
                while (true) {
                    ack = await Connection.stream(1) as AckStream;
                    if (ack.RasterTileSync.length > 0) {
                        if (ack.RasterTileSync[0].endSync) {
                            break;
                        }
                    }
                }
            }, readTimeout);;

            for (let idx: number = 0; idx < zoomRepeat; idx++) {
                test(`image should zoom in`, async () => {
                    let monitor = Monitor(cartaBackend.pid, monitorPeriod);
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                    let ack: AckStream;
                    while (true) {
                        ack = await Connection.stream(1) as AckStream;
                        if (ack.RasterTileSync.length > 0) {
                            if (ack.RasterTileSync[0].endSync) {
                                break;
                            }
                        }
                    }
                    clearInterval(monitor.id);
                    if (monitor.data.cpu.length === 0) {
                        await AppendTxt(usageFile, await Usage(cartaBackend.pid));
                    } else {
                        await AppendTxt(usageFile, monitor.data);
                    }
                    await Wait(config.wait.zoom);
                }, zoomTimeout + config.wait.zoom);

                test(`image should zoom out`, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
                    let ack: AckStream;
                    while (true) {
                        ack = await Connection.stream(1) as AckStream;
                        if (ack.RasterTileSync.length > 0) {
                            if (ack.RasterTileSync[0].endSync) {
                                break;
                            }
                        }
                    }
                    await Wait(config.wait.zoom);
                }, zoomTimeout + config.wait.zoom);
            }
        });

    });

    afterAll(async done => {
        await Connection.close();
        cartaBackend.kill();
        cartaBackend.on("close", () => done());
    }, execTimeout);
});