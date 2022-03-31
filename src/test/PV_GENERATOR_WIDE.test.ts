import { CARTA } from "carta-protobuf";
import * as Long from "long";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;
let PVTimeout: number = config.timeout.pvRequest;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    setPVRequest: CARTA.IPvRequest[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "Gaussian-cutted.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 1000,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [16777216, 16777217],
        },
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 1, y: 1 },
        },
        {
            fileId: 1000,
            point: { x: 175, y: 125 },
        },
    ],
    setSpatialReq: [
        {
            fileId: 0,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
        {
            fileId: 1000,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.LINE,
                controlPoints: [{ x: 74, y: 190 }, { x: 164, y: 190 }],
                rotation: 90,
            }
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.LINE,
                controlPoints: [{ x: 769, y: 190 }, { x: 859, y: 190 }],
                rotation: 90,
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
            fileId:0,
            regionId:2,
            width:3,
        }
    ],
};

describe("PV_GENERATOR_WIDE:Testing PV generator with wide (~all sky) image", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        test(`(step 1): Open File`,async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            let OpenFileResponse = await Connection.openFile(assertItem.openFile);
            expect(OpenFileResponse.OpenFileAck.success).toEqual(true);
            expect(OpenFileResponse.OpenFileAck.fileInfo.name).toEqual(assertItem.openFile.file)
            expect(OpenFileResponse.RegionHistogramData.fileId).toEqual(0);

        }, readTimeout);

        test(`(step 2): set cursor and add required tiles`, async()=>{
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
            await Connection.stream(4);
            // await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        })

        test(`(step 3): set SET_SPATIAL_REQUIREMENTS`, async()=>{
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
            let SpatialProfileDataResponse = await Connection.receive(CARTA.SpatialProfileData);
        });

        test(`(Step 4): set the first region`,async()=>{
            await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
            let RegionResponse = await Connection.receive(CARTA.SetRegionAck);
            expect(RegionResponse.regionId).toEqual(1);
            expect(RegionResponse.success).toEqual(true);
        });

        test(`(Step 5): PV Request for the first region`, async()=>{
            await Connection.send(CARTA.PvRequest, assertItem.setPVRequest[0]);
            let PVresponse = await Connection.receive(CARTA.PvProgress);
            let ReceiveProgress = PVresponse.progress;
            if (ReceiveProgress != 1) {
                while (ReceiveProgress < 1) {
                    PVresponse = await Connection.receive(CARTA.PvProgress);
                    ReceiveProgress = PVresponse.progress;
                    console.warn('' + assertItem.openFile.file + ' with Region 1 PV response progress :', ReceiveProgress);
                    if (ReceiveProgress === 1) {
                        let PVRegionHistogramResponse = await Connection.receiveAny();
                        let finalPVResponse = await Connection.receive(CARTA.PvResponse);
                        expect(PVRegionHistogramResponse.fileId).toEqual(1000);
                        expect(PVRegionHistogramResponse.progress).toEqual(1);
                        expect(PVRegionHistogramResponse.regionId).toEqual(-1);
                        expect(finalPVResponse.openFileAck.fileId).toEqual(1000);
                        expect(finalPVResponse.openFileAck.fileInfoExtended.height).toEqual(16);
                        expect(finalPVResponse.openFileAck.fileInfoExtended.width).toEqual(180);
                        expect(finalPVResponse.openFileAck.fileInfo.name).toEqual("Gaussian-cutted_pv.fits");
                        expect(finalPVResponse.success).toEqual(true);
                    }
                };
            } else if (ReceiveProgress === 1) {
                let PVRegionHistogramResponse = await Connection.receiveAny();
                let finalPVResponse = await Connection.receive(CARTA.PvResponse);
                expect(PVRegionHistogramResponse.fileId).toEqual(1000);
                expect(PVRegionHistogramResponse.progress).toEqual(1);
                expect(PVRegionHistogramResponse.regionId).toEqual(-1);
                expect(finalPVResponse.openFileAck.fileId).toEqual(1000);
                expect(finalPVResponse.openFileAck.fileInfoExtended.height).toEqual(16);
                expect(finalPVResponse.openFileAck.fileInfoExtended.width).toEqual(180);
                expect(finalPVResponse.openFileAck.fileInfo.name).toEqual("Gaussian-cutted_pv.fits");
                expect(finalPVResponse.success).toEqual(true);
            }
        },PVTimeout)

        test(`(Step 6): set the second region`,async()=>{
            await Connection.send(CARTA.SetRegion, assertItem.setRegion[1]);
            let RegionResponse = await Connection.receive(CARTA.SetRegionAck);
            expect(RegionResponse.regionId).toEqual(2);
            expect(RegionResponse.success).toEqual(true);
        });

        test(`(Step 7): PV Request for the second region`, async()=>{
            await Connection.send(CARTA.PvRequest, assertItem.setPVRequest[1]);
            let PVresponse = await Connection.receive(CARTA.PvProgress);
            let ReceiveProgress = PVresponse.progress;
            if (ReceiveProgress != 1) {
                while (ReceiveProgress < 1) {
                    PVresponse = await Connection.receive(CARTA.PvProgress);
                    ReceiveProgress = PVresponse.progress;
                    console.warn('' + assertItem.openFile.file + ' with Region 2 PV response progress :', ReceiveProgress);
                    if (ReceiveProgress === 1) {
                        let PVRegionHistogramResponse = await Connection.receiveAny();
                        let finalPVResponse = await Connection.receive(CARTA.PvResponse);
                        expect(PVRegionHistogramResponse.fileId).toEqual(1000);
                        expect(PVRegionHistogramResponse.progress).toEqual(1);
                        expect(PVRegionHistogramResponse.regionId).toEqual(-1);
                        expect(finalPVResponse.openFileAck.fileId).toEqual(1000);
                        expect(finalPVResponse.openFileAck.fileInfoExtended.height).toEqual(16);
                        expect(finalPVResponse.openFileAck.fileInfoExtended.width).toEqual(92);
                        expect(finalPVResponse.openFileAck.fileInfo.name).toEqual("Gaussian-cutted_pv.fits");
                        expect(finalPVResponse.success).toEqual(true);
                    }
                };
            } else if (ReceiveProgress === 1) {
                let PVRegionHistogramResponse = await Connection.receiveAny();
                let finalPVResponse = await Connection.receive(CARTA.PvResponse);
                expect(PVRegionHistogramResponse.fileId).toEqual(1000);
                        expect(PVRegionHistogramResponse.progress).toEqual(1);
                        expect(PVRegionHistogramResponse.regionId).toEqual(-1);
                        expect(finalPVResponse.openFileAck.fileId).toEqual(1000);
                        expect(finalPVResponse.openFileAck.fileInfoExtended.height).toEqual(16);
                        expect(finalPVResponse.openFileAck.fileInfoExtended.width).toEqual(92);
                        expect(finalPVResponse.openFileAck.fileInfo.name).toEqual("Gaussian-cutted_pv.fits");
                        expect(finalPVResponse.success).toEqual(true);
            }
        },PVTimeout)

    });

    afterAll(() => Connection.close());
});