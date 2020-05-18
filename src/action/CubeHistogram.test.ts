import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let cubeHistogramTimeout: number = config.timeout.cubeHistogram;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
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
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "cube_A/cube_A_00800_z00100.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: ["x", "y"]
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

describe("Cube histogram: ", () => {
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
                test(`should get cube histogram`, async () => {
                    await Connection.send(CARTA.OpenFile, fileOpen);
                    await Connection.receiveAny();
                    await Connection.receiveAny(); // OpenFileAck | RegionHistogramData

                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                    while ((await Connection.stream(1) as AckStream).RegionHistogramData[0].progress < 1) {}

                    await new Promise(resolve => setTimeout(resolve, 300));
                    await Connection.send(CARTA.CloseFile, { fileId: -1 });
                }, cubeHistogramTimeout);
            });

        });
    });

    afterAll(() => Connection.close());
});