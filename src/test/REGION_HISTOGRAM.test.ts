import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    precisionDigits: number;
    cursor?: CARTA.ISetCursor;
    regionGroup: CARTA.ISetRegion[];
    spatial?: CARTA.ISetSpatialRequirements;
    stats?: CARTA.ISetStatsRequirements;
    histogramGroup: CARTA.ISetHistogramRequirements[];
    histogramDataGroup: CARTA.IRegionHistogramData[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
        [
            {
                directory: testSubdirectory,
                file: "M17_SWex.image",
                fileId: 0,
                hdu: "",
                renderMode: CARTA.RenderMode.RASTER,
            },
            {
                directory: testSubdirectory,
                file: "M17_SWex.hdf5",
                fileId: 0,
                hdu: "",
                renderMode: CARTA.RenderMode.RASTER,
            },
        ],
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
                controlPoints: [{ x: 98, y: 541 }, { x: 7, y: 7 }],
                rotation: 0,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 98, y: 541 }, { x: 7, y: 7 }],
                rotation: 90,
            },
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 0, y: 524 }, { x: 7, y: 7 }],
                rotation: 45,
            },
        },
    ],
    histogramGroup: [
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
            regionId: 3,
            histograms: [{ channel: -1, numBins: -1 }],
        },
    ],
    histogramDataGroup: [
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 7,
                    binWidth: 0.0033473593648523092,
                    firstBinCenter: -0.0075361598283052444,
                    bins: [5, 2, 1, 0, 4, 1, 3],
                },
            ],
            progress: 1,
        },
        {
            regionId: 2,
            histograms: [
                {
                    numBins: 7,
                    binWidth: 0.0033473593648523092,
                    firstBinCenter: -0.0075361598283052444,
                    bins: [5, 2, 1, 0, 4, 1, 3],
                },
            ],
            progress: 1,
        },
        {
            regionId: 3,
            histograms: [
                {
                    numBins: 6,
                    bins: [0, 0, 0, 0, 0, 0],
                },
            ],
            progress: 1,
        },
    ],
};

describe("REGION_HISTOGRAM test: Testing histogram with rectangle regions", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    assertItem.openFile.map(openFile => {
        describe(`Go to "${testSubdirectory}" folder and open image "${openFile.file}" to set region`, () => {

            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            });

            test(`OpenFileAck & RegionHistogramData? | `, async () => {
                await Connection.send(CARTA.OpenFile, openFile);
                await Connection.receive(CARTA.OpenFileAck)
                await Connection.receive(CARTA.RegionHistogramData);
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesRequire);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                let temp1 = await Connection.stream(4) as AckStream;
                // console.log(temp1)
            });

            assertItem.histogramDataGroup.map((histogramData, index) => {
                describe(`SET REGION #${histogramData.regionId}`, () => {
                    let SetRegionAckTemp: CARTA.SetRegionAck;
                    test(`SET_REGION_ACK should arrive within ${regionTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetRegion, assertItem.regionGroup[index]);
                        SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck) as CARTA.SetRegionAck;
                    }, regionTimeout);

                    test("SET_REGION_ACK.success = true", () => {
                        expect(SetRegionAckTemp.success).toBe(true);
                    });

                    test(`SET_REGION_ACK.region_id = ${histogramData.regionId}`, () => {
                        expect(SetRegionAckTemp.regionId).toEqual(histogramData.regionId);
                    });
                });

                describe(`SET HISTOGRAM REQUIREMENTS on region #${histogramData.regionId}`, () => {
                    let RegionHistogramDataTemp: CARTA.RegionHistogramData;
                    test(`REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`, async () => {
                        await Connection.send(CARTA.SetHistogramRequirements, assertItem.histogramGroup[index]);
                        RegionHistogramDataTemp = await Connection.receive(CARTA.RegionHistogramData) as CARTA.RegionHistogramData;
                    }, regionTimeout);

                    test(`REGION_HISTOGRAM_DATA.region_id = ${histogramData.regionId}`, () => {
                        expect(RegionHistogramDataTemp.regionId).toEqual(histogramData.regionId);
                    });

                    test(`REGION_HISTOGRAM_DATA.progress = ${histogramData.progress}`, () => {
                        expect(RegionHistogramDataTemp.progress).toEqual(histogramData.progress);
                    });

                    test("Assert REGION_HISTOGRAM_DATA.histograms", () => {
                        if (RegionHistogramDataTemp.histograms[0].binWidth !== 0) {
                            expect(RegionHistogramDataTemp.histograms[0].binWidth).toBeCloseTo(histogramData.histograms[0].binWidth, assertItem.precisionDigits);
                        };
                        if (RegionHistogramDataTemp.histograms[0].firstBinCenter !== 0) {
                            expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(histogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                        };

                        let filterZero = RegionHistogramDataTemp.histograms[0].bins.filter(value => value === 0);
                        if (filterZero.length === RegionHistogramDataTemp.histograms[0].bins.length) {
                            expect(RegionHistogramDataTemp.histograms[0].bins.length).toEqual(histogramData.histograms[0].numBins);
                        } else {
                            expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(histogramData.histograms[0].numBins);
                        };
                        // console.log(RegionHistogramDataTemp.histograms[0])
                        expect(RegionHistogramDataTemp.histograms[0].bins).toEqual(histogramData.histograms[0].bins);
                    });
                });
            });

        });
    });

    afterAll(() => Connection.close());

});
