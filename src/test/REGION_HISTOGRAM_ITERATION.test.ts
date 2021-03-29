import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');
let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    cursor?: CARTA.ISetCursor;
    regionGroup: CARTA.ISetRegion[];
    spatial?: CARTA.ISetSpatialRequirements;
    stats?: CARTA.ISetStatsRequirements;
    histogram: CARTA.ISetHistogramRequirements[];
    histogramData: CARTA.IRegionHistogramData[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:{
        directory: testSubdirectory,
        file: "supermosaic.10.fits",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },

    setCursor: {
        fileId: 0,
        point: { x: 1.0, y: 1.0 },
    },
    addTilesRequire:
    {
        tiles: [0],
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
    },
    precisionDigits: 4,
    regionGroup: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 303, y: 607 }, { x: 5, y: 10 }],
                rotation: 0,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 303, y: 607 }, { x: 5, y: 10 }],
                rotation: 25,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 303, y: 607 }, { x: 5, y: 10 }],
                rotation: 50,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 303, y: 607 }, { x: 5, y: 10 }],
                rotation: 75
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 303, y: 607 }, { x: 5, y: 10 }],
                rotation: 100
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 303, y: 607 }, { x: 3, y: 7 }],
                rotation: 0,
            },
        },
        {
            fileId: 0,
            regionId: 2,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 303, y: 607 }, { x: 3, y: 7 }],
                rotation: 25,
            },
        },
        {
            fileId: 0,
            regionId: 2,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 303, y: 607 }, { x: 3, y: 7 }],
                rotation: 50,
            },
        },
        {
            fileId: 0,
            regionId: 2,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 303, y: 607 }, { x: 3, y: 7 }],
                rotation: 75
            },
        },
        {
            fileId: 0,
            regionId: 2,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 303, y: 607 }, { x: 3, y: 7 }],
                rotation: 100
            },
        },
    ],
    histogram: [
        {
            fileId: 0,
            regionId: 1,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 1,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 1,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 1,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 1,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{ channel: -1, numBins: -1 }],
        },
    ],
    histogramData: [
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 7,
                    binWidth: 1.5208303928375244,
                    firstBinCenter: -4.034262657165527,
                    mean: 0.4041082208806818,
                    stdDev: 2.6764579920150386,
                    bins: [3, 12, 7, 13, 8, 7, 5],
                },
            ],
            progress: 1,
        },
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 9,
                    binWidth: 1.3602973222732544,
                    firstBinCenter: -5.711391925811768,
                    mean: -0.12993427351409315,
                    stdDev: 2.871427649275705,
                    bins: [1, 1, 11, 9, 10, 6, 4,  5, 4],
                },
            ],
            progress: 1,
        },
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 9,
                    binWidth: 1.4611884355545044,
                    firstBinCenter: -6.568966388702393,
                    mean: -0.07283528645833333,
                    stdDev: 3.357136753999045,
                    bins: [2, 2, 6, 11, 9, 5, 3, 6,  7],
                },
            ],
            progress: 1,
        },
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 8,
                    binWidth: 1.6125259399414062,
                    firstBinCenter: -6.242809295654297,
                    mean: 0.4907681334252451,
                    stdDev: 3.439834023587806,
                    bins: [2, 3, 9, 9, 3, 8, 8, 9],
                },
            ],
            progress: 1,
        },
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 8,
                    binWidth: 1.7416839599609375,
                    firstBinCenter: -6.428718566894531,
                    mean: 1.2446935317095589,
                    stdDev: 3.603033922567316,
                    bins: [3, 1,8, 5, 5, 10, 9, 10],
                },
            ],
            progress: 1,
        },
        {
            regionId: 2,
            histograms: [
                {
                    numBins: 9,
                    binWidth: 1.4611884355545044,
                    firstBinCenter: -6.568966388702393,
                    mean: 0.6847772598266602,
                    stdDev: 3.803558083723265,
                    bins: [4, 4, 5, 8, 6, 5, 8, 11, 13],
                },
            ],
            progress: 1,
        },
        {
            regionId: 2,
            histograms: [
                {
                    numBins: 15,
                    binWidth: 0.9121989011764526,
                    firstBinCenter: -6.592972755432129,
                    mean: 1.120794040053638,
                    stdDev: 3.263444231613786,
                    bins: [1, 1, 2, 2, 5, 6, 3, 5, 3, 9, 7, 9, 1, 11, 2],
                },
            ],
            progress: 1,
        },
        {
            regionId: 2,
            histograms: [
                {
                    numBins: 15,
                    binWidth: 0.6742350459098816,
                    firstBinCenter: -3.1424968242645264,
                    mean: 1.4638134401236007,
                    stdDev: 2.541942356604781,
                    bins: [3, 4, 5, 2, 4, 6, 5, 7, 6, 8, 6, 1, 6, 3, 1],
                },
            ],
            progress: 1,
        },
        {
            regionId: 2,
            histograms: [
                {
                    numBins: 15,
                    binWidth: 0.6721476316452026,
                    firstBinCenter: -3.112229347229004,
                    mean: 0.8817129826200181,
                    stdDev: 2.629250474696574,
                    bins: [5, 6, 8, 3, 5, 6, 6, 4, 7, 5, 5, 1, 5, 2, 1],
                },
            ],
            progress: 1,
        },
        {
            regionId: 2,
            histograms: [
                {
                    numBins: 15,
                    binWidth: 0.8161783814430237,
                    firstBinCenter: -5.9834513664245605,
                    mean: 0.05106820633162314,
                    stdDev: 2.7907663401523517,
                    bins: [1, 1, 1, 4, 7, 10, 6, 8, 7, 5, 3, 2, 5, 4, 3],
                },
            ],
            progress: 1,
        },
    ],
};

