import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let fileopenTimeout: number = config.timeout.readFile;
let cursorTimeout: number = config.timeout.mouseEvent;
let cursorRepeat: number = config.repeat.cursor;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
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
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "cube_A/cube_A_03200_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
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

describe("Z profile cursor: ", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);


    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.FileListRequest, assertItem.filelist);
            await Connection.receive(CARTA.FileListResponse);
        }, connectTimeout);

        assertItem.fileOpenGroup.map((fileOpen: CARTA.IOpenFile, index) => {
            let ack: AckStream;
            describe(`start the action`, () => {
                test(`should open the file "${fileOpen.file}"`, async () => {
                    await Connection.send(CARTA.OpenFile, fileOpen);
                    ack = await Connection.stream(2) as AckStream; // OpenFileAck | RegionHistogramData
                }, fileopenTimeout);

                test(`should get z-profile`, async () => {
                    const width = (ack.Responce[0] as CARTA.OpenFileAck).fileInfoExtended.width;
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                    await Connection.receiveAny();
                    for (let idx = 0; idx < cursorRepeat; idx++) {
                        await Connection.send(CARTA.SetCursor, {
                            ...assertItem.setCursor,
                            point: {
                                x: Math.floor(width * (.3 + .4 * Math.random())),
                                y: Math.floor(width * (.3 + .4 * Math.random())),
                            },
                        });
                        ack = await Connection.stream(1) as AckStream;
                        while (ack.SpectralProfileData.length) {
                            if (ack.SpectralProfileData[0].progress == 1) {
                                break;
                            } else {
                                ack = await Connection.stream(1) as AckStream;
                            }
                        }
                    }

                    await Connection.send(CARTA.CloseFile, { fileId: -1 });
                }, (cursorTimeout + config.wait.cursor) * cursorRepeat);
            });

        });
    });

    afterAll(() => Connection.close());
});