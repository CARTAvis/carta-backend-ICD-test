import { CARTA } from "carta-protobuf";

import { Client, AckStream, Usage, AppendTxt, EmptyTxt, Wait, Monitor } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let fileopenTimeout: number = config.timeout.readLargeImage;
let cursorTimeout: number = config.timeout.mouseEvent;
let cursorRepeat: number = config.repeat.cursor;
let monitorPeriod: number = config.wait.monitor;
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
            spatialProfiles: [],
        },
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 0,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
}
let cubeName = "cube_B"
let channel = "00100"
let testFiles = [
    `${cubeName}/${cubeName}_01600_z${channel}.fits`,
    `${cubeName}/${cubeName}_01600_z${channel}.image`,
    `${cubeName}/${cubeName}_01600_z${channel}.hdf5`,

    `${cubeName}/${cubeName}_03200_z${channel}.fits`,
    `${cubeName}/${cubeName}_03200_z${channel}.image`,
    `${cubeName}/${cubeName}_03200_z${channel}.hdf5`,

    `${cubeName}/${cubeName}_06400_z${channel}.fits`,
    `${cubeName}/${cubeName}_06400_z${channel}.image`,
    `${cubeName}/${cubeName}_06400_z${channel}.hdf5`,

    `${cubeName}/${cubeName}_01600_z01000.fits`,
    `${cubeName}/${cubeName}_01600_z01000.image`,
    `${cubeName}/${cubeName}_01600_z01000.hdf5`,
    `${cubeName}/${cubeName}_01600_z02000.fits`,
    `${cubeName}/${cubeName}_01600_z02000.image`,
    `${cubeName}/${cubeName}_01600_z02000.hdf5`,
    `${cubeName}/${cubeName}_01600_z04000.fits`,
    `${cubeName}/${cubeName}_01600_z04000.image`,
    `${cubeName}/${cubeName}_01600_z04000.hdf5`,

    `${cubeName}/${cubeName}_12800_z${channel}.fits`,
    `${cubeName}/${cubeName}_12800_z${channel}.image`,
    `${cubeName}/${cubeName}_12800_z${channel}.hdf5`,

    `${cubeName}/${cubeName}_25600_z${channel}.fits`,
    `${cubeName}/${cubeName}_25600_z${channel}.image`,
    `${cubeName}/${cubeName}_25600_z${channel}.hdf5`,

    `${cubeName}/${cubeName}_51200_z${channel}.fits`,
    `${cubeName}/${cubeName}_51200_z${channel}.image`,
    // `${cubeName}/${cubeName}_51200_z${channel}.hdf5`,
];
testFiles.map(file => {
    let testServerUrl: string = `${config.localHost}:${config.port}`;
    describe(`Z profile cursor action: ${file.substr(file.search('/') + 1)}`, () => {
        let Connection: Client;
        let cartaBackend: any;
        let logFile = file.substr(file.search('/') + 1).replace('.', '_') + "_ZProfileCursor.txt";
        let usageFile = file.substr(file.search('/') + 1).replace('.', '_') + "_ZProfileCursor_usage.txt";
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
                test(`should open the file "${file}"`, async () => {
                    await Connection.send(CARTA.OpenFile, {
                        file: file,
                        ...assertItem.fileOpen,
                    });
                    ack = await Connection.stream(2) as AckStream; // OpenFileAck | RegionHistogramData
                }, fileopenTimeout);

                test(`should get z-profile`, async () => {
                    const width = (ack.Responce[0] as CARTA.OpenFileAck).fileInfoExtended.width;
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                    await Connection.receiveAny();
                    for (let idx = 0; idx < cursorRepeat; idx++) {
                        let monitor = Monitor(cartaBackend.pid, monitorPeriod);
                        await Connection.send(CARTA.SetCursor, {
                            ...assertItem.setCursor,
                            point: {
                                x: Math.floor(width * (.3 + .4 * Math.random())),
                                y: Math.floor(width * (.3 + .4 * Math.random())),
                            },
                        });
                        ack = await Connection.stream(1) as AckStream;
                        while ((await Connection.receive(CARTA.SpectralProfileData) as CARTA.SpectralProfileData).progress < 1) { }
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
});