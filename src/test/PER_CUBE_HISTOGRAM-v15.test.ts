import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let messageReturnTimeout = config.timeout.readFile;
let cubeHistogramTimeout = config.timeout.cubeHistogram;

interface IRegionHistogramDataExt extends CARTA.IRegionHistogramData {
    lengthOfHistogramBins: number;
    binValues: { index: number, value: number }[];
}
interface AssertItem {
    register: CARTA.IRegisterViewer;
    fileOpenGroup: CARTA.IOpenFile[];
    setImageChannels: CARTA.ISetImageChannels;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: IRegionHistogramDataExt;
    precisionDigits: number;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "supermosaic.10.fits",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "supermosaic.10.hdf5",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannels: {
        fileId: 0,
        channel: 0,
        stokes: 0,
        requiredTiles: {
            fileId: 0,
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
            tiles: [0],
        },
    },
    setHistogramRequirements: {
        fileId: 0,
        regionId: -2,
        histograms: [
            { channel: -2, numBins: -1 },
        ],
    },
    regionHistogramData: {
        regionId: -2,
        histograms: [
            {
                channel: -2,
                numBins: 2775,
                binWidth: 0.7235205769538879,
                firstBinCenter: -1773.2998046875,
            },
        ],
        lengthOfHistogramBins: 2775,
        binValues: [{ index: 2500, value: 9359604 },],
    },
    precisionDigits: 4,
};

describe("PER_CUBE_HISTOGRAM tests: Testing calculations of the per-cube histogram", () => {
    assertItem.fileOpenGroup.map((fileOpen, index) => {
        describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.fileOpenGroup[index].file}" to set image view`, () => {
            let Connection: Client;
            beforeAll(async () => {
                Connection = new Client(testServerUrl);
                await Connection.open();
                await Connection.send(CARTA.RegisterViewer, assertItem.register);
                await Connection.receive(CARTA.RegisterViewerAck);
            }, connectTimeout);

            test(`(Step 0) Connection open? | `, () => {
                expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            });

            // describe(`(Step 1) Initialization: the open image`, () => {
            //     test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            //         await Connection.send(CARTA.CloseFile, { fileId: 0 });
            //         await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
            //         await Connection.receiveAny()
            //         await Connection.receiveAny() // OpenFileAck | RegionHistogramData
            //     }, openFileTimeout);

            //     let ack: AckStream;
            //     test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
            //         await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
            //         await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            //         await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);

            //         ack = await Connection.stream(15) as AckStream;
            //         // console.log(ack); // RasterTileData * 12 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)
            //         expect(ack.RasterTileData.length).toBe(assertItem.addTilesReq[0].tiles.length);
            //     }, playImageTimeout);

            // });

        });
    });
});
