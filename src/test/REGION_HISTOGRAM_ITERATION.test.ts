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
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 303, y: 607 }, { x: 3, y: 7 }],
                rotation: 0,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 303, y: 607 }, { x: 3, y: 7 }],
                rotation: 25,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 303, y: 607 }, { x: 3, y: 7 }],
                rotation: 50,
            },
        },
        {
            fileId: 0,
            regionId: 1,
            regionInfo: {
                regionType: CARTA.RegionType.ELLIPSE,
                controlPoints: [{ x: 303, y: 607 }, { x: 3, y: 7 }],
                rotation: 75
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
    ],
    histogramData: [
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 100,
                    binWidth: 0.0004586729046422988,
                    firstBinCenter: -0.027140149846673012,
                    mean: -0.0005255218950590148,
                    stdDev: 0.0041562225009849985,
                },
            ],
            progress: 1,
        },
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 213,
                    binWidth: 0.0002458694507367909,
                    firstBinCenter: -0.028115009889006615,
                    mean: 0.000045857146533616145,
                    stdDev: 0.004279587823672661,
                },
            ],
            progress: 1,
        },
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 235,
                    binWidth: 0.00019277054525446147,
                    firstBinCenter: -0.02472059801220894,
                    mean: -0.00015718120989984945,
                    stdDev: 0.004208865149775719,
                },
            ],
            progress: 1,
        },
        {
            regionId: 1,
            histograms: [
                {
                    numBins: 235,
                    binWidth: 0.00019277054525446147,
                    firstBinCenter: -0.02472059801220894,
                    mean: -0.00015718120989984945,
                    stdDev: 0.004208865149775719,
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
            describe(`SET REGION #${histogramData.regionId}`, () => {
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
            });

            describe(`SET HISTOGRAM REQUIREMENTS on region #${histogramData.regionId}`, () => {
                let RegionHistogramData: CARTA.RegionHistogramData;
                test(`REGION_HISTOGRAM_DATA should arrive within ${regionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetHistogramRequirements, assertItem.histogram[index]);
                    RegionHistogramData = await Connection.receive(CARTA.RegionHistogramData);
                    console.log(RegionHistogramData)
                    console.log(RegionHistogramData.histograms[0].bins)
                }, regionTimeout);
            });
        });
    });
});