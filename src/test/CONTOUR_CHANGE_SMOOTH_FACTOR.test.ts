import { CARTA } from "carta-protobuf";

import { Client, AckStream, ProcessContourData } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');
const ZstdCodec = require('zstd-codec').ZstdCodec;

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let playImageTimeout: number = config.timeout.playImages;
let contourTimeout: number = config.timeout.contour;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
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
    addTilesReq: {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
    },
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
            levels: [0.6],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
            smoothingMode: CARTA.SmoothingMode.BlockAverage,
            smoothingFactor: 4,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            levels: [0.85],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 6,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            levels: [0.1],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
            smoothingMode: CARTA.SmoothingMode.NoSmoothing,
            smoothingFactor: 2,
        },
    ],
};

describe("CONTOUR_CHANGE_SMOOTH_MODE_FACTOR: Testing Contour with different SmoothingMode & SmoothingFactor", () => {
    let zstdSimple: any;
    test(`prepare zstd`, done => {
        ZstdCodec.run(zstd => {
            zstdSimple = new zstd.Simple();
            done();
        });
    }, config.timeout.wasm);

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
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                Ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                expect(Ack.RasterTileData.length).toEqual(assertItem.addTilesReq.tiles.length);
            }, playImageTimeout);
        });

        describe(`(Contour Tests)`, () => {
            let ContourImageData: CARTA.ContourImageData;
            assertItem.setContour.map((input,index)=>{
                test(`(Step ${index+2}: Smoothing mode of ${input.smoothingMode} & Smoothing factor of ${input.smoothingFactor}): Check Vertices coordinates are consistent to Snapshot`,async()=>{
                    await Connection.send(CARTA.SetContourParameters,input);
                    let temp = await Connection.streamUntil((type,data,ack)=>ack.ContourImageData.filter(data => data.progress == 1).length == input.levels.length);
                    ContourImageData = temp.ContourImageData[temp.ContourImageData.length-1];
                    // console.log(ContourImageData);

                    //Using Snapshot to compare the vertices
                    let floatData = ProcessContourData(ContourImageData, zstdSimple).contourSets[0].coordinates;
                    // console.log(floatData);
                    expect(floatData).toMatchSnapshot();
                })
            })
        });
    });
    afterAll(() => Connection.close());
});