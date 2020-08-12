import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;

interface AssertItem {
    precisionDigits: number;
    register: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    setCursor: CARTA.ISetCursor;
    addTilesRequire: CARTA.IAddRequiredTiles;
    setRegion: CARTA.ISetRegion;
    regionAck: CARTA.ISetRegionAck;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    spectralProfileData: CARTA.ISpectralProfileData;
    setStatsRequirements: CARTA.ISetStatsRequirements;
    regionStatsData: CARTA.IRegionStatsData;
    setHistogramRequirements: CARTA.ISetHistogramRequirements;
    regionHistogramData: CARTA.IRegionHistogramData;
};

let assertItem: AssertItem = {
    precisionDigits: 4,
    register:
    {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.image",
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
    setRegion:
    {
        fileId: 0,
        regionId: 1,
        regionInfo: {
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{ x: 302, y: 370 }, { x: 10, y: 20 }],
            rotation: 30.0,
        }
    },
    regionAck:
    {
        success: true,
        regionId: 1,
    },
    setSpectralRequirements:
    {
        fileId: 0,
        regionId: 1,
        spectralProfiles: [
            {
                coordinate: "z",
                statsTypes: [CARTA.StatsType.Mean],
            }
        ],
    },
    spectralProfileData:
    {
        regionId: 1,
        progress: 1,
    },
    setStatsRequirements:
    {
        fileId: 0,
        regionId: 1,
        stats: [
            CARTA.StatsType.NumPixels,
            CARTA.StatsType.Sum,
            CARTA.StatsType.Mean,
            CARTA.StatsType.RMS,
            CARTA.StatsType.Sigma,
            CARTA.StatsType.SumSq,
            CARTA.StatsType.Min,
            CARTA.StatsType.Max
        ],
    },
    regionStatsData:
    {
        regionId: 1,
    },
    setHistogramRequirements:
    {
        fileId: 0,
        regionId: 1,
        histograms: [{ channel: -1, numBins: -1 }],
    },
    regionHistogramData:
    {
        regionId: 1,
        progress: 1,
    },
};

describe("REGION_DATA_STREAM test: Testing data streaming after the regions", () => {
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

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}" to set region`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        });

        test(`OpenFileAck & RegionHistogramData? | `, async () => {
            await Connection.send(CARTA.OpenFile, assertItem.openFile);
            await Connection.receive(CARTA.OpenFileAck)
            await Connection.receive(CARTA.RegionHistogramData);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesRequire);
            await Connection.send(CARTA.SetCursor, assertItem.setCursor);
            let temp1 = await Connection.stream(4) as AckStream;
            // console.log(temp1)
        });

        describe("SET REGION: ", () => {
            let SetRegionAckTemp: CARTA.SetRegionAck;
            test(`SET_REGION_ACK should arrive within ${readFileTimeout} ms`, async () => {
                await Connection.send(CARTA.SetRegion, assertItem.setRegion);
                SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck);
                // console.log(SetRegionAckTemp)
            }, readFileTimeout);

            test("SET_REGION_ACK.success = true", () => {
                expect(SetRegionAckTemp.success).toBe(true);
            });

            test(`SET_REGION_ACK.region_id = ${assertItem.regionAck.regionId}`, () => {
                expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAck.regionId);
            });

            let SpectralProfileDataTemp: any;
            test(`SPECTRAL_PROFILE_DATA should return within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
                SpectralProfileDataTemp = await Connection.stream(1);
                // console.log(SpectralProfileDataTemp);
            });

            test(`SPECTRAL_PROFILE_DATA.region_id = ${assertItem.spectralProfileData.regionId}`, () => {
                expect(SpectralProfileDataTemp.SpectralProfileData[0].regionId).toEqual(assertItem.spectralProfileData.regionId);
            });

            test(`SPECTRAL_PROFILE_DATA.progress = ${assertItem.spectralProfileData.progress}`, () => {
                expect(SpectralProfileDataTemp.SpectralProfileData[0].progress).toEqual(assertItem.spectralProfileData.progress);
            });

            let RegionHistDataTemp: any;
            test(`REGION_HISTOGRAM_DATA should returb within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetHistogramRequirements, assertItem.setHistogramRequirements);
                RegionHistDataTemp = await Connection.stream(1);
                // console.log(RegionHistDataTemp);
            }, regionTimeout);

            test(`REGION_HISTOGRAM_DATA.region_id = ${assertItem.regionHistogramData.regionId}`, () => {
                expect(RegionHistDataTemp.RegionHistogramData[0].regionId).toEqual(assertItem.regionHistogramData.regionId);
            });

            test(`REGION_HISTOGRAM_DATA.progress = ${assertItem.regionHistogramData.progress}`, () => {
                expect(RegionHistDataTemp.RegionHistogramData[0].progress).toEqual(assertItem.regionHistogramData.progress);
            });

            let RegionStatsDataTemp: any;
            test(`REGION_STATS_DATA should returb within ${regionTimeout} ms`, async () => {
                await Connection.send(CARTA.SetStatsRequirements, assertItem.setStatsRequirements);
                RegionStatsDataTemp = await Connection.stream(1);
                // console.log(RegionStatsDataTemp);
            }, regionTimeout);

            test(`REGION_STATS_DATA.region_id = ${assertItem.regionStatsData.regionId}`, () => {
                expect(RegionStatsDataTemp.RegionStatsData[0].regionId).toEqual(assertItem.regionStatsData.regionId);
                // console.log(RegionStatsDataTemp.RegionStatsData[0].regionId);
            });
        });

    });

});