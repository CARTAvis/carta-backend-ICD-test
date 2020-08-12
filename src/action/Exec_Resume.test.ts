import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
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
                regions: [
                    {
                        regionId: 0,
                        regionInfo: {
                            regionName: "",
                            regionType: CARTA.RegionType.POINT,
                            controlPoints: [{ x: 1.0, y: 1.0, },],
                            rotation: 0,
                        },
                    },
                ],
            },
        ],
    },
}

describe("Resume action: ", () => {

    let cartaBackend: any;
    let logFile = testImage.substr(testImage.search('/') + 1).replace('.', '_') + "_resume.txt";
    test(`CARTA is ready`, async () => {
        cartaBackend = await Socket.CartaBackend(
            logFile,
            config.port,
        );
        await new Promise(resolve => setTimeout(resolve, config.wait.exec));
    }, execTimeout);

    for (let idx = 0; idx < resumeRepeat; idx++) {

        test(`should resume session and reopen image "${assertItem.resumeSession.images[0].file}"`, async () => {
            let Connection: Client = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
            await Connection.send(CARTA.StopAnimation, assertItem.stopAnomator);
            await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel);
            await Connection.send(CARTA.ResumeSession, assertItem.resumeSession);
            await Connection.stream(3);

            await new Promise(resolve => setTimeout(resolve, resumeWait));
            Connection.close();
        }, resumeTimeout + resumeWait);
    }

    afterAll(done => {
        cartaBackend.kill();
        cartaBackend.on("close", () => done());
    }, execTimeout);
});