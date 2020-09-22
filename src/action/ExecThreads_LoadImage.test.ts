import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait, Monitor } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testFile: string = "cube_A/cube_A_12800_z00001.fits"
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let listTimeout: number = config.timeout.listFile;
let readFileTimeout: number = config.timeout.readFile;
let imageReload: number = config.repeat.image;
let monitorPeriod: number = config.wait.monitor;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesReq: CARTA.IAddRequiredTiles;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        file: testFile,
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
    addTilesReq:
    {
        tiles: [
            33558529, 33562625, 33558528, 33558530,
            33554433, 33562624, 33562626, 33554432,
            33554434, 33566721, 33558531, 33566720,
            33566722, 33562627, 33554435, 33566723
        ],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
}
let testMainThreads = [
    2, 4, 6, 8,
    10, 12, 14, 16,
];
let testOmpThreads = [
    4, 8, 12, 16,
    20, 24, 28, 32,
];
testMainThreads.map(mainThread => {
    testOmpThreads.map(ompThread => {
        let testServerUrl: string = `${config.localHost}:${config.port}`;
        describe(`Load Image action: thread=${mainThread}, omp thread=${ompThread}`, () => {
            let Connection: Client;
            let cartaBackend: any;
            let fileNameInit: string =  testFile.substr(testFile.search('/') + 1).replace('.', '_') + "_" + mainThread + "_" + ompThread;
            let logFile = fileNameInit + "_loadImage.txt";
            let usageFile_openFile = fileNameInit + "_openfile_usage.txt";
            let usageFile_tile = fileNameInit + "_tile_usage.txt";
            test(`Empty the record files`, async () => {
                await EmptyTxt(logFile);
                await EmptyTxt(usageFile_openFile);
                await EmptyTxt(usageFile_tile);
            });

            beforeAll(async () => {
                cartaBackend = await Socket.CartaBackend(
                    logFile,
                    config.port,
                    mainThread,
                    ompThread,
                );
                await Wait(config.wait.exec);
            }, execTimeout + config.wait.exec);

            describe(`CARTA is ready`, () => {
                beforeAll(async () => {
                    Connection = new Client(testServerUrl);
                    await Connection.open();
                    await Connection.send(CARTA.RegisterViewer, assertItem.register);
                    await Connection.receive(CARTA.RegisterViewerAck);
                    await Connection.send(CARTA.FileListRequest, assertItem.filelist);
                    await Connection.receive(CARTA.FileListResponse);
                }, listTimeout);

                describe(`open the file "${testFile}"`, () => {
                    test(`${imageReload} images data should return`, async () => {
                        for (let index: number = 0; index < imageReload; index++) {
                            let monitor = Monitor(cartaBackend.pid, monitorPeriod);
                            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                            await Connection.receiveAny(); // OpenFileAck
                            clearInterval(monitor.id);
                            if (monitor.data.cpu.length === 0) {
                                await AppendTxt(usageFile_openFile, await Usage(cartaBackend.pid));
                            } else {
                                await AppendTxt(usageFile_openFile, monitor.data);
                            }

                            monitor = Monitor(cartaBackend.pid, monitorPeriod);
                            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
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
                                await AppendTxt(usageFile_tile, await Usage(cartaBackend.pid));
                            } else {
                                await AppendTxt(usageFile_tile, monitor.data);
                            }
                            await Connection.send(CARTA.CloseFile, { fileId: -1 });
                        }
                    }, readFileTimeout * imageReload);
                });

            });

            afterAll(async done => {
                await Connection.close();
                cartaBackend.kill();
                cartaBackend.on("close", () => done());
            }, execTimeout);
        });
    });
});