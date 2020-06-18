import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let readFileTimeout: number = config.timeout.readLargeImage;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpenGroup: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor;
    addTilesReq: CARTA.IAddRequiredTiles;
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
            file: "cube_A/cube_A_12800_z00100.fits",
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
            spatialProfiles: []
        },
    },
    addTilesReq:
    {
        tiles: [33558529, 33562625, 33558528, 33558530, 
            33554433, 33562624, 33562626, 33554432, 
            33554434, 33566721, 33558531, 33566720, 
            33566722, 33562627, 33554435, 33566723],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
}

describe("Load Iamge action: ", () => {
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
                test(`messages should return`, async () => {
                    await Connection.send(CARTA.OpenFile, fileOpen);
                    await Connection.receiveAny(); // OpenFileAck

                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                    let ack: AckStream;
                    while (true) {
                        ack = await Connection.stream(1) as AckStream;
                        if (ack.RasterTileSync.length > 0) {
                            if (ack.RasterTileSync[0].endSync) {
                                break;
                            }
                        }
                    }
                    await Connection.send(CARTA.CloseFile, { fileId: -1 });
                    await new Promise(resolve => setTimeout(resolve, 500));
                }, readFileTimeout);
            });

        });
    });

    afterAll(() => Connection.close());
});