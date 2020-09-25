import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait, Monitor } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let fileopenTimeout: number = config.timeout.readLargeImage;
let cubeHistogramTimeout: number = config.timeout.cubeHistogramLarge;
let monitorPeriod: number = config.wait.monitor;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesReq: CARTA.IAddRequiredTiles;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
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
    setHistogramRequirements: {
        fileId: 0,
        regionId: -2,
        histograms: [
            { channel: -2, numBins: -1 },
        ],
    },
}
let testFiles = [
    "cube_A/cube_A_01600_z00100.fits",
    "cube_A/cube_A_01600_z00100.image",
    "cube_A/cube_A_01600_z00100.hdf5",

    "cube_A/cube_A_03200_z00100.fits",
    "cube_A/cube_A_03200_z00100.image",
    "cube_A/cube_A_03200_z00100.hdf5",

    "cube_A/cube_A_06400_z00100.fits",
    "cube_A/cube_A_06400_z00100.image",
    "cube_A/cube_A_06400_z00100.hdf5",

    "cube_A/cube_A_01600_z01000.fits",
    "cube_A/cube_A_01600_z01000.image",
    "cube_A/cube_A_01600_z02000.fits",
    "cube_A/cube_A_01600_z02000.image",

    "cube_A/cube_A_12800_z00100.fits",
    "cube_A/cube_A_12800_z00100.image",
    "cube_A/cube_A_12800_z00100.hdf5",

    "cube_A/cube_A_25600_z00100.fits",
    "cube_A/cube_A_25600_z00100.image",

    // "cube_A/cube_A_51200_z00100.fits",
    // "cube_A/cube_A_51200_z00100.image",
];
testFiles.map(file => {
    let testServerUrl: string = `${config.localHost}:${config.port}`;
    describe(`Cube histogram action: ${file.substr(file.search('/') + 1)}`, () => {
        let Connection: Client;
        let cartaBackend: any;
        let logFile = file.substr(file.search('/') + 1).replace('.', '_') + "_cubeHistogram.txt";
        let usageFile = file.substr(file.search('/') + 1).replace('.', '_') + "_cubeHistogram_usage.txt";
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
                for (let index = 0; index < config.repeat.cubeHistogram; index++) {
                    test(`should open the file "${file}"`, async () => {
                        await Connection.send(CARTA.OpenFile, {
                            file: file,
                            ...assertItem.fileOpen,
                        });
                        await Connection.stream(2) // OpenFileAck | RegionHistogramData
                    }, fileopenTimeout);

                    test(`should get cube histogram`, async () => {
                        let monitor = Monitor(cartaBackend.pid, monitorPeriod);
                        await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                        while ((await Connection.stream(1) as AckStream).RegionHistogramData[0].progress < 1) { }
                        clearInterval(monitor.id);
                        if (monitor.data.cpu.length === 0) {
                            await AppendTxt(usageFile, await Usage(cartaBackend.pid));
                        } else {
                            await AppendTxt(usageFile, monitor.data);
                        }

                        await Wait(config.wait.histogram);
                        await Connection.send(CARTA.CloseFile, { fileId: -1 });
                    }, cubeHistogramTimeout + config.wait.histogram);
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