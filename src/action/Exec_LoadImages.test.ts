import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait } from "./CLIENT";
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
        tiles: [33558529, 33562625, 33558528, 33558530,
            33554433, 33562624, 33562626, 33554432,
            33554434, 33566721, 33558531, 33566720,
            33566722, 33562627, 33554435, 33566723],
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

    "cube_A/cube_A_12800_z00100.hdf5",
    "cube_A/cube_A_06400_z00100.hdf5",
    "cube_A/cube_A_03200_z00100.hdf5",
    "cube_A/cube_A_01600_z00100.hdf5",
];
testFiles.map(file => {
    let testServerUrl: string = `${config.localHost}:${config.port}`;
    describe(`Load Image action: ${file.substr(file.search('/') + 1)}`, () => {
        let Connection: Client;
        let cartaBackend: any;
        let logFile = file.substr(file.search('/') + 1).replace('.', '_') + "_loadImage.txt";
        let usageFile_openFile = file.substr(file.search('/') + 1).replace('.', '_') + "_openFile.txt";
        let usageFile_tile = file.substr(file.search('/') + 1).replace('.', '_') + "_tile.txt";
        beforeAll(async () => {
            cartaBackend = await Socket.CartaBackend(
                logFile,
                config.port,
            );
            await Wait(config.wait.exec);
        }, execTimeout);

        describe(`CARTA is ready`, () => {
            beforeAll(async () => {
                Connection = new Client(testServerUrl);
                await Connection.open();
                await Connection.send(CARTA.RegisterViewer, assertItem.register);
                await Connection.receive(CARTA.RegisterViewerAck);
                await Connection.send(CARTA.FileListRequest, assertItem.filelist);
                await Connection.receive(CARTA.FileListResponse);
                await EmptyTxt(usageFile_openFile);
                await EmptyTxt(usageFile_tile);
            }, listTimeout);

            describe(`open the file "${file}"`, () => {
                test(`${imageReload} images data should return`, async () => {
                    for (let index: number = 0; index < imageReload; index++) {
                        await Usage(cartaBackend.pid);
                        await Connection.send(CARTA.OpenFile, {
                            file: file,
                            ...assertItem.fileOpen,
                        });
                        await Connection.receiveAny(); // OpenFileAck
                        await AppendTxt(usageFile_openFile, await Usage(cartaBackend.pid));

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
                        await AppendTxt(usageFile_tile, await Usage(cartaBackend.pid));
                        await Connection.send(CARTA.CloseFile, { fileId: -1 });
                    }
                    // await Wait(300);
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