import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let openfileTimeout: number = config.timeout.readLargeImage;
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
        imageBounds: { xMin: 0, xMax: 800, yMin: 0, yMax: 800 },
        levels: [
            // 0.015808638865844493,
            // 2.810852870937488,
            // 5.605897103009132,
            // 8.400941335080777,
            11.19598556715242,
        ],
        smoothingMode: CARTA.SmoothingMode.GaussianBlur,
        smoothingFactor: 4,
        decimationFactor: 4,
        compressionLevel: 8,
        contourChunkSize: 100000,
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
    let testServerUrl: string = `${config.localHost}:${config.port}`
    describe(`Contour action: ${file.substr(file.search('/') + 1)}`, () => {
        let Connection: Client;
        let cartaBackend: any;
        let logFile = file.substr(file.search('/') + 1).replace('.', '_') + "_contour.txt";
        test(`CARTA is ready`, async () => {
            cartaBackend = await Socket.CartaBackend(
                logFile,
                config.port,
            );
            await new Promise(resolve => setTimeout(resolve, config.wait.exec));
        }, execTimeout);

        describe(`Start the action: contour`, () => {
            test(`Connection is ready`, async () => {
                Connection = new Client(testServerUrl);
                await Connection.open();
                await Connection.send(CARTA.RegisterViewer, assertItem.register);
                await Connection.receive(CARTA.RegisterViewerAck);
            }, connectTimeout);

            describe(`open the file "${file}"`, () => {
                let ackFile: CARTA.OpenFileAck;
                beforeAll(async () => {
                    await Connection.send(CARTA.OpenFile, {
                        file:file,
                        ...assertItem.fileOpen,
                    });
                    ackFile = await Connection.receive(CARTA.OpenFileAck) as CARTA.OpenFileAck;
                    await Connection.receiveAny(); // RegionHistogramData

                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                    await Connection.stream(4) as AckStream;
                }, openfileTimeout);

                for (let idx: number = 0; idx < contourRepeat; idx++) {
                    test(`should return contour data`, async () => {
                        await Connection.send(CARTA.SetContourParameters, {
                            imageBounds: {
                                xMin: 0, xMax: ackFile.fileInfoExtended.width,
                                yMin: 0, yMax: ackFile.fileInfoExtended.height,
                            },
                            ...assertItem.setContour,
                        });
                        let contourImageData: CARTA.ContourImageData = await Connection.receive(CARTA.ContourImageData) as CARTA.ContourImageData;
                        let count: number = 0;
                        if (contourImageData.progress == 1) count++;

                        while (count < assertItem.setContour.levels.length) {
                            contourImageData = await Connection.receive(CARTA.ContourImageData) as CARTA.ContourImageData;
                            if (contourImageData.progress == 1) count++;
                        }
                        await Connection.send(CARTA.SetContourParameters, {
                            fileId: 0,
                            referenceFileId: 0,
                        }); // Clear contour

                        await new Promise(resolve => setTimeout(resolve, config.wait.contour));
                    }, contourTimeout + config.wait.contour);
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