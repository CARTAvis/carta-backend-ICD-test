import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let readfileTimeout: number = config.timeout.readLargeImage;
let contourTimeout: number = config.timeout.contourLargeImage;
let contourRepeat: number = config.repeat.contour;
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
            1.27, 2.51, 3.75, 
            4.99, 6.23, // 7.47, 8.71, 9.95,
        ],
        smoothingMode: CARTA.SmoothingMode.GaussianBlur,
        smoothingFactor: 4,
        decimationFactor: 4,
        compressionLevel: 8,
        contourChunkSize: 100000,
    },
}
let testFiles = [
    "cube_A/cube_A_51200_z00001.fits",
    "cube_A/cube_A_25600_z00001.fits",
    "cube_A/cube_A_12800_z00001.fits",
    "cube_A/cube_A_06400_z00001.fits",
    "cube_A/cube_A_03200_z00001.fits",
    "cube_A/cube_A_01600_z00001.fits",
    "cube_A/cube_A_51200_z00001.image",
    "cube_A/cube_A_25600_z00001.image",
    "cube_A/cube_A_12800_z00001.image",
    "cube_A/cube_A_06400_z00001.image",
    "cube_A/cube_A_03200_z00001.image",
    "cube_A/cube_A_01600_z00001.image",

    "cube_A/cube_A_25600_z00001.hdf5",
    "cube_A/cube_A_12800_z00001.hdf5",
    "cube_A/cube_A_06400_z00001.hdf5",
    "cube_A/cube_A_03200_z00001.hdf5",
    "cube_A/cube_A_01600_z00001.hdf5",
];
testFiles.map(file => {
    let testServerUrl: string = `${config.localHost}:${config.port}`
    describe(`Contour action: ${file.substr(file.search('/') + 1)}`, () => {
        let Connection: Client;
        let cartaBackend: any;
        let logFile = file.substr(file.search('/') + 1).replace('.', '_') + "_contour.txt";
        let usageFile = file.substr(file.search('/') + 1).replace('.', '_') + "_contour_usage.txt";
        test(`CARTA is ready`, async () => {
            cartaBackend = await Socket.CartaBackend(
                logFile,
                config.port,
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

            describe(`open the file "${file}"`, () => {
                let ack: AckStream;
                test(`should return contour data`, async () => {
                    await Connection.send(CARTA.OpenFile, {
                        file: file,
                        ...assertItem.fileOpen,
                    });
                    ack = await Connection.stream(2) as AckStream; // OpenFileAck | RegionHistogramData

                    while ((await Connection.receiveAny() as CARTA.RasterTileSync).endSync) { }
                    await EmptyTxt(usageFile);
                }, readfileTimeout);

                for (let idx: number = 0; idx < contourRepeat; idx++) {
                    test(`should return contour data`, async () => {
                        await Usage(cartaBackend.pid)
                        await Connection.send(CARTA.SetContourParameters, {
                            imageBounds: {
                                xMin: 0, xMax: <CARTA.OpenFile>(ack.Responce[0]).fileInfoExtended.width,
                                yMin: 0, yMax: <CARTA.OpenFile>(ack.Responce[0]).fileInfoExtended.height,
                            },
                            ...assertItem.setContour,
                        });
                        
                        let count: number = 0;

                        while (count < assertItem.setContour.levels.length) {
                            let contourImageData = await Connection.receive(CARTA.ContourImageData) as CARTA.ContourImageData;
                            if (contourImageData.progress == 1) count++;
                        }
                        await AppendTxt(usageFile, await Usage(cartaBackend.pid));
                    }, contourTimeout);

                    test(`should wit ${config.wait.contour} ms`, async () => {
                        await Wait(config.wait.contour);
                    }, config.wait.contour + 500);
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