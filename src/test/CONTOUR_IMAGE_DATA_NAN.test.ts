import { CARTA } from "carta-protobuf";

import { Client, AckStream, processContourSet } from "./CLIENT";
import config from "./config.json";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;

interface ContourImageData extends CARTA.IContourImageData{
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
            spatialProfiles: ["x", "y"]
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
            compressionLevel: 0,
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
            compressionLevel: 0,
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
            compressionLevel: 0,
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
                3,      18,
                4,      17,
                5,      16.5,
                5.75,   16,
                6,      16,
                7,      15.5,
                7.5,    15,
                8,      14.75,
                8.25,   14,
                8.75,   13,
                11.75,  10,
                13.75,  6,
                14.75,  5,
                15,     4.5,
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
                1.5,    20,
                3.25,   17.5,
                5.5,    16.75,
                7.25,   13.5,
                12.5,   9.5,
                13.5,   6.25,
                14.5,   5.5,
                17.5,   2,
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
                0,      20,
                1,      19,
                2,      19,
                4,      17,
                4.75,   16,
                5,      15.75,
                6,      16,
                10,     16,
                12,     14,
                12,     11,
                13,     10,
                13,     6,
                14,     5,
                15,     4.75,
                15.5,   4,
                16.5,   3,
                17,     2,
                18,     1,
            ],
        },
    ],
};

describe("CONTOUR_IMAGE_DATA_NAN test: Testing if contour image data (vertices) are delivered correctly if NaN pixels are present", () => {

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
            await Connection.receiveAny() // OpenFileAck

            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            // REGION_HISTOGRAM_DATA RASTER_TILE_SYNC SPATIAL_PROFILE_DATA RASTER_TILE_DATA RASTER_TILE_SYNC
            await Connection.stream(5) as AckStream;
        }, readTimeout);

        assertItem.contourImageData.map((contour, index) => {
            describe(`SET_CONTOUR_PARAMETERS${index} with SmoothingMode:"${CARTA.SmoothingMode[assertItem.setContour[index].smoothingMode]}"`, () => {
                let ContourImageData: CARTA.ContourImageData;
                test(`should return CONTOUR_IMAGE_DATA x1`, async () => {
                    await Connection.send(CARTA.SetContourParameters, assertItem.setContour[index]);
                    ContourImageData = await Connection.receive(CARTA.ContourImageData);
                    // console.log(ContourImageData.contourSets.map(set => processContourSet(set))[0]);
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

                test(`number of contour vertices = ${contour.contourVertices.length/2}`, () => {
                    expect(processContourSet(ContourImageData.contourSets[0]).coordinates.length).toEqual(contour.contourVertices.length);
                });

                test(`assert contour vertices`, () => {
                    expect(JSON.stringify(processContourSet(ContourImageData.contourSets[0]).coordinates)).toEqual(JSON.stringify(contour.contourVertices));
                });

            });
        });

    });

    afterAll(() => Connection.close());
});