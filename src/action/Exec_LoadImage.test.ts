import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import * as Socket from "./SocketOperation";
import config from "./config.json";
let testServerUrl: string = config.localHost + ":" + config.port;
let testSubdirectory: string = config.path.performance;
let testImage: string = config.image.singleChannel;
let execTimeout: number = config.timeout.execute;
let listTimeout: number = config.timeout.listFile;
let readFileTimeout: number = config.timeout.readLargeImage;
let imageReload: number = config.repeat.image;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
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
    fileOpen: {
        directory: testSubdirectory,
        file: testImage,
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
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

describe("Load Image action: ", () => {
    let Connection: Client;
    let cartaBackend: any;
    let logFile = assertItem.fileOpen.file.substr(assertItem.fileOpen.file.search('/') + 1).replace('.', '_') + "_loadImage.txt";
    test(`CARTA is ready`, async () => {
        cartaBackend = await Socket.CartaBackend(
            logFile,
            config.port,
        );
        await new Promise(resolve => setTimeout(resolve, config.wait.exec));
    }, execTimeout);

    describe(`Start the action: load image`, () => {
        test(`Connection is ready`, async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, listTimeout);

        describe(`open the file "${assertItem.fileOpen.file}"`, () => {
            test(`${imageReload} images data should return`, async () => {
                for (let index: number = 0; index < imageReload; index++) {
                    await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
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
                }
                await new Promise(resolve => setTimeout(resolve, execTimeout));
            }, readFileTimeout);
        });

    });

    afterAll(async done => {
        await Connection.close();
        cartaBackend.kill();
        cartaBackend.on("close", () => done());
    }, execTimeout);
});