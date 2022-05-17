import { CARTA } from "carta-protobuf";
import * as Long from "long";
import { Report } from "performance/SocketOperation";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;
let PVTimeout: number = config.timeout.pvRequest;
let Match2ImageTimeout: number = 30000;

interface SpatialProfileDataExtend extends CARTA.ISpatialProfileData {
    index?: number;
    indexValue?: number;
}

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    setPVRequest: CARTA.IPvRequest[];
    returnPVSpatial: SpatialProfileDataExtend;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: [
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.image",
            hdu: "0",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 1,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },

    ],
    setSpatialReq: [
        {
            fileId: 1,
            regionId: 0,
            spatialProfiles: []
        },
        {
            fileId: 1,
            regionId: 1,
            spatialProfiles: [{coordinate:"", mip:1, width:3}]
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.LINE,
                controlPoints: [{ x: 79, y: 77 }, { x: 362, y: 360 }],
                rotation: 135,
            }
        },
    ],
    setPVRequest: [
        {
            fileId:0,
            regionId:1,
            width:3,
        },
        {
            fileId:1,
            regionId:1,
            width:3,
        },
    ],
    returnPVSpatial: {
        fileId:1,
        regionId:1,
        profiles: [{coordinate:"", start: 0, end: 400}],
        index: 100,
        indexValue: 0.00860303919762373,
    }
};

describe("PV_GENERATOR_MATCH_SPATIAL:Testing PV generator with two spatially matched images", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Go to "${assertItem.filelist.directory}" folder and open "${assertItem.openFile[0].file}" & "${assertItem.openFile[1].file}"`, () => {
        test(`(step 1): Open the first image`,async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            let OpenFileResponse = await Connection.openFile(assertItem.openFile[0]);
            expect(OpenFileResponse.OpenFileAck.success).toEqual(true);
            expect(OpenFileResponse.OpenFileAck.fileInfo.name).toEqual(assertItem.openFile[0].file)
            expect(OpenFileResponse.RegionHistogramData.fileId).toEqual(0);

        }, readTimeout);

        test(`(step 2): set cursor and add required tiles to the first image`, async()=>{
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
            await Connection.stream(3);
            // await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        })

        test(`(step 3): Open the second image`,async () => {
            let OpenFileResponse = await Connection.openFile(assertItem.openFile[1]);
            expect(OpenFileResponse.OpenFileAck.success).toEqual(true);
            expect(OpenFileResponse.OpenFileAck.fileInfo.name).toEqual(assertItem.openFile[1].file)
            expect(OpenFileResponse.RegionHistogramData.fileId).toEqual(1);

        }, readTimeout);

        test(`(step 4): set cursor and add required tiles to the second image`, async()=>{
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
            await Connection.stream(3);
            // await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        })

        test(`(Step 5): set SET_REGION to the first image`,async()=>{
            await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
            let RegionResponse = await Connection.receive(CARTA.SetRegionAck);
            expect(RegionResponse.regionId).toEqual(1);
            expect(RegionResponse.success).toEqual(true);
        });

        test(`(step 6): Match the first image to the second image`, async()=>{
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
            let Response = await Connection.receiveAny();
            expect(Response.fileId).toEqual(assertItem.returnPVSpatial.fileId);
            expect(Response.regionId).toEqual(assertItem.returnPVSpatial.regionId);
            expect(Response.profiles[0].coordinate).toEqual(assertItem.returnPVSpatial.profiles[0].coordinate);
            expect(Response.profiles[0].start).toEqual(assertItem.returnPVSpatial.profiles[0].start);
            expect(Response.profiles[0].end).toEqual(assertItem.returnPVSpatial.profiles[0].end);
            expect(Response.profiles[0].values[assertItem.returnPVSpatial.index]).toEqual(assertItem.returnPVSpatial.indexValue);
        }, Match2ImageTimeout);

        test(`(Step 7): 1st image PV Request`, async()=>{
            await Connection.send(CARTA.PvRequest, assertItem.setPVRequest[0]);
            let PVresponse = await Connection.receive(CARTA.PvProgress);
            let ReceiveProgress = PVresponse.progress;
            if (ReceiveProgress != 1) {
                while (ReceiveProgress < 1) {
                    PVresponse = await Connection.receive(CARTA.PvProgress);
                    ReceiveProgress = PVresponse.progress;
                    console.warn('' + assertItem.openFile[0].file + ' PV response progress :', ReceiveProgress);
                    if (ReceiveProgress === 1) {
                        let PVRegionHistogramResponse = await Connection.receiveAny();
                        let finalPVResponse = await Connection.receive(CARTA.PvResponse);
                        expect(PVRegionHistogramResponse.fileId).toEqual(1000);
                        expect(PVRegionHistogramResponse.regionId).toEqual(-1);
                        expect(PVRegionHistogramResponse.progress).toEqual(1);
                        expect(finalPVResponse.openFileAck.fileId).toEqual(1000);
                        expect(finalPVResponse.openFileAck.fileInfo.name).toEqual("HD163296_CO_2_1_pv.fits");
                        expect(finalPVResponse.success).toEqual(true)
                    }
                };
            } else if (ReceiveProgress === 1) {
                let PVRegionHistogramResponse = await Connection.receiveAny();
                let finalPVResponse = await Connection.receive(CARTA.PvResponse);
            }
        },PVTimeout)

        test(`(Step 7): 2nd image PV Request`, async()=>{
            await Connection.send(CARTA.PvRequest, assertItem.setPVRequest[1]);
            let PVresponse = await Connection.receive(CARTA.PvProgress);
            let ReceiveProgress = PVresponse.progress;
            if (ReceiveProgress != 1) {
                while (ReceiveProgress < 1) {
                    PVresponse = await Connection.receive(CARTA.PvProgress);
                    ReceiveProgress = PVresponse.progress;
                    console.warn('' + assertItem.openFile[1].file + ' PV response progress :', ReceiveProgress);
                    if (ReceiveProgress === 1) {
                        let PVRegionHistogramResponse = await Connection.receiveAny();
                        let finalPVResponse = await Connection.receive(CARTA.PvResponse);
                        expect(PVRegionHistogramResponse.fileId).toEqual(2000);
                        expect(PVRegionHistogramResponse.regionId).toEqual(-1);
                        expect(PVRegionHistogramResponse.progress).toEqual(1);
                        expect(finalPVResponse.openFileAck.fileId).toEqual(2000);
                        expect(finalPVResponse.openFileAck.fileInfo.name).toEqual("HD163296_CO_2_1_pv.image");
                        expect(finalPVResponse.success).toEqual(true)
                    }
                };
            } else if (ReceiveProgress === 1) {
                let PVRegionHistogramResponse = await Connection.receiveAny();
                let finalPVResponse = await Connection.receive(CARTA.PvResponse);
            }
        },PVTimeout)
    });
    afterAll(() => Connection.close());
});
