import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cubeHistogramTimeout = config.timeout.cubeHistogram;

interface IRegionHistogramDataExt extends CARTA.IRegionHistogramData {
    lengthOfHistogramBins: number;
    binValues: { index: number, value: number }[];
    mean: number;
    stdDev: number;
}
interface AssertItem {
    register: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: IRegionHistogramDataExt;
    precisionDigits: number;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    fileOpen: {
        directory: testSubdirectory,
        file: "supermosaic.10.hdf5",
        fileId: 0,
        hdu: "0",
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
                binWidth: 0.7235205573004645,
                firstBinCenter: -1773.2998608150997,
            },
        ],
        lengthOfHistogramBins: 2775,
        binValues: [{ index: 2500, value: 9359604 },],
        mean: 18.742310241547514,//18.742310241547514 for socketdev; 18.743059611332498 for socketicd
        stdDev: 22.534722680160574,//22.534722680160574 for socketdev; 22.376087536494833 for socketicd
    },
    precisionDigits: 4,
};

describe("PER_CUBE_HISTOGRAM tests: Testing calculations of the per-cube histogram", () => {
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

    describe(`Go to "${assertItem.fileOpen.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        }, connectTimeout);

        describe(`(Step 0) Initialization: the open image`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                await Connection.send(CARTA.CloseFile, { fileId: 0 });
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                await Connection.receiveAny()
                await Connection.receiveAny() // OpenFileAck | RegionHistogramData
            }, openFileTimeout);

            let ack: AckStream;
            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                // await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);

                ack = await Connection.stream(assertItem.addTilesReq.tiles.length + 3) as AckStream;
                console.log(ack); // RasterTileData * 1 + SpatialProfileData * 1 + RasterTileSync *2 (start & end)
                expect(ack.RasterTileData.length).toBe(assertItem.addTilesReq.tiles.length);
            }, readFileTimeout);

            let ReceiveProgress: number;
            let RegionHistogramDataTemp: CARTA.RegionHistogramData;
            describe(`Set histogram requirements:`, () => {
                test(`(Step1) "${assertItem.fileOpen.file}" REGION_HISTOGRAM_DATA should arrive completely within 400 ms:`, async () => {
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                    RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                    ReceiveProgress = RegionHistogramDataTemp.progress;
                }, 400);

                test(`(Step2) REGION_HISTOGRAM_DATA.progress == 1`, () => {
                    expect(ReceiveProgress).toBe(1);
                });

                test(`(Step3) REGION_HISTOGRAM_DATA.histograms.bin_width = ${assertItem.regionHistogramData.histograms[0].binWidth}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms[0].binWidth, assertItem.precisionDigits);
                });

                test(`(Step4) len(REGION_HISTOGRAM_DATA.histograms.bins) = ${assertItem.regionHistogramData.lengthOfHistogramBins}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                });

                test(`(Step5) REGION_HISTOGRAM_DATA.histograms.bins[2500] = 9359604`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].bins[2500]).toEqual(assertItem.regionHistogramData.binValues[0].value);
                });

                test(`(Step6) REGION_HISTOGRAM_DATA.histograms.firt_bin_center = ${assertItem.regionHistogramData.histograms[0].firstBinCenter}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                });

                test(`(Step7) REGION_HISTOGRAM_DATA.histograms.num_bins = ${assertItem.regionHistogramData.histograms[0].numBins}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(assertItem.regionHistogramData.histograms[0].numBins);
                });

                test(`(Step8) REGION_HISTOGRAM_DATA.histograms.mean = ${assertItem.regionHistogramData.mean}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].mean).toBeCloseTo(assertItem.regionHistogramData.mean, assertItem.precisionDigits)
                });

                test(`(Step9) REGION_HISTOGRAM_DATA.histograms.stdDev = ${assertItem.regionHistogramData.stdDev}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].stdDev).toBeCloseTo(assertItem.regionHistogramData.stdDev, assertItem.precisionDigits)
                });

                test(`(Step10) REGION_HISTOGRAM_DATA.histograms.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
                    expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);
                });
            });

        });
    });
    afterAll(() => Connection.close());
});
