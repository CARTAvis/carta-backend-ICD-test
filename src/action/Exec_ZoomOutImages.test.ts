import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait, Monitor } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readLargeImage;
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
        {
            tiles: [
                33558529, 33562625, 33558530, 33558528, 33554433,
                33562626, 33562624, 33554434, 33554432, 33566721,
                33558531, 33566722, 33562627, 33566720, 33554435,
                33566723
            ],
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
        },
    ],
}
let testFiles = [
    // "cube_A/cube_A_51200_z00100.fits",
    // "cube_A/cube_A_25600_z00100.fits",
    // "cube_A/cube_A_12800_z00100.fits",
    // "cube_A/cube_A_06400_z00100.fits",
    "cube_A/cube_A_03200_z00100.fits",
    "cube_A/cube_A_01600_z00100.fits",
    // "cube_A/cube_A_51200_z00100.image",
    // "cube_A/cube_A_25600_z00100.image",
    // "cube_A/cube_A_12800_z00100.image",
    // "cube_A/cube_A_06400_z00100.image",
    "cube_A/cube_A_03200_z00100.image",
    "cube_A/cube_A_01600_z00100.image",

    // "cube_A/cube_A_12800_z00100.hdf5", 
    // "cube_A/cube_A_06400_z00100.hdf5", 
    "cube_A/cube_A_03200_z00100.hdf5",
    "cube_A/cube_A_01600_z00100.hdf5",
];
testFiles.map(file => {
    let testServerUrl: string = `${config.localHost}:${config.port}`;
    describe(`Zoom In&Out Iamge action: ${file.substr(file.search('/') + 1)}`, () => {
        let Connection: Client;
        let cartaBackend: any;
        let logFile = file.substr(file.search('/') + 1).replace('.', '_') + "_ZoomOut.txt";
        let usageFile = file.substr(file.search('/') + 1).replace('.', '_') + "_ZoomIn_usage.txt";
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
                test(`should open the file "${file}"`, async () => {
                    await Connection.send(CARTA.OpenFile, {
                        file: file,
                        ...assertItem.fileOpen,
                    });
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
                    await EmptyTxt(usageFile);
                }, readTimeout);;

                for (let idx: number = 0; idx < zoomRepeat; idx++) {
                    test(`image should zoom out`, async () => {
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

                    test(`image should zoom in`, async () => {
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
                        await new Promise(resolve => setTimeout(resolve, config.wait.zoom));
                    }, zoomTimeout);
                }
            });

        });

        afterAll(async done => {
            await Connection.close();
            cartaBackend.kill();
            cartaBackend.on("close", () => done());
        }, execTimeout);
    });
});