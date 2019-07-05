import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let cubeHistogramTimeout = config.timeout.cubeHistogram;
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
let imageAssertItems: AssertItem[] = [
    {
        fileId: 0,
        fileName: "supermosaic.10.hdf5",
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
    },
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
        }
    },
]
describe("PER_CUBE_HISTOGRAM tests: Testing calculations of the per-cube histogram", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: ""
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();
                    }
                );
            });
            await done();
        }
    }, connectTimeout);

    imageAssertItems.map( (imageAssertItem: AssertItem) => {

        describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.fileName}" to set image view`, () => {

            beforeAll( async () => {
                await Utility.setEvent(Connection, CARTA.CloseFile, 
                    {
                        fileId: -1,
                    }
                );
                await Utility.setEvent(Connection, CARTA.OpenFile, 
                    {
                        directory: testSubdirectory, 
                        file: imageAssertItem.fileName,
                        fileId: imageAssertItem.fileId,
                        hdu: imageAssertItem.hdu,
                        renderMode: CARTA.RenderMode.RASTER,
                    }
                ); 
                await new Promise( resolve => {           
                    Utility.getEvent(Connection, CARTA.OpenFileAck, 
                        (OpenFileAck: CARTA.OpenFileAck) => {
                            resolve();
                        }
                    );
                });
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
            if (/(?:\.([^.]+))?$/.exec(imageAssertItem.fileName)[1] === "hdf5") {
                test(`SET HISTOGRAM REQUIREMENTS then the first REGION_HISTOGRAM_DATA arrives within ${readFileTimeout} ms`, async () => {
                    await Utility.setEvent(Connection, CARTA.SetHistogramRequirements, imageAssertItem.histogram);
                    await new Promise( resolve => { 
                        Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                            (RegionHistogramData: CARTA.RegionHistogramData) => {
                                regionHistogramProgress = RegionHistogramData.progress;
                                RegionHistogramDataTemp = RegionHistogramData;
                                resolve();
                            }
                        );
                    });
                }, readFileTimeout);

                test("REGION_HISTOGRAM_DATA.progress = 1.0", () => {
                    expect(regionHistogramProgress).toEqual(1.0);
                });

                test(`REGION_HISTOGRAM_DATA.histograms.bin_width = ${imageAssertItem.assertHistogram.binWidth}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].binWidth).toBeCloseTo(imageAssertItem.assertHistogram.binWidth, 4);  
                });

                test(`len(REGION_HISTOGRAM_DATA.histograms.bins) = ${imageAssertItem.assertHistogram.lengthOfHistogramBins}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].bins.length).toEqual(imageAssertItem.assertHistogram.lengthOfHistogramBins);  
                });

                imageAssertItem.assertHistogram.binValues.map( binValue => {
                    test(`REGION_HISTOGRAM_DATA.histograms.bins[${binValue.index}] = ${binValue.value}`, () => {
                        expect(RegionHistogramDataTemp.histograms[0].bins[binValue.index]).toEqual(binValue.value);  
                    });
                });

                test(`REGION_HISTOGRAM_DATA.histograms.channel = ${imageAssertItem.assertHistogram.channel}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].channel).toEqual(imageAssertItem.assertHistogram.channel);
                });

                test(`REGION_HISTOGRAM_DATA.histograms.firt_bin_center = ${imageAssertItem.assertHistogram.firstBinCenter}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(imageAssertItem.assertHistogram.firstBinCenter, 4);
                });

                test(`REGION_HISTOGRAM_DATA.histograms.num_bins = ${imageAssertItem.assertHistogram.numberBins}`, () => {
                    expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(imageAssertItem.assertHistogram.numberBins);
                });

                test(`REGION_HISTOGRAM_DATA.histograms.region_id = ${imageAssertItem.assertHistogram.regionId}`, () => {
                    expect(RegionHistogramDataTemp.regionId).toEqual(imageAssertItem.assertHistogram.regionId);
                });
            }
            else {
                test(`SET HISTOGRAM REQUIREMENTS then the first REGION_HISTOGRAM_DATA arrives within ${readFileTimeout} ms`, async () => {
                    await Utility.setEvent(Connection, CARTA.SetHistogramRequirements, imageAssertItem.histogram);
                    await new Promise( resolve => { 
                        Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                            (RegionHistogramData: CARTA.RegionHistogramData) => {
                                regionHistogramProgress = RegionHistogramData.progress;
                                RegionHistogramDataTemp = RegionHistogramData;
                                console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                                resolve();
                            }
                        );
                    });
                }, readFileTimeout);

                test(`REGION_HISTOGRAM_DATA.progress > 0 and REGION_HISTOGRAM_DATA.region_id = ${imageAssertItem.assertHistogram.regionId}`, () => {
                    expect(regionHistogramProgress).toBeGreaterThan(0);
                    expect(RegionHistogramDataTemp.regionId).toEqual(imageAssertItem.assertHistogram.regionId);  
                });

                test(`The second REGION_HISTOGRAM_DATA should arrive and REGION_HISTOGRAM_DATA.progress > previous one `, async () => {
                    await new Promise( resolve => {                        
                        Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                            RegionHistogramData => {
                                expect(RegionHistogramData.progress).toBeGreaterThan(regionHistogramProgress);
                                expect(RegionHistogramDataTemp.regionId).toEqual(imageAssertItem.assertHistogram.regionId);
                                regionHistogramProgress = RegionHistogramData.progress;
                                console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                                resolve();
                            }
                        );
                    });
                }, readFileTimeout);

                test("Assert the REGION_HISTOGRAM_DATA as the progress be just greater than 0.5", async () => {
                    expect(regionHistogramProgress).toBeLessThan(1.0);
                    while (regionHistogramProgress < 0.5) {
                        await new Promise( resolve => {                        
                            Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                                (RegionHistogramData: CARTA.RegionHistogramData) => {
                                    regionHistogramProgress = RegionHistogramData.progress;
                                    console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                                    resolve();
                                }
                            );
                        });
                    }
                    if (regionHistogramProgress < 1.0) {
                        await new Promise( resolve => {                        
                            Utility.getEvent(Connection, CARTA.RegionHistogramData, 
                                (RegionHistogramData: CARTA.RegionHistogramData) => {
                                    regionHistogramProgress = RegionHistogramData.progress;
                                    console.log(`Region Histogram Progress = ${regionHistogramProgress}`);
                                    expect(RegionHistogramData.histograms[0].binWidth).toBeCloseTo(imageAssertItem.assertHistogram.binWidth, 4);
                                    expect(RegionHistogramData.histograms[0].bins.length).toEqual(imageAssertItem.assertHistogram.lengthOfHistogramBins);
                                    expect(RegionHistogramData.histograms[0].channel).toEqual(imageAssertItem.assertHistogram.channel);
                                    expect(RegionHistogramData.histograms[0].firstBinCenter).toBeCloseTo(imageAssertItem.assertHistogram.firstBinCenter, 4);
                                    expect(RegionHistogramData.histograms[0].numBins).toEqual(imageAssertItem.assertHistogram.numberBins); 
                                    expect(RegionHistogramData.regionId).toEqual(imageAssertItem.assertHistogram.regionId);
                                    resolve();
                                }
                            );
                        });
                    }
                }, cubeHistogramTimeout);

                test("Assert the REGION_HISTOGRAM_DATA as the progress be 1.0", async () => {
                    expect(regionHistogramProgress).not.toEqual(1.0);
                    while (regionHistogramProgress < 1.0) {
                        await new Promise( resolve => {                        
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
                        });
                    }
                }, cubeHistogramTimeout);
            }
            
        });

    });

    afterAll( () => {
        Connection.close();
    });
});