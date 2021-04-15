import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let playImageTimeout: number = config.timeout.playImages;
let contourTimeout: number = config.timeout.contour;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setContour: CARTA.ISetContourParameters[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "h_m51_b_s05_drz_sci.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33558529, 33558528, 33554433, 33562625, 33554432, 33562624, 33558530, 33554434, 33562626],
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 0,
            smoothingFactor: 4,
            levels: [1.1014473195533452, 1.9245819583813286, 2.747716597209312, 3.5708512360372953, 4.393985874865279],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            levels: [1.1014473195533452, 1.9245819583813286, 2.747716597209312, 3.5708512360372953, 4.393985874865279],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
};

describe("CONTOUR_CHANGE_SMOOTH_MODE_FACTOR: Testing Contour with different SmoothingMode & SmoothingFactor", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        }, connectTimeout);

        describe(`(Step 1) Initialize the open image"`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                await Connection.openFile(assertItem.openFile);
            }, openFileTimeout);

            let Ack: AckStream;
            test(`Initialised WCS info from frame: ADD_REQUIRED_TILES, SET_CURSOR, and SET_SPATIAL_REQUIREMENTS, then check them are all returned correctly:`, async () => {
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
                Ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                expect(Ack.RasterTileData.length).toEqual(assertItem.addTilesReq[0].tiles.length);
            }, playImageTimeout);
        });

        describe(`(Contour Tests)`, () => {
            test(`(Step 2) Set Default Contour Parameters:`, async () => {
                await Connection.send(CARTA.SetContourParameters, assertItem.setContour[0]);
                await Connection.streamUntil(
                    (type, data, ack) => ack.ContourImageData.filter(data => data.progress == 1).length == assertItem.setContour[0].levels.length
                );
            }, contourTimeout);

            let SF_number = new Array(5).fill(1).map((_, i) => i + 1);
            let newnumber = SF_number.sort(() => Math.random() - 0.5);
            console.log('New Contour smoothing factor (random between 1 and 5):', newnumber);

            [1, 2].map((number, idx) => {
                test(`(Step 3.${idx}) Change contour smoothing: Smooth Mode of ${number} & Smooth Factor of ${newnumber[idx]} (random number)`, async () => {
                    await Connection.send(CARTA.SetContourParameters,
                        {
                            ...assertItem.setContour[1],
                            smoothingMode: number,
                            smoothingFactor: newnumber[idx],
                        }
                    );
                    await Connection.streamUntil(
                        (type, data, ack) => ack.ContourImageData.filter(data => data.progress == 1).length == assertItem.setContour[1].levels.length
                    );
                }, contourTimeout);
            });
        });
    });
    afterAll(() => Connection.close());
});