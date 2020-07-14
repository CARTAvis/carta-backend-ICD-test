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
        file: "supermosaic.10.fits",
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
                binWidth: 0.7235205769538879,
                firstBinCenter: -1773.2998046875,
            },
        ],
        lengthOfHistogramBins: 2775,
        binValues: [{ index: 2500, value: 9359604 },],
        mean: 18.742310255027036,
        stdDev: 22.534721826342878,
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
                test(`(Step1) "${assertItem.fileOpen.file}" REGION_HISTOGRAM_DATA should arrive completely within 3000 ms:`, async () => {
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                    RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                    ReceiveProgress = RegionHistogramDataTemp.progress;
                }, 3000);

                test(`(Step2) REGION_HISTOGRAM_DATA.progress > 0 and REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
                    expect(ReceiveProgress).toBeGreaterThan(0);
                    expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);
                });

                test("(Step3 & Step4) Assert and check REGION_HISTOGRAM_DATA as the progress be just greater than 0.5", async () => {
                    if (ReceiveProgress != 1) {
                        while (ReceiveProgress <= 0.5) {
                            RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                            ReceiveProgress = RegionHistogramDataTemp.progress
                            console.warn('' + assertItem.fileOpen.file + ' Region Histogram progress :', ReceiveProgress)
                        };
                        expect(ReceiveProgress).toBeGreaterThanOrEqual(0.5);
                        expect(RegionHistogramDataTemp.histograms[0].binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms[0].binWidth, assertItem.precisionDigits);
                        expect(RegionHistogramDataTemp.histograms[0].bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                        expect(RegionHistogramDataTemp.histograms[0].channel).toEqual(assertItem.regionHistogramData.histograms[0].channel);
                        expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                        expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(assertItem.regionHistogramData.histograms[0].numBins);
                        expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);
                    };
                }, cubeHistogramTimeout);

                test("(Step5) Assert and check REGION_HISTOGRAM_DATA as the progress be just greater than 1", async () => {
                    if (ReceiveProgress != 1) {
                        while (ReceiveProgress < 1) {
                            RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                            ReceiveProgress = RegionHistogramDataTemp.progress
                            console.warn('' + assertItem.fileOpen.file + ' Region Histogram progress :', ReceiveProgress)
                            // if (ReceiveProgress == 1.0) {
                            //     console.warn(RegionHistogramDataTemp)
                            // };
                        };
                        expect(ReceiveProgress).toEqual(1);
                        expect(RegionHistogramDataTemp.histograms[0].binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms[0].binWidth, assertItem.precisionDigits);
                        expect(RegionHistogramDataTemp.histograms[0].bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                        expect(RegionHistogramDataTemp.histograms[0].bins[2500]).toEqual(assertItem.regionHistogramData.binValues[0].value);
                        expect(RegionHistogramDataTemp.histograms[0].channel).toEqual(assertItem.regionHistogramData.histograms[0].channel);
                        expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                        expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(assertItem.regionHistogramData.histograms[0].numBins);
                        expect(RegionHistogramDataTemp.histograms[0].mean).toBeCloseTo(assertItem.regionHistogramData.mean, assertItem.precisionDigits)
                        expect(RegionHistogramDataTemp.histograms[0].stdDev).toBeCloseTo(assertItem.regionHistogramData.stdDev, assertItem.precisionDigits)
                        expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);
                    };
                }, cubeHistogramTimeout);


            });

        });
    });

});
