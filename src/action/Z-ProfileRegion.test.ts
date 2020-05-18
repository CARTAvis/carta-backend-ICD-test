import { CARTA } from "carta-protobuf";

import { Client} from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let cursorTimeout: number = config.timeout.mouseEvent;
let cursorRepeat: number = config.repeat.cursor;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
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
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "cube_A/cube_A_03200_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
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

            describe(`open the file "${fileOpen.file}"`, () => {
                test(`should get z-profile`, async () => {
                    await Connection.send(CARTA.OpenFile, fileOpen);
                    await Connection.receiveAny();
                    await Connection.receiveAny(); // OpenFileAck | RegionHistogramData

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
                    }

                    await new Promise(resolve => setTimeout(resolve, 300));
                    await Connection.send(CARTA.CloseFile, { fileId: -1 });
                }, cursorTimeout * cursorRepeat + 1000);
            });

        });
    });

    afterAll(() => Connection.close());
});