describe("REGION_HISTOGRAM_ITERATION test: Testing histogram with different rotation for rectangle & ellipse regions", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Prepare image data ${assertItem.openFile.file}`,()=>{
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.openFile(assertItem.openFile);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesRequire);
            await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        });


        assertItem.histogramData.map((histogramData, index) => {
            describe(`SET REGION #${histogramData.regionId} with degree = ${assertItem.regionGroup[index].regionInfo.rotation}`, () => {
                let SetRegionAck: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should arrive within ${regionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetRegion, assertItem.regionGroup[index]);
                    SetRegionAck = await Connection.receive(CARTA.SetRegionAck);
                }, regionTimeout);

                test("SET_REGION_ACK.success = true", () => {
                    expect(SetRegionAck.success).toBe(true);
                });

                test(`SET_REGION_ACK.region_id = ${histogramData.regionId}`, () => {
                    expect(SetRegionAck.regionId).toEqual(histogramData.regionId);
                });

                describe(`SET HISTOGRAM REQUIREMENTS on region #${histogramData.regionId} with degree = ${assertItem.regionGroup[index].regionInfo.rotation}`, () => {
                    let RegionHistogramData: CARTA.RegionHistogramData;
                    test(`REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetHistogramRequirements, assertItem.histogram[index]);
                        RegionHistogramData = await Connection.receive(CARTA.RegionHistogramData);
                        // console.log(RegionHistogramData)
                        // console.log(RegionHistogramData.histograms[0].bins)
                    }, regionTimeout);
    
                    test(`REGION_HISTOGRAM_DATA.region_id = ${histogramData.regionId}`, () => {
                        expect(RegionHistogramData.regionId).toEqual(histogramData.regionId);
                    });

                    test(`REGION_HISTOGRAM_DATA.progress = ${histogramData.progress}`, () => {
                        expect(RegionHistogramData.progress).toEqual(histogramData.progress);
                    });

                    test("Assert REGION_HISTOGRAM_DATA.histograms", () => {
                        if (RegionHistogramData.histograms[0].binWidth !== 0) {
                            expect(RegionHistogramData.histograms[0].binWidth).toBeCloseTo(histogramData.histograms[0].binWidth, assertItem.precisionDigits);
                        };
                        if (RegionHistogramData.histograms[0].firstBinCenter !== 0) {
                            expect(RegionHistogramData.histograms[0].firstBinCenter).toBeCloseTo(histogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                        };

                        let filterZero = RegionHistogramData.histograms[0].bins.filter(value => value === 0);
                        if (filterZero.length === RegionHistogramData.histograms[0].bins.length) {
                            expect(RegionHistogramData.histograms[0].bins.length).toEqual(histogramData.histograms[0].numBins);
                        } else {
                            expect(RegionHistogramData.histograms[0].numBins).toEqual(histogramData.histograms[0].numBins);
                        };
                        expect(RegionHistogramData.histograms[0].bins).toEqual(histogramData.histograms[0].bins);
                    });
                });
            });

            
        });
    });
});