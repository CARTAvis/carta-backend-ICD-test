import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testImage: string = config.image.cube;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let listTimeout: number = config.timeout.listFile;
let readTimeout: number = config.timeout.readFile;
let zoomTimeout: number = config.timeout.zoom;
let zoomRepeat: number = config.repeat.zoom;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesReq: CARTA.IAddRequiredTiles[];
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
    addTilesReq: [
        {
            tiles: [50343939, 50343938, 50339843, 50339842, 50348035,
                50343940, 50348034, 50339844, 50343937, 50335747,
                50339841, 50335746, 50348036, 50348033, 50335748,
                50335745, 50352131, 50343941, 50352130, 50339845,
                50343936, 50331651, 50339840, 50331650, 50352132,
                50348037, 50352129, 50335749, 50348032, 50331652,
                50335744, 50331649, 50352133, 50356227, 50343942,
                50356226, 50339846, 50352128, 50331653, 50356228,
                50348038, 50331648, 50356225, 50335750, 50356229,
                50352134, 50356224, 50331654, 50356230],
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
        },
        {
            tiles: [33558529, 33562625, 33558530, 33558528, 33554433,
                33562626, 33562624, 33554434, 33554432, 33566721,
                33558531, 33566722, 33562627, 33566720, 33554435,
                33566723],
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
        },
    ],
}

describe("Zoom Out Iamge action: ", () => {
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
        }, listTimeout);

        describe(`open the file "${assertItem.fileOpen.file}"`, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.stream(2); // OpenFileAck | RegionHistogramData
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
                let ack: AckStream;
                while (true) {
                    ack = await Connection.stream(1) as AckStream;
                    if (ack.RasterTileSync.length > 0) {
                        if (ack.RasterTileSync[0].endSync) {
                            break;
                        }
                    }
                }
            }, readTimeout);;

            for (let idx: number = 0; idx < zoomRepeat; idx++) {
                test(`image should zoom out`, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
                    let ack: AckStream;
                    while (true) {
                        ack = await Connection.stream(1) as AckStream;
                        if (ack.RasterTileSync.length > 0) {
                            if (ack.RasterTileSync[0].endSync) {
                                break;
                            }
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, config.wait.zoom));
                }, zoomTimeout);

                test(`image should zoom in`, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
                    let ack: AckStream;
                    while (true) {
                        ack = await Connection.stream(1) as AckStream;
                        if (ack.RasterTileSync.length > 0) {
                            if (ack.RasterTileSync[0].endSync) {
                                break;
                            }
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, config.wait.zoom));
                }, zoomTimeout);
            }
        });

    });

    afterAll(() => Connection.close());
});