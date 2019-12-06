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
        apiKey: "",
        clientFeatureFlags: 5,
    },
    fileOpenGroup: [
        {
            directory: testSubdirectory,
            file: "supermosaic.10.fits",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
        },
        {
            directory: testSubdirectory,
            file: "supermosaic.10.hdf5",
            fileId: 0,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
            tileSize: 256,
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
}

describe("PER_CUBE_HISTOGRAM tests: Testing calculations of the per-cube histogram", () => {
    assertItem.fileOpenGroup.map((fileOpen, index) => {
        describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.fileOpenGroup[index].file}" to set image view`, () => {
            let Connection: Client;
            beforeAll(async () => {
                Connection = new Client(testServerUrl);
                await Connection.open();
                await Connection.send(CARTA.RegisterViewer, assertItem.register);
                await Connection.receive(CARTA.RegisterViewerAck);
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
                await Connection.send(CARTA.OpenFile, fileOpen);
                await Connection.receiveAny();
                await Connection.receiveAny(); // OpenFileAck | RegionHistogramData
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannels);
                await Connection.receive(CARTA.RasterTileData);
            }, connectTimeout);
            let regionHistogramProgress: number;
            let RegionHistogramDataTemp: CARTA.RegionHistogramData;
            if (/(?:\.([^.]+))?$/.exec(fileOpen.file)[1] === "hdf5") {
                test(`SET HISTOGRAM REQUIREMENTS then the first REGION_HISTOGRAM_DATA arrives within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                    RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                    regionHistogramProgress = RegionHistogramDataTemp.progress;
                }, readFileTimeout);

                test("REGION_HISTOGRAM_DATA.progress = 1.0", () => {
                    expect(regionHistogramProgress).toEqual(1.0);
                });

                test(`REGION_HISTOGRAM_DATA.histograms.bin_width = ${assertItem.regionHistogramData.histograms[0].binWidth}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms[0].binWidth, assertItem.precisionDigits);
                });

                test(`len(REGION_HISTOGRAM_DATA.histograms.bins) = ${assertItem.regionHistogramData.lengthOfHistogramBins}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                });

                assertItem.regionHistogramData.binValues.map(binValue => {
                    test(`REGION_HISTOGRAM_DATA.histograms.bins[${binValue.index}] = ${binValue.value}`, () => {
                        expect(RegionHistogramDataTemp.histograms[0].bins[binValue.index]).toEqual(binValue.value);
                    });
                });

                test(`REGION_HISTOGRAM_DATA.histograms.firt_bin_center = ${assertItem.regionHistogramData.histograms[0].firstBinCenter}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                });

                test(`REGION_HISTOGRAM_DATA.histograms.num_bins = ${assertItem.regionHistogramData.histograms[0].numBins}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(assertItem.regionHistogramData.histograms[0].numBins);
                });

                test(`REGION_HISTOGRAM_DATA.histograms.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
                    expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);
                });
            }
            else {
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
                    expect(RegionHistogramDataTemp.progress).toBeGreaterThan(regionHistogramProgress);
                    expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);
                    regionHistogramProgress = RegionHistogramDataTemp.progress;
                    console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                }, readFileTimeout);

                test("Assert REGION_HISTOGRAM_DATA as the progress be just greater than 0.5", async () => {
                    expect(regionHistogramProgress).toBeLessThan(1.0);
                    while (regionHistogramProgress < 0.5) {
                        RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                        regionHistogramProgress = RegionHistogramDataTemp.progress;
                        console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                    }
                    if (regionHistogramProgress < 1.0) {
                        RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData);
                        regionHistogramProgress = RegionHistogramDataTemp.progress;
                        console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                        expect(RegionHistogramDataTemp.histograms[0].binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms[0].binWidth, assertItem.precisionDigits);
                        expect(RegionHistogramDataTemp.histograms[0].bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                        expect(RegionHistogramDataTemp.histograms[0].channel).toEqual(assertItem.regionHistogramData.histograms[0].channel);
                        expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                        expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(assertItem.regionHistogramData.histograms[0].numBins);
                        expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);
                    }
                }, cubeHistogramTimeout);

                test("Assert REGION_HISTOGRAM_DATA as the progress be 1.0", async () => {
                    expect(regionHistogramProgress).not.toEqual(1.0);
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
            }
            afterAll(() => Connection[index].close());
        });
    });
});