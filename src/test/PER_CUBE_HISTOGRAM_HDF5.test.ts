import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
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
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
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
        channel: -2,
        histograms: 
        {
            numBins: 2775,
            binWidth: 0.7235205573004645,
            firstBinCenter: -1773.2998046875,
        },
        lengthOfHistogramBins: 2775,
        binValues: [{ index: 2500, value: 9359604 },],
        mean: 18.742310241547514,//18.742310241547514 for socketdev; 18.743059611332498 for socketicd
        stdDev: 22.534722680160574,//22.534722680160574 for socketdev; 22.376087536494833 for socketicd
    },
    precisionDigits: 4,
};

describe("PER_CUBE_HISTOGRAM_HDF5: Testing calculations of the per-cube histogram of hdf5", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    test(`Open file: ${assertItem.openFile.file}`, async () => {
        await Connection.openFile(assertItem.openFile);
    }, openFileTimeout);

    test(`Assert total length of RASTER_TILE_DATA(Stream)`, async () => {
        await Connection.send(CARTA.SetCursor, assertItem.setCursor);
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
        let ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        expect(ack.RasterTileData.length).toBe(assertItem.addTilesReq.tiles.length);
    }, readFileTimeout);

    describe(`Request histogram requirements:`, () => {
        let ReceiveProgress: number;
        let RegionHistogramData: CARTA.RegionHistogramData;
        test(`REGION_HISTOGRAM_DATA should arrive completely within ${cubeHistogramTimeout} ms:`, async () => {
            await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
            let ack = await Connection.streamUntil((type, data) => type == CARTA.RegionHistogramData && data.progress == 1.0);
            RegionHistogramData = ack.RegionHistogramData.slice(-1)[0];
            ReceiveProgress = RegionHistogramData.progress;
        }, cubeHistogramTimeout);

        test(`Assert REGION_HISTOGRAM_DATA.progress == 1`, () => {
            expect(ReceiveProgress).toBe(1);
        });

        test(`Assert REGION_HISTOGRAM_DATA.histograms.bin_width = ${assertItem.regionHistogramData.histograms.binWidth}`, () => {
            expect(RegionHistogramData.histograms.binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms.binWidth, assertItem.precisionDigits);
        });

        test(`Assert len(REGION_HISTOGRAM_DATA.histograms.bins) = ${assertItem.regionHistogramData.lengthOfHistogramBins}`, () => {
            expect(RegionHistogramData.histograms.bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
        });

        test(`Assert REGION_HISTOGRAM_DATA.histograms.bins[2500] = 9359604`, () => {
            expect(RegionHistogramData.histograms.bins[2500]).toEqual(assertItem.regionHistogramData.binValues[0].value);
        });

        test(`Assert REGION_HISTOGRAM_DATA.histograms.firt_bin_center = ${assertItem.regionHistogramData.histograms.firstBinCenter}`, () => {
            expect(RegionHistogramData.histograms.firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms.firstBinCenter, assertItem.precisionDigits);
        });

        test(`Assert REGION_HISTOGRAM_DATA.histograms.num_bins = ${assertItem.regionHistogramData.histograms.numBins}`, () => {
            expect(RegionHistogramData.histograms.numBins).toEqual(assertItem.regionHistogramData.histograms.numBins);
        });

        test(`Assert REGION_HISTOGRAM_DATA.histograms.mean = ${assertItem.regionHistogramData.mean}`, () => {
            expect(RegionHistogramData.histograms.mean).toBeCloseTo(assertItem.regionHistogramData.mean, assertItem.precisionDigits)
        });

        test(`Assert REGION_HISTOGRAM_DATA.histograms.stdDev = ${assertItem.regionHistogramData.stdDev}`, () => {
            expect(RegionHistogramData.histograms.stdDev).toBeCloseTo(assertItem.regionHistogramData.stdDev, assertItem.precisionDigits)
        });

        test(`Assert REGION_HISTOGRAM_DATA.histograms.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
            expect(RegionHistogramData.regionId).toEqual(assertItem.regionHistogramData.regionId);
        });
    });
    afterAll(() => Connection.close());
});
