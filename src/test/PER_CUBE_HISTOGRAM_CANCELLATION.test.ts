import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let cubeHistogramTimeout = config.timeout.cubeHistogram;
let messageReturnTimeout = config.timeout.readFile;
let cancelTimeout = config.timeout.cancel;

interface IRegionHistogramDataExt extends CARTA.IRegionHistogramData {
    lengthOfHistogramBins: number;
    binValues: { index: number, value: number }[];
    mean: number;
    stdDev: number;
}
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    cancelHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: IRegionHistogramDataExt;
    precisionDigits: number;
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
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
    cancelHistogramRequirements: {
        fileId: 0,
        regionId: -2,
        histograms: [],
    },
    regionHistogramData: {
        regionId: -2,
        channel: -2,
        histograms: 
        {
            numBins: 2775,
            binWidth: 0.7235205769538879,
            firstBinCenter: -1773.2998046875,
        },
        lengthOfHistogramBins: 2775,
        binValues: [{ index: 2500, value: 9359604 },],
        mean: 18.742310255027036,
        stdDev: 22.534721826342878,
    },
    precisionDigits: 4,
};

describe("PER_CUBE_HISTOGRAM_CANCELLATION: Testing calculations of the per-cube histogram with cancellation", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Go to "${assertItem.openFile.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        }, connectTimeout);

        describe(`(Step 0) Initialization: the open image`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                await Connection.openFile(assertItem.openFile);
            }, openFileTimeout);

            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                let ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                expect(ack.RasterTileData.length).toBe(assertItem.addTilesReq.tiles.length);
            }, readFileTimeout);

            let ReceiveProgress: number;
            let RegionHistogramData: CARTA.RegionHistogramData;
            describe(`Set histogram requirements:`, () => {
                test(`(Step1) "${assertItem.openFile.file}" REGION_HISTOGRAM_DATA should arrive completely within 6000 ms:`, async () => {
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                    RegionHistogramData = await Connection.receive(CARTA.RegionHistogramData);
                    ReceiveProgress = RegionHistogramData.progress;
                }, 6000);

                test(`(Step2) REGION_HISTOGRAM_DATA.progress > 0 and REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
                    expect(ReceiveProgress).toBeGreaterThan(0);
                    expect(RegionHistogramData.regionId).toEqual(assertItem.regionHistogramData.regionId);
                    console.log('Step2 progress:', ReceiveProgress)
                });

                test(`(Step3) The second REGION_HISTOGRAM_DATA should arrive and REGION_HISTOGRAM_DATA.progress > previous one `, async () => {
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                    RegionHistogramData = await Connection.receive(CARTA.RegionHistogramData);
                    ReceiveProgress = RegionHistogramData.progress;
                    console.log('' + assertItem.openFile.file + ' Region Histogram progress :', ReceiveProgress);
                }, readFileTimeout);

                test("(Step4) Assert no more REGION_HISTOGRAM_DATA returns", async () => {
                    /// After 5 seconds, the request of the per-cube histogram is cancelled.
                    await new Promise<void>(end => setTimeout(() => end(), cancelTimeout));
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.cancelHistogramRequirements);
                    // Receive messages until get two ErrorData
                    await Connection.streamUntil((type, data, ack) => type == CARTA.ErrorData && ack.ErrorData.length == 2);
                    await Connection.receive(CARTA.RegionHistogramData, messageReturnTimeout, false);
                }, readFileTimeout + messageReturnTimeout + cancelTimeout);

                test("(Step5) Assert a renew REGION_HISTOGRAM_DATA as the progress = 1.0", async () => {
                    /// Then request to get the per-cube histogram again in 2 seconds.
                    await new Promise<void>(end => setTimeout(() => end(), 2000));
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                    let ack = await Connection.streamUntil((type, data) => type == CARTA.RegionHistogramData && data.progress == 1);
                    RegionHistogramData = ack.RegionHistogramData.slice(-1)[0];
                    ReceiveProgress = RegionHistogramData.progress;
                    expect(ReceiveProgress).toEqual(1);
                    expect(RegionHistogramData.histograms.binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms.binWidth, assertItem.precisionDigits);
                    expect(RegionHistogramData.histograms.bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                    expect(RegionHistogramData.histograms.bins[2500]).toEqual(assertItem.regionHistogramData.binValues[0].value);
                    expect(RegionHistogramData.channel).toEqual(assertItem.regionHistogramData.channel);
                    expect(RegionHistogramData.histograms.firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms.firstBinCenter, assertItem.precisionDigits);
                    expect(RegionHistogramData.histograms.numBins).toEqual(assertItem.regionHistogramData.histograms.numBins);
                    expect(RegionHistogramData.histograms.mean).toBeCloseTo(assertItem.regionHistogramData.mean, assertItem.precisionDigits)
                    expect(RegionHistogramData.histograms.stdDev).toBeCloseTo(assertItem.regionHistogramData.stdDev, assertItem.precisionDigits)
                    expect(RegionHistogramData.regionId).toEqual(assertItem.regionHistogramData.regionId);
                }, cubeHistogramTimeout);
            });
        });
    });
    afterAll(() => Connection.close());
});
