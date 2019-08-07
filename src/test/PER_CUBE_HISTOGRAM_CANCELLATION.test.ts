import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
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
    binValues: {index: number, value: number}[];
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
            {channel: -2, numBins: -1},
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
        binValues: [{index: 2500, value: 9359604},],
    },
    precisionDigits: 4,
}

describe("PER_CUBE_HISTOGRAM_CANCELLATION tests: Testing the cancellation capability of the calculations of the per-cube histogram", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.fileOpen.file}" to set image view`, () => {

        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, assertItem.fileOpen);
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannels);
            await Utility.getEventAsync(Connection, CARTA.RasterTileData);
        });
                
        let regionHistogramProgress: number;
        let RegionHistogramDataTemp: CARTA.RegionHistogramData;
        test(`SET HISTOGRAM REQUIREMENTS then the first REGION_HISTOGRAM_DATA arrives within ${readFileTimeout} ms`, async () => {
            await Utility.setEvent(Connection, CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
            RegionHistogramDataTemp = <CARTA.RegionHistogramData> await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            regionHistogramProgress = RegionHistogramDataTemp.progress;
            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
        }, readFileTimeout);

        test(`REGION_HISTOGRAM_DATA.progress > 0 and REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
            expect(regionHistogramProgress).toBeGreaterThan(0);
            expect(RegionHistogramDataTemp.regionId).toEqual(assertItem.regionHistogramData.regionId);  
        });

        test(`The second REGION_HISTOGRAM_DATA should arrive and REGION_HISTOGRAM_DATA.progress > previous one `, async () => {
            RegionHistogramDataTemp = <CARTA.RegionHistogramData> await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            regionHistogramProgress = RegionHistogramDataTemp.progress;
            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
        }, readFileTimeout);

        test("Assert no more REGION_HISTOGRAM_DATA returns", async () => {
            /// After 10 seconds, the request of the per-cube histogram is cancelled.
            await new Promise( end => setTimeout(() => end(), cancelTimeout));
            await Utility.setEventAsync(Connection, CARTA.SetHistogramRequirements, assertItem.cancelHistogramRequirements);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData, messageReturnTimeout);
        }, readFileTimeout + messageReturnTimeout + cancelTimeout);

        test("Assert a renew REGION_HISTOGRAM_DATA as the progress = 1.0", async () => {
            /// Then request to get the per-cube histogram again in 2 seconds.
            await new Promise( end => setTimeout(() => end(), 2000));
            await Utility.setEventAsync(Connection, CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
            while (regionHistogramProgress < 1.0) {
                await new Promise( (resolve, reject) => {                        
                    Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                        (RegionHistogramData: CARTA.RegionHistogramData) => {
                            regionHistogramProgress = RegionHistogramData.progress;
                            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                            if (regionHistogramProgress === 1.0) {
                                expect(RegionHistogramData.histograms[0].binWidth).toBeCloseTo(assertItem.regionHistogramData.histograms[0].binWidth, assertItem.precisionDigits);
                                expect(RegionHistogramData.histograms[0].bins.length).toEqual(assertItem.regionHistogramData.lengthOfHistogramBins);
                                expect(RegionHistogramData.histograms[0].channel).toEqual(assertItem.regionHistogramData.histograms[0].channel);
                                expect(RegionHistogramData.histograms[0].firstBinCenter).toBeCloseTo(assertItem.regionHistogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                                expect(RegionHistogramData.histograms[0].numBins).toEqual(assertItem.regionHistogramData.histograms[0].numBins); 
                                expect(RegionHistogramData.regionId).toEqual(assertItem.regionHistogramData.regionId);
                            }
                            resolve();
                        }
                    );
                    let failTimer = setTimeout(() => {
                        clearTimeout(failTimer);
                        reject();
                    }, messageReturnTimeout);
                });
            }
        }, cubeHistogramTimeout);
        
    });
    
    afterAll(() => Connection.close());
});