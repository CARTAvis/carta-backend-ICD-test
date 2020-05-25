import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let listTimeout: number = config.timeout.listFile;
let readFileTimeout: number = config.timeout.readLargeImage;
let imageReload: number = config.repeat.image;
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
    describe(`Load Image action: ${file.substr(file.search('/') + 1)}`, () => {
        let Connection: Client;
        let cartaBackend: any;
        let logFile = file.substr(file.search('/') + 1).replace('.', '_') + "_loadImage.txt";
        beforeAll(async () => {
            cartaBackend = await Socket.CartaBackend(
                logFile,
                config.port,
            );
            await new Promise(resolve => setTimeout(resolve, 100));
        }, execTimeout);

        describe(`CARTA is ready`, () => {
            beforeAll(async () => {
                Connection = new Client(testServerUrl);
                await Connection.open();
                await Connection.send(CARTA.RegisterViewer, assertItem.register);
                await Connection.receive(CARTA.RegisterViewerAck);
                await Connection.send(CARTA.FileListRequest, assertItem.filelist);
                await Connection.receive(CARTA.FileListResponse);
            }, listTimeout);

            describe(`open the file "${file}"`, () => {
                test(`${imageReload} images data should return`, async () => {
                    for (let index: number = 0; index < imageReload; index++) {
                        await Connection.send(CARTA.OpenFile, {
                            file: file,
                            ...assertItem.fileOpen,
                        });
                        await Connection.receiveAny(); // OpenFileAck

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
                        await Connection.send(CARTA.CloseFile, { fileId: -1 });
                    }
                    // await new Promise(resolve => setTimeout(resolve, 300));
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