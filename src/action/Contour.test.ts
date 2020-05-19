import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testImage: string = config.image.cube;
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
            0.026764668757095933, 
            2.817174522397773, 
            5.60758437603845, 
            8.397994229679128, 
            11.188404083319805
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
            let ackFile: CARTA.OpenFileAck;
            beforeAll(async () => {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                ackFile = await Connection.receive(CARTA.OpenFileAck) as CARTA.OpenFileAck;

                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.stream(5) as AckStream;
            }, openfileTimeout);

            for (let idx: number = 0; idx < contourRepeat; idx++) {
                test(`should return contour data`, async () => {
                    await Connection.send(CARTA.SetContourParameters, {
                        imageBounds: {
                            xMin: 0, xMax: ackFile.fileInfoExtended.width,
                            yMin: 0, yMax: ackFile.fileInfoExtended.height,
                        },
                        ...assertItem.setContour,
                    });
                    let contourImageData = await Connection.receive(CARTA.ContourImageData);
                    let count: number = 0;
                    if (contourImageData.progress == 1) count++;

                    while (count < assertItem.setContour.levels.length) {
                        contourImageData = await Connection.receive(CARTA.ContourImageData);
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