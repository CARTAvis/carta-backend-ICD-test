import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const ZstdCodec = require('zstd-codec').ZstdCodec;
let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;

interface ContourImageData extends CARTA.IContourImageData {
    contourVertices?: number[];
}
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setContour: CARTA.ISetContourParameters[];
    contourImageData: ContourImageData[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "contour_test.miriad",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
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
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: { xMin: 0, xMax: 21, yMin: 0, yMax: 21 },
            levels: [0.6],
            smoothingMode: CARTA.SmoothingMode.GaussianBlur,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: { xMin: 0, xMax: 21, yMin: 0, yMax: 21 },
            levels: [0.6],
            smoothingMode: CARTA.SmoothingMode.BlockAverage,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            imageBounds: { xMin: 0, xMax: 21, yMin: 0, yMax: 21 },
            levels: [0.85],
            smoothingMode: CARTA.SmoothingMode.NoSmoothing,
            smoothingFactor: 4,
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
    contourImageData: [
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 104,
                },
            ],
            progress: 1,
            contourVertices: [
                10.00,  11.25,
                10.75,  11.00,
                11.00,  10.75,
                11.25,  10.00,
                11.00,  9.25,
                10.75,  9.00,
                10.00,  8.75,
                9.25,   9.00,
                9.00,   9.25,
                8.75,   10.00,
                9.00,   10.75,
                9.25,   11.00,
            ],
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 40,
                },
            ],
            progress: 1,
            contourVertices: [
                9.50,   10.75,
                10.75,  9.50,
                9.50,   8.50,
                8.50,   9.50,
            ],
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 0.85,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 104,
                },
            ],
            progress: 1,
            contourVertices: [
                10.00,  11.25,
                10.50,  11.00,
                11.00,  10.50,
                11.25,  10.00,
                11.00,  9.50,
                10.50,  9.00,
                10.00,  8.75,
                9.50,   9.00,
                9.00,   9.50,
                8.75,   10.00,
                9.00,   10.50,
                9.50,   11.00,
            ],
        },
    ],
};

describe("CONTOUR_IMAGE_DATA test: Testing if contour image data (vertices) are delivered correctly", () => {

    let zstdSimple: any;
    test(`prepare zstd`, done => {
        ZstdCodec.run(zstd => {
            zstdSimple = new zstd.Simple();
            // console.log("zstd simple ready");
            done();
        });
    }, config.timeout.wasm);

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);

            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            // REGION_HISTOGRAM_DATA RASTER_TILE_SYNC SPATIAL_PROFILE_DATA RASTER_TILE_DATA RASTER_TILE_SYNC
            await Connection.stream(6) as AckStream;
        }, readTimeout);

        assertItem.contourImageData.map((contour, index) => {
            describe(`SET_CONTOUR_PARAMETERS${index} with SmoothingMode:"${CARTA.SmoothingMode[assertItem.setContour[index].smoothingMode]}"`, () => {
                let ContourImageData: CARTA.ContourImageData;
                let floatData: Number[];
                test(`should return CONTOUR_IMAGE_DATA x1`, async () => {
                    await Connection.send(CARTA.SetContourParameters, assertItem.setContour[index]);
                    ContourImageData = await Connection.receive(CARTA.ContourImageData);

                    if (contour.contourSets[0].decimationFactor > 0) {
                        floatData = unshuffle(new Uint8Array(zstdSimple.decompress(ContourImageData.contourSets[0].rawCoordinates).slice().buffer), 4.0);
                    } else {
                        floatData = Array.from(new Float32Array(ContourImageData.contourSets[0].rawCoordinates.slice().buffer));
                    }
                    // console.log(unshuffle(new Uint8Array(zstdSimple.decompress(ContourImageData.contourSets[0].rawCoordinates).slice().buffer), 4.0));
                }, readTimeout);

                test(`fileId = ${contour.fileId}`, () => {
                    expect(ContourImageData.fileId).toEqual(contour.fileId);
                });

                test(`referenceFileId = ${contour.referenceFileId}`, () => {
                    expect(ContourImageData.referenceFileId).toEqual(contour.referenceFileId);
                });

                test(`progress = 1`, () => {
                    expect(ContourImageData.progress).toEqual(1);
                });

                test(`len(contourSet) = 1`, () => {
                    expect(ContourImageData.contourSets.length).toEqual(1);
                });

                test(`contourSets[0].level = ${contour.contourSets[0].level}`, () => {
                    expect(ContourImageData.contourSets[0].level).toEqual(contour.contourSets[0].level);
                });

                test(`contourSets[0].decimationFactor = ${contour.contourSets[0].decimationFactor}`, () => {
                    expect(ContourImageData.contourSets[0].decimationFactor).toEqual(contour.contourSets[0].decimationFactor);
                });

                test(`contourSets[0].uncompressedCoordinatesSize = ${contour.contourSets[0].uncompressedCoordinatesSize}`, () => {
                    expect(ContourImageData.contourSets[0].uncompressedCoordinatesSize).toEqual(contour.contourSets[0].uncompressedCoordinatesSize);
                });

                test(`number of contour vertices = ${contour.contourVertices.length / 2}`, () => {
                    expect(floatData.length).toEqual(2 + contour.contourVertices.length);
                });

                test(`assert contour vertices`, async () => {
                    contour.contourVertices.map((f, idx) => {
                        expect(floatData[idx]).toEqual(f);
                    });
                });

            });
        });

    });

    afterAll(() => Connection.close());
});
function unshuffle(raw, decimationFactor) {
    const numIntegers = raw.length / 4;
    const blockedLength = 4 * Math.floor(numIntegers / 4);
    const scale = 1.0 / decimationFactor;
    let buffer: number[] = new Array(16);
    let rawInt32 = new Int32Array(new Uint8Array(raw).buffer);
    let data = new Array(numIntegers);
    let v = 0;
    for (; v < blockedLength; v += 4) {
        const i = 4 * v;

        buffer[0] = raw[i];
        buffer[1] = raw[i + 4];
        buffer[2] = raw[i + 8];
        buffer[3] = raw[i + 12];
        buffer[4] = raw[i + 1];
        buffer[5] = raw[i + 5];
        buffer[6] = raw[i + 9];
        buffer[7] = raw[i + 13];
        buffer[8] = raw[i + 2];
        buffer[9] = raw[i + 6];
        buffer[10] = raw[i + 10];
        buffer[11] = raw[i + 14];
        buffer[12] = raw[i + 3];
        buffer[13] = raw[i + 7];
        buffer[14] = raw[i + 11];
        buffer[15] = raw[i + 15];

        let bufferInt32 = new Int32Array(new Uint8Array(buffer).buffer);
        data[v] = bufferInt32[0] * scale;
        data[v + 1] = bufferInt32[1] * scale;
        data[v + 2] = bufferInt32[2] * scale;
        data[v + 3] = bufferInt32[3] * scale;

    }
    for (; v < numIntegers; v++) {
        data[v] = rawInt32[v] * scale;
    }
    let lastX = 0;
    let lastY = 0;

    for (let i = 0; i < numIntegers - 1; i += 2) {
        let deltaX = data[i];
        let deltaY = data[i + 1];
        lastX += deltaX;
        lastY += deltaY;
        data[i] = lastX;
        data[i + 1] = lastY;
    }
    return data;
}