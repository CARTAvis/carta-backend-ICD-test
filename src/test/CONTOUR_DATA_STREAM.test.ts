import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;
let contourTimeout: number = config.timeout.contour;
let messageTimeout: number = config.timeout.messageEvent;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setContour: CARTA.ISetContourParameters;
    contourImageData: CARTA.IContourImageData;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "h_m51_b_s05_drz_sci.fits",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    setCursor: {
        fileId: 0,
        point: { x: 0.5, y: 0.5 },
        spatialRequirements: {
            fileId: 0,
            regionId: 0,
            spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
        },
    },
    setContour: {
        fileId: 0,
        referenceFileId: 0,
        imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
        levels: [0.36, 0.72, 1.09],
        smoothingMode: CARTA.SmoothingMode.NoSmoothing,
        smoothingFactor: 4,
        decimationFactor: 4,
        compressionLevel: 8,
        contourChunkSize: 100000,
    },
    contourImageData: {
        progress: 1,
    },
};

describe("CONTOUR_DATA_STREAM: Testing contour data stream when there are a lot of vertices", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.openFile(assertItem.openFile);

            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
            await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        }, readTimeout);

        describe(`SET_CONTOUR_PARAMETERS with SmoothingMode:"${CARTA.SmoothingMode[assertItem.setContour.smoothingMode]}"`, () => {
            test(`should return CONTOUR_IMAGE_DATA x${assertItem.setContour.levels.length} with progress = ${assertItem.contourImageData.progress} in the end`, async () => {
                await Connection.send(CARTA.SetContourParameters, assertItem.setContour);
                await Connection.streamUntil(
                    (type, data, ack: AckStream) => ack.ContourImageData.filter(data => data.progress == assertItem.contourImageData.progress).length == assertItem.setContour.levels.length
                );

                await Connection.receive(CARTA.ContourImageData, messageTimeout, false);
            }, contourTimeout * assertItem.setContour.levels.length);
        });

    });

    afterAll(() => Connection.close());
});