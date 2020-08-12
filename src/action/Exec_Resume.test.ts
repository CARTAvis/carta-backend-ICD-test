import { CARTA } from "carta-protobuf";

import { Client, Usage, AppendTxt, EmptyTxt, Wait } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testServerUrl: string = config.localHost + ":" + config.port;
let testSubdirectory: string = config.path.performance;
let testImage: string = config.image.singleChannel;
let execTimeout: number = config.timeout.execute;
let resumeTimeout: number = config.timeout.resume;
let resumeRepeat: number = config.repeat.resumeSession;
let resumeWait: number = config.wait.resume;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    stopAnomator: CARTA.IStopAnimation;
    setImageChannel: CARTA.ISetImageChannels;
    resumeSession: CARTA.IResumeSession;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 30,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    stopAnomator: {
        fileId: 0,
        endFrame: { channel: 0, stokes: 0 },
    },
    setImageChannel: {
        fileId: 0,
        channel: 0,
        stokes: 0,
        requiredTiles: {
            tiles: [0],
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
        },
    },
    resumeSession: {
        images: [
            {
                file: testImage,
                directory: testSubdirectory,
                hdu: "",
                fileId: 0,
                renderMode: CARTA.RenderMode.RASTER,
                channel: 0,
                stokes: 0,
                regions: {
                    "region0": {
                        regionType: CARTA.RegionType.POINT,
                        controlPoints: [{ x: 1.0, y: 1.0, },],
                        rotation: 0,
                    },
                },
                contourSettings: {
                    fileId: 0,
                    referenceFileId: 0,
                    imageBounds: { xMin: 0, xMax: 800, yMin: 0, yMax: 800 },
                    levels: [
                        1.27, 2.0, 2.51, 3.0,
                        3.75, 4.0, 4.99, 5.2,
                        6.23, 6.6, 7.47, 7.8,
                        8.71, 9.0, 9.95, 10.2,
                    ],
                    smoothingMode: CARTA.SmoothingMode.GaussianBlur,
                    smoothingFactor: 4,
                    decimationFactor: 4,
                    compressionLevel: 8,
                    contourChunkSize: 100000,
                },
            },
        ],
    },
}

describe("Resume action: ", () => {

    let cartaBackend: any;
    let logFile = testImage.substr(testImage.search('/') + 1).replace('.', '_') + "_resume.txt";
    let usageFile = testImage.substr(testImage.search('/') + 1).replace('.', '_') + "_resume_usage.txt";
    test(`CARTA is ready`, async () => {
        cartaBackend = await Socket.CartaBackend(
            logFile,
            config.port,
        );
        await Wait(config.wait.exec);
        await EmptyTxt(usageFile);
    }, execTimeout + config.wait.exec);

    for (let idx = 0; idx < resumeRepeat; idx++) {

        test(`should resume session and reopen image "${assertItem.resumeSession.images[0].file}"`, async () => {
            let Connection: Client = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
            await Connection.send(CARTA.StopAnimation, assertItem.stopAnomator);
            await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel);
            await Usage(cartaBackend.pid);
            await Connection.send(CARTA.ResumeSession, assertItem.resumeSession);
            while ((await Connection.receiveAny() as CARTA.ResumeSessionAck).success) { };
            await AppendTxt(usageFile, await Usage(cartaBackend.pid));

            await Wait(resumeWait);
            Connection.close();
        }, resumeTimeout + resumeWait);
    }

    afterAll(done => {
        cartaBackend.kill();
        cartaBackend.on("close", () => done());
    }, execTimeout);
});