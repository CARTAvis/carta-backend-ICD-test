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
interface AssertItem {
    fileId: number;
    fileName: string;
    hdu: string;
    imageDataInfo: {
        compressionQuality: number,
        imageBounds: {xMin: number, xMax: number, yMin: number, yMax: number},
        compressionType: CARTA.CompressionType,
        mip: number,
        numSubsets: number,
    };
    histogram: {
        fileId: number,
        regionId: number,
        histograms: {channel: number, numBins: number}[],
    };
    assertHistogram: {
        regionId: number,
        binWidth: number,
        lengthOfHistogramBins: number,
        channel: number,
        firstBinCenter: number,
        numberBins: number,
        binValues?: {index: number, value: number}[],
    };
}
let imageAssertItem: AssertItem = 
{
    fileId: 0,
    fileName: "supermosaic.10.fits",
    hdu: "",
    imageDataInfo: {
        compressionQuality: 11,
        imageBounds: {xMin: 0, xMax: 4224, yMin: 0, yMax: 1824},
        compressionType: CARTA.CompressionType.ZFP,
        mip: 7,
        numSubsets: 4,
    },
    histogram: {
        fileId: 0,
        regionId: -2,
        histograms: [{channel: -2, numBins: -1}],
    },
    assertHistogram: {
        regionId: -2,
        binWidth: 0.7235205769538879,
        lengthOfHistogramBins: 2775,
        channel: -2,
        firstBinCenter: -1773.2998046875,
        numberBins: 2775,
        binValues: [{index: 2500, value: 9359604},],
    }
}

describe("PER_CUBE_HISTOGRAM_CANCELLATION tests: Testing the cancellation capability of the calculations of the per-cube histogram", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: ""
                }
            );
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.fileName}" to set image view`, () => {

        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, 
                {
                    directory: testSubdirectory, 
                    file: imageAssertItem.fileName,
                    fileId: imageAssertItem.fileId,
                    hdu: imageAssertItem.hdu,
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            await Utility.setEventAsync(Connection, CARTA.SetImageChannels, 
                {
                    fileId: imageAssertItem.fileId,
                    channel: 0,
                    requiredTiles: {
                        fileId: imageAssertItem.fileId,
                        tiles: [0],
                        compressionType: imageAssertItem.imageDataInfo.compressionType,
                    },
                },
            );
            await Utility.getEventAsync(Connection, CARTA.RasterTileData);
        });
                
        let regionHistogramProgress: number;
        let RegionHistogramDataTemp: CARTA.RegionHistogramData;
        test(`SET HISTOGRAM REQUIREMENTS then the first REGION_HISTOGRAM_DATA arrives within ${readFileTimeout} ms`, async () => {
            await Utility.setEvent(Connection, CARTA.SetHistogramRequirements, imageAssertItem.histogram);
            RegionHistogramDataTemp = <CARTA.RegionHistogramData>await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            regionHistogramProgress = RegionHistogramDataTemp.progress;
            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
        }, readFileTimeout);

        test(`REGION_HISTOGRAM_DATA.progress > 0 and REGION_HISTOGRAM_DATA.region_id = ${imageAssertItem.assertHistogram.regionId}`, () => {
            expect(regionHistogramProgress).toBeGreaterThan(0);
            expect(RegionHistogramDataTemp.regionId).toEqual(imageAssertItem.assertHistogram.regionId);  
        });

        test(`The second REGION_HISTOGRAM_DATA should arrive and REGION_HISTOGRAM_DATA.progress > previous one `, async () => {
            RegionHistogramDataTemp = <CARTA.RegionHistogramData>await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            regionHistogramProgress = RegionHistogramDataTemp.progress;
            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
        }, readFileTimeout);

        test("Assert no more REGION_HISTOGRAM_DATA returns", async () => {
            /// After 10 seconds, the request of the per-cube histogram is cancelled.
            await new Promise( end => setTimeout(() => end(), cancelTimeout));
            await Utility.setEventAsync(Connection, CARTA.SetHistogramRequirements,  
                {
                    fileId: imageAssertItem.fileId, 
                    regionId: -2, 
                    histograms: [],
                }
            );
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData, messageReturnTimeout);
        }, readFileTimeout + messageReturnTimeout + cancelTimeout);

        test("Assert a renew REGION_HISTOGRAM_DATA as the progress = 1.0", async () => {
            /// Then request to get the per-cube histogram again in 2 seconds.
            await new Promise( end => setTimeout(() => end(), 2000));
            await Utility.setEventAsync(Connection, CARTA.SetHistogramRequirements, imageAssertItem.histogram);
            while (regionHistogramProgress < 1.0) {
                await new Promise( (resolve, reject) => {                        
                    Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                        (RegionHistogramData: CARTA.RegionHistogramData) => {
                            regionHistogramProgress = RegionHistogramData.progress;
                            console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                            if (regionHistogramProgress === 1.0) {
                                expect(RegionHistogramData.histograms[0].binWidth).toBeCloseTo(imageAssertItem.assertHistogram.binWidth, 4);
                                expect(RegionHistogramData.histograms[0].bins.length).toEqual(imageAssertItem.assertHistogram.lengthOfHistogramBins);
                                expect(RegionHistogramData.histograms[0].channel).toEqual(imageAssertItem.assertHistogram.channel);
                                expect(RegionHistogramData.histograms[0].firstBinCenter).toBeCloseTo(imageAssertItem.assertHistogram.firstBinCenter, 4);
                                expect(RegionHistogramData.histograms[0].numBins).toEqual(imageAssertItem.assertHistogram.numberBins); 
                                expect(RegionHistogramData.regionId).toEqual(imageAssertItem.assertHistogram.regionId);
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
    
    afterAll( () => {
        Connection.close();
    });
});