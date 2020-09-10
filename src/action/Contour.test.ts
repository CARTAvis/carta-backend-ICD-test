import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testImage: string = config.image.singleChannel;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openfileTimeout: number = config.timeout.openFile;
let contourTimeout: number = config.timeout.contour;
let contourRepeat: number = config.repeat.contour;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesReq: CARTA.IAddRequiredTiles;
    setContour: CARTA.ISetContourParameters;
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
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    setContour: {
        fileId: 0,
        referenceFileId: 0,
        imageBounds: { xMin: 0, xMax: 800, yMin: 0, yMax: 800 },
        levels: [
            1.27, 2.0, 2.2, 3.0,
            3.75, 4.0, 4.99, 5.2,
            6.23, 6.6, 7.47, 7.8,
            8.71, 9.0, 9.95, 10.2,
        ],
        smoothingMode: CARTA.SmoothingMode.GaussianBlur,
        smoothingFactor: 4,
        decimationFactor: 4,
        compressionLevel: 8,
        contourChunkSize: 100000,
    },
}

describe("Contour action: ", () => {
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

        describe(`open the file "${assertItem.fileOpen.file}"`, () => {
            let ack: AckStream;
            beforeAll(async () => {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                ack = await Connection.stream(2) as AckStream; // OpenFileAck | RegionHistogramData
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                while ((await Connection.receiveAny() as CARTA.RasterTileSync).endSync) { }
            }, openfileTimeout);

            for (let idx: number = 0; idx < contourRepeat; idx++) {
                test(`should return contour data`, async () => {
                    await Connection.send(CARTA.SetContourParameters, {
                        imageBounds: {
                            xMin: 0, xMax: <CARTA.OpenFile>(ack.Responce[0]).fileInfoExtended.width,
                            yMin: 0, yMax: <CARTA.OpenFile>(ack.Responce[0]).fileInfoExtended.height,
                        },
                        ...assertItem.setContour,
                    });

                    let count: number = 0;

                    while (count < assertItem.setContour.levels.length) {
                        let contourImageData = await Connection.receive(CARTA.ContourImageData);
                        if (contourImageData.progress == 1) count++;
                    }
                    await Connection.send(CARTA.SetContourParameters, {
                        fileId: 0,
                        referenceFileId: 0,
                    }); // Clear contour

                    await new Promise(resolve => setTimeout(resolve, 200));
                }, contourTimeout);
            }
            
        });

    });

    afterAll(() => Connection.close());
});