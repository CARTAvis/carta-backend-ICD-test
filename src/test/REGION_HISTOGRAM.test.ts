import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
import { isNumber } from "util";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    fileOpen: CARTA.IOpenFile;
    precisionDigits: number;
    cursor?: CARTA.ISetCursor;
    regionGroup: CARTA.ISetRegion[];
    spatial?: CARTA.ISetSpatialRequirements;
    stats?: CARTA.ISetStatsRequirements;
    histogramGroup: CARTA.ISetHistogramRequirements[];
    histogramDataGroup: CARTA.IRegionHistogramData[];
    setImageChannels?: CARTA.ISetImageChannels;
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0, 
        apiKey: "",
        clientFeatureFlags: 5,
    },
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setImageChannels: {
        fileId: 0,
        channel: 0,
        stokes: 0,
        requiredTiles: {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11,
        },
    },
    precisionDigits: 4,
    regionGroup: [
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 98, y: 541}, {x: 7, y: 7}],
            rotation: 0,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 98, y: 541}, {x: 7, y: 7}],
            rotation: 90,
        },
        {
            fileId: 0,
            regionId: -1,
            regionName: "",
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 0, y: 524}, {x: 7, y: 7}],
            rotation: 45,
        },
    ],
    histogramGroup: [
        {
            fileId: 0,
            regionId: 1,
            histograms: [{channel: -1, numBins: -1}],
        },
        {
            fileId: 0,
            regionId: 2,
            histograms: [{channel: -1, numBins: -1}],
        },
        {
            fileId: 0,
            regionId: 3,
            histograms: [{channel: -1, numBins: -1}],
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
                    bins:  [5, 2, 1, 0, 4, 1, 3],
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
                    bins:  [5, 2, 1, 0, 4, 1, 3],
                },
            ],
            progress: 1,
        },
        {
            regionId: 3,
            histograms: [
                {
                    numBins: 6,
                    bins:  [0, 0, 0, 0, 0, 0],
                },
            ],
            progress: 1,
        },
    ],
}

describe("REGION_HISTOGRAM test: Testing histogram with rectangle regions", () => {   
    let Connection: WebSocket;
    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.registerViewer);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.fileOpen.file}" to set region`, () => {

        beforeAll( async () => {
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1,});
            await Utility.setEventAsync(Connection, CARTA.OpenFile, assertItem.fileOpen);
            await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
            await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannels);
            await Utility.getEventAsync(Connection, CARTA.RasterTileData);
        });

        assertItem.histogramDataGroup.map( (histogramData, index) => {
            describe(`SET REGION #${histogramData.regionId}`, () => {
                let SetRegionAckTemp: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should arrive within ${regionTimeout} ms`, async () => {
                    await Utility.setEventAsync(Connection, CARTA.SetRegion, assertItem.regionGroup[index]);
                    SetRegionAckTemp = <CARTA.SetRegionAck>await Utility.getEventAsync(Connection, CARTA.SetRegionAck);
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
                    await Utility.setEventAsync(Connection, CARTA.SetHistogramRequirements, assertItem.histogramGroup[index]);
                    RegionHistogramDataTemp = <CARTA.RegionHistogramData>await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
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
                    }
                    if (RegionHistogramDataTemp.histograms[0].firstBinCenter !== 0) {
                        expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(histogramData.histograms[0].firstBinCenter, assertItem.precisionDigits);
                    }
                    expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(histogramData.histograms[0].numBins);
                    expect(RegionHistogramDataTemp.histograms[0].bins).toEqual(histogramData.histograms[0].bins);
                });
            });
        });

    });

    afterAll( () => Connection.close());
});