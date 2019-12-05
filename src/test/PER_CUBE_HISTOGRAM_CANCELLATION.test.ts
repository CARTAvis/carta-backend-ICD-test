import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let cubeHistogramTimeout = config.timeout.cubeHistogram;
let messageReturnTimeout = config.timeout.readFile;
let cancelTimeout = config.timeout.cancel;
interface IRegionHistogramDataExt extends CARTA.IRegionHistogramData {
    lengthOfHistogramBins: number;
    binValues: { index: number, value: number }[];
}
interface AssertItem {
    register: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile;
    setImageChannels: CARTA.ISetImageChannels;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    cancelHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: IRegionHistogramDataExt;
    precisionDigits: number;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    fileOpen: {
        directory: testSubdirectory,
        file: "supermosaic.10.fits",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
        tileSize: 256,
    },
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
    cancelHistogramRequirements: {
        fileId: 0,
        regionId: -2,
        histograms: [],
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
}

describe("PER_CUBE_HISTOGRAM_CANCELLATION tests: Testing the cancellation capability of the calculations of the per-cube histogram", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.fileOpen.file}" to set image view`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
            await Connection.receiveAny();
            await Connection.receiveAny(); // OpenFileAck | RegionHistogramData
            await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannels);
            await Connection.receive(CARTA.RasterTileData);
        });

        let regionHistogramProgress: number;
        let RegionHistogramDataTemp: CARTA.RegionHistogramData;
        test(`SET HISTOGRAM REQUIREMENTS then the first REGION_HISTOGRAM_DATA arrives within ${readFileTimeout} ms`, async () => {
            await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
            RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
            regionHistogramProgress = RegionHistogramDataTemp.progress;
            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
        }, readFileTimeout);

        test(`REGION_HISTOGRAM_DATA.progress > 0 and REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
            expect(regionHistogramProgress).toBeGreaterThan(0);
            expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);
        });

        test(`The second REGION_HISTOGRAM_DATA should arrive and REGION_HISTOGRAM_DATA.progress > previous one `, async () => {
            RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
            regionHistogramProgress = RegionHistogramDataTemp.progress;
            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
        }, readFileTimeout);

        test("Assert no more REGION_HISTOGRAM_DATA returns", async () => {
            /// After 10 seconds, the request of the per-cube histogram is cancelled.
            await new Promise(end => setTimeout(() => end(), cancelTimeout));
            await Connection.send(CARTA.SetHistogramRequirements, assertItem.cancelHistogramRequirements);
            await Connection.receive(CARTA.RegionHistogramData, messageReturnTimeout, false);
        }, readFileTimeout + messageReturnTimeout + cancelTimeout);

        test("Assert a renew REGION_HISTOGRAM_DATA as the progress = 1.0", async () => {
            /// Then request to get the per-cube histogram again in 2 seconds.
            await new Promise(end => setTimeout(() => end(), 2000));
            await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
            while (regionHistogramProgress < 1.0) {
                RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData, messageReturnTimeout, true);
                regionHistogramProgress = RegionHistogramDataTemp.progress;
                console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                if (regionHistogramProgress === 1.0) {
                    expect(RegionHistogramDataTemp.histograms[0].binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms[0].binWidth, assertItem.precisionDigits);
                    expect(RegionHistogramDataTemp.histograms[0].bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                    expect(RegionHistogramDataTemp.histograms[0].channel).toEqual(assertItem.regionHistogramData.histograms[0].channel);
                    expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                    expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(assertItem.regionHistogramData.histograms[0].numBins);
                    expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);
                }
            }
        }, cubeHistogramTimeout);

    });

    afterAll(() => Connection.close());
});