import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait, Monitor } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testServerUrl: string = config.localHost + ":" + config.port;
let testSubdirectory: string = config.path.performance;
let testImage: string = config.image.cube;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let readfileTimeout: number = config.timeout.readFile;
let cursorTimeout: number = config.timeout.region;
let cursorRepeat: number = config.repeat.region;
let monitorPeriod: number = config.wait.monitor;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    setRegion: CARTA.ISetRegion;
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
        directory: testSubdirectory,
        file: testImage,
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setRegion: {
        fileId: 0,
        regionId: 1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 50, y: 50 }, { x: 0, y: 0 }],
            rotation: 0.0,
        },
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 1,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
}

describe("Z profile cursor action: ", () => {
    let Connection: Client;
    let cartaBackend: any;
    let logFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_ZProfileRegion.txt";
    let usageFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_ZProfileRegion_usage.txt";
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
            let ack: AckStream;
            test(`should open the file "${assertItem.fileOpen.file}"`, async () => {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                ack = await Connection.stream(2) as AckStream; // OpenFileAck | RegionHistogramData
            }, readfileTimeout);

            test(`should get z-profile`, async () => {
                await Connection.send(CARTA.SetRegion, {
                    regionId: -1,
                    ...assertItem.setRegion,
                });
                await Connection.receiveAny();
                await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                await Connection.receiveAny();

                for (let idx = 0; idx < cursorRepeat; idx++) {
                    let Dx = Math.floor((ack.Responce[0] as CARTA.OpenFileAck).fileInfoExtended.width * (.4 + .2 * Math.random()));
                    let Dy = Math.floor((ack.Responce[0] as CARTA.OpenFileAck).fileInfoExtended.height * (.4 + .2 * Math.random()));
                    await Connection.send(CARTA.SetRegion, {
                        ...assertItem.setRegion,
                        regionInfo: {
                            ...assertItem.setRegion.regionInfo,
                            controlPoints: [
                                {
                                    x: Dx - assertItem.setRegion.regionInfo.controlPoints[0].x * .5,
                                    y: Dy - assertItem.setRegion.regionInfo.controlPoints[0].y * .5,
                                },
                                {
                                    x: Dx + assertItem.setRegion.regionInfo.controlPoints[0].x * .5,
                                    y: Dy + assertItem.setRegion.regionInfo.controlPoints[0].y * .5,
                                },
                            ],
                        },
                    });
                    await Connection.receiveAny();
                    let monitor = Monitor(cartaBackend.pid, monitorPeriod);
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                    while ((await Connection.receive(CARTA.SpectralProfileData) as CARTA.SpectralProfileData).progress < 1) { }
                    // let R = await Connection.receive(CARTA.SpectralProfileData) as CARTA.SpectralProfileData;
                    // while ( R.progress< 1) { 
                    //     R = await Connection.receive(CARTA.SpectralProfileData) as CARTA.SpectralProfileData;
                    //     console.log(R);
                    // }
                    clearInterval(monitor.id);
                    if (monitor.data.cpu.length === 0) {
                        await AppendTxt(usageFile, await Usage(cartaBackend.pid));
                    } else {
                        await AppendTxt(usageFile, monitor.data);
                    }
                    await Wait(config.wait.cursor);
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