import { CARTA } from "carta-protobuf";

import { Client, AckStream, ProcessContourData } from "./CLIENT";
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
        file: "contour_test_nan.image",
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
        point: { x: 0.5, y: 0.5 },
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
            levels: [5.6],
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
            levels: [5.6],
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
            levels: [5.6],
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
                    level: 5.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 208,
                },
            ],
            progress: 1,
            contourVertices: [
                15, 4.5,
                14.75, 5,
                14, 5.75,
                13.75, 6,
                13.25, 7,
                13, 7.5,
                12.75, 8,
                12.25, 9,
                12, 9.5,
                11.75, 10,
                11, 10.75,
                10.75, 11,
                10, 11.75,
                9.75, 12,
                9, 12.75,
                8.75, 13,
                8.25, 14,
                8, 14.75,
                7.5, 15,
                7, 15.5,
                6, 16,
                5.75, 16,
                5, 16.5,
                4, 17,
                4, 17,
                3, 18
            ],
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 5.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 72,
                },
            ],
            progress: 1,
            contourVertices: [
                17.5, 2,
                14.5, 5.5,
                13.5, 6.25,
                12.5, 9.5,
                9.5, 11.75,
                7.25, 13.5,
                5.5, 16.75,
                3.25, 17.5,
                1.5, 20
            ],
        },
        {
            fileId: 0,
            referenceFileId: 0,
            contourSets: [
                {
                    level: 5.6,
                    decimationFactor: 4,
                    uncompressedCoordinatesSize: 304,
                },
            ],
            progress: 1,
            contourVertices: [
                18, 1,
                18, 1,
                17, 2,
                17, 2,
                16.5, 3,
                16, 3.5,
                15.5, 4,
                15, 4.75,
                14, 5,
                14, 5,
                13, 6,
                13, 6,
                13, 7,
                13, 8,
                13, 9,
                13, 10,
                12, 11,
                12, 11,
                12, 12,
                12, 13,
                12, 14,
                11, 15,
                11, 15,
                10, 16,
                9, 16,
                8, 16,
                7, 16,
                6, 16,
                5, 15.75,
                4.75, 16,
                4, 17,
                4, 17,
                3, 18,
                3, 18,
                2, 19,
                1, 19,
                1, 19,
                0, 20
            ],
        },
    ],
};

describe("CONTOUR_IMAGE_DATA_NAN test: Testing if contour image data (vertices) are delivered correctly if NaN pixels are present", () => {

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
            // REGION_HISTOGRAM_DATA OPEN_FILE_ACK RASTER_TILE_SYNC SPATIAL_PROFILE_DATA RASTER_TILE_SYNC
            await Connection.stream(5) as AckStream;
        }, readTimeout);

        assertItem.contourImageData.map((contour, index) => {
            describe(`SET_CONTOUR_PARAMETERS${index} with SmoothingMode:"${CARTA.SmoothingMode[assertItem.setContour[index].smoothingMode]}"`, () => {
                let ContourImageData: CARTA.ContourImageData;
                let floatData: Float32Array;
                test(`should return CONTOUR_IMAGE_DATA x1`, async () => {
                    await Connection.send(CARTA.SetContourParameters, assertItem.setContour[index]);
                    ContourImageData = await Connection.receive(CARTA.ContourImageData);

                    floatData = ProcessContourData(ContourImageData, zstdSimple).contourSets[0].coordinates;
                });

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
                    expect(floatData.length).toEqual(contour.contourVertices.length);
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