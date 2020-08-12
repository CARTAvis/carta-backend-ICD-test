import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testImage: string = config.image.cube;
let testSubdirectory: string = config.path.performance;
let resumeTimeout: number = config.timeout.resume;
let resumeRepeat: number = config.repeat.resumeSession;
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

    for (let idx = 0; idx < resumeRepeat; idx++) {

        test(`should resume session and reopen image "${assertItem.resumeSession.images[0].file}"`, async () => {
            let Connection: Client = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
            await Connection.send(CARTA.StopAnimation, assertItem.stopAnomator);
            await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel);
            await Connection.send(CARTA.ResumeSession, assertItem.resumeSession);
            while ((await Connection.receiveAny() as CARTA.ResumeSessionAck).success) { };

            await new Promise(resolve => setTimeout(resolve, 200));
            Connection.close();
        }, resumeTimeout);
    }

});