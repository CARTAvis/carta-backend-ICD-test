import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testServerUrl: string = config.localHost + ":" + config.port;
let testSubdirectory: string = config.path.performance;
let testImage: string = config.image.cube;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let cubeHistogramTimeout: number = config.timeout.cubeHistogram;
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
        file: testImage,
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

describe("Cube histogram action: ", () => {
    let Connection: Client;
    let cartaBackend: any;
    let logFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_cubeHistogram.txt";
    test(`CARTA is ready`, async () => {
        cartaBackend = await Socket.CartaBackend(
            logFile,
            config.port,
        );
        await new Promise(resolve => setTimeout(resolve, config.wait.exec));
    }, execTimeout + config.wait.exec);

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        test(`Connection is ready`, async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        describe(`open the file "${assertItem.fileOpen.file}"`, () => {
            test(`should get cube histogram`, async () => {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                await Connection.receiveAny();
                await Connection.receiveAny(); // OpenFileAck | RegionHistogramData

                await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                while ((await Connection.stream(1) as AckStream).RegionHistogramData[0].progress < 1) { }

                await new Promise(resolve => setTimeout(resolve, config.wait.histogram));
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, cubeHistogramTimeout);
        });
    });

    afterAll(async done => {
        await Connection.close();
        cartaBackend.kill();
        cartaBackend.on("close", () => done());
    }, execTimeout);
});