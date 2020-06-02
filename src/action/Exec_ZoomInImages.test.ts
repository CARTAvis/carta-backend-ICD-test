import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readLargeImage;
let zoomTimeout: number = config.timeout.zoom;
let zoomRepeat: number = config.repeat.zoom;
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
            tiles: [50343939, 50343938, 50339843, 50339842, 50348035,
                50343940, 50348034, 50339844, 50343937, 50335747,
                50339841, 50335746, 50348036, 50348033, 50335748,
                50335745, 50352131, 50343941, 50352130, 50339845,
                50343936, 50331651, 50339840, 50331650, 50352132,
                50348037, 50352129, 50335749, 50348032, 50331652,
                50335744, 50331649, 50352133, 50356227, 50343942,
                50356226, 50339846, 50352128, 50331653, 50356228,
                50348038, 50331648, 50356225, 50335750, 50356229,
                50352134, 50356224, 50331654, 50356230],
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
        },
        {
            tiles: [67133446, 67133445, 67129350, 67129349, 67137542,
                67133447, 67137541, 67129351, 67137543, 67133444,
                67125254, 67129348, 67125253, 67137540, 67125255,
                67141638, 67133448, 67141637, 67129352, 67125252,
                67141639, 67137544, 67133443, 67121158, 67141636,
                67125256, 67129347, 67121157, 67137539, 67121159,
                67141640, 67145734, 67133449, 67125251, 67121156,
                67145733, 67129353, 67145735, 67137545, 67141635,
                67121160, 67145732, 67125257, 67133442, 67129346,
                67121155, 67145736, 67141641, 67137538, 67125250,
                67133450, 67145731, 67121161, 67129354, 67141634,
                67137546, 67145737, 67125258, 67121154, 67133441,
                67141642, 67129345, 67137537, 67145730, 67121162,
                67125249, 67133451, 67141633, 67129355, 67145738,
                67137547, 67121153, 67125259, 67141643, 67145729,
                67121163, 67145739],
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
        },
    ],
}
let testFiles = [
    "cube_A/cube_A_51200_z00100.fits",
    "cube_A/cube_A_25600_z00100.fits",
    "cube_A/cube_A_12800_z00100.fits",
    "cube_A/cube_A_06400_z00100.fits",
    "cube_A/cube_A_03200_z00100.fits",
    "cube_A/cube_A_01600_z00100.fits",
    "cube_A/cube_A_51200_z00100.image",
    "cube_A/cube_A_25600_z00100.image",
    "cube_A/cube_A_12800_z00100.image",
    "cube_A/cube_A_06400_z00100.image",
    "cube_A/cube_A_03200_z00100.image",
    "cube_A/cube_A_01600_z00100.image",

    // "cube_A/cube_A_12800_z00100.hdf5", 
    // "cube_A/cube_A_06400_z00100.hdf5", 
    // "cube_A/cube_A_03200_z00100.hdf5",
    // "cube_A/cube_A_01600_z00100.hdf5",
];
testFiles.map(file => {
    let testServerUrl: string = `${config.localHost}:${config.port}`;
    describe(`Zoom In Iamge action: ${file.substr(file.search('/') + 1)}`, () => {
        let Connection: Client;
        let cartaBackend: any;
        let logFile = file.substr(file.search('/') + 1).replace('.', '_') + "_ZoomIn.txt";
        test(`CARTA is ready`, async () => {
            cartaBackend = await Socket.CartaBackend(
                logFile,
                config.port,
            );
            await new Promise(resolve => setTimeout(resolve, config.wait.exec));
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
                }, readTimeout);;

                for (let idx: number = 0; idx < zoomRepeat; idx++) {
                    test(`image should zoom in`, async () => {
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
                        await new Promise(resolve => setTimeout(resolve, config.wait.zoom));
                    }, zoomTimeout);

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