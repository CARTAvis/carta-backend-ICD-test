import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testServerUrl: string = config.localHost + ":" + config.port;
let testSubdirectory: string = config.path.performance;
let testImage: string = config.image.cube;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let readfileTimeout: number = config.timeout.readFile;
let cursorTimeout: number = config.timeout.mouseEvent;
let cursorRepeat: number = config.repeat.cursor;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
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
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setCursor: {
        fileId: 0,
        point: { x: 500.0, y: 500.0 },
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: []
        },
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 0,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
}

describe("Z profile cursor action: ", () => {
    let Connection: Client;
    let cartaBackend: any;
    let logFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_ZProfileCursor.txt";
    let usageFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_ZProfileCursor_usage.txt";
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
            let ack: AckStream;
            test(`should open the file "${assertItem.fileOpen.file}"`, async () => {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                ack = await Connection.stream(2) as AckStream; // OpenFileAck | RegionHistogramData
            }, readfileTimeout);

            test(`should get z-profile`, async () => {
                const width = (ack.Responce[0] as CARTA.OpenFileAck).fileInfoExtended.width;
                await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                await EmptyTxt(usageFile);
                for (let idx = 0; idx < cursorRepeat; idx++) {
                    await Connection.send(CARTA.SetCursor, {
                        ...assertItem.setCursor,
                        point: {
                            x: Math.floor(width * (.3 + .4 * Math.random())),
                            y: Math.floor(width * (.3 + .4 * Math.random())),
                        },
                    });
                    await Connection.receiveAny();
                    await Usage(cartaBackend.pid);
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                    while ((await Connection.receive(CARTA.SpectralProfileData) as CARTA.SpectralProfileData).progress < 1) { }
                    await Wait(config.wait.cursor);
                    await AppendTxt(usageFile, await Usage(cartaBackend.pid));
                }

                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, (cursorTimeout + config.wait.cursor) * cursorRepeat);
        });
    });

    afterAll(async done => {
        await Connection.close();
        cartaBackend.kill();
        cartaBackend.on("close", () => done());
    }, execTimeout);
});