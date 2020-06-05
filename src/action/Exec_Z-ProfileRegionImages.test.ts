import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testSubdirectory: string = config.path.performance;
let execTimeout: number = config.timeout.execute;
let connectTimeout: number = config.timeout.connection;
let fileopenTimeout:number = config.timeout.readLargeImage;
let cursorTimeout: number = config.timeout.region;
let cursorRepeat: number = config.repeat.cursor;
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
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setRegion: {
        fileId: 0,
        regionId: 1,
        regionName: "",
        regionType: CARTA.RegionType.RECTANGLE,
        controlPoints: [{ x: 400, y: 400 }, { x: 10, y: 10 }],
        rotation: 0.0,
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 1,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
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
    let testServerUrl: string = `${config.localHost}:${config.port}`;
    describe(`Z profile cursor action: ${file.substr(file.search('/') + 1)}`, () => {
        let Connection: Client;
        let cartaBackend: any;
        let logFile = file.substr(file.search('/') + 1).replace('.', '_') + "_ZProfileRegion.txt";
        test(`CARTA is ready`, async () => {
            cartaBackend = await Socket.CartaBackend(
                logFile,
                config.port,
            );
            await new Promise(resolve => setTimeout(resolve, config.wait.exec));
        }, execTimeout + config.wait.exec);

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            beforeAll(async () => {
                Connection = new Client(testServerUrl);
                await Connection.open();
                await Connection.send(CARTA.RegisterViewer, assertItem.register);
                await Connection.receive(CARTA.RegisterViewerAck);
            }, connectTimeout);

            describe(`start the action`, () => {
                test(`should open the file "${file}"`, async () => {
                    await Connection.send(CARTA.OpenFile, {
                        file: file,
                        ...assertItem.fileOpen,
                    });
                    await Connection.receiveAny();
                    await Connection.receiveAny(); // OpenFileAck | RegionHistogramData
                }, fileopenTimeout);

                test(`should get z-profile`, async () => {
                    await Connection.send(CARTA.SetRegion, {
                        regionId: -1,
                        ...assertItem.setRegion,
                    });
                    await Connection.receiveAny();
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                    await Connection.receiveAny();

                    for (let idx = 0; idx < cursorRepeat; idx++) {
                        let Dx = Math.floor(assertItem.setRegion.controlPoints[0].x * .5 * Math.random());
                        let Dy = Math.floor(assertItem.setRegion.controlPoints[0].y * .5 * Math.random());
                        await Connection.send(CARTA.SetRegion, {
                            ...assertItem.setRegion,
                            controlPoints: [
                                {
                                    x: assertItem.setRegion.controlPoints[0].x + Dx,
                                    y: assertItem.setRegion.controlPoints[0].x + Dy,
                                },
                                {
                                    x: assertItem.setRegion.controlPoints[1].x + Dx,
                                    y: assertItem.setRegion.controlPoints[1].x + Dy,
                                },
                            ],
                        });
                        await Connection.receiveAny();
                        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                        await Connection.receiveAny();
                        await new Promise(resolve => setTimeout(resolve, config.wait.cursor));
                    }

                    await Connection.send(CARTA.CloseFile, { fileId: -1 });
                }, (cursorTimeout + config.wait.cursor) * cursorRepeat;
            });

        });

        afterAll(async done => {
            await Connection.close();
            cartaBackend.kill();
            cartaBackend.on("close", () => done());
        }, execTimeout);
    });
});