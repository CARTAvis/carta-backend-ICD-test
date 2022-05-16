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
    setPVRequest: CARTA.IPvRequest;
    imageDataIndex2: number[];
    imageDataSequence1: number[];
    imageData2: number[];
    imageDataSequence2: number[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
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
            point: { x: 260, y: 11 },
        },
        {
            fileId: 1000,
            point: { x: 64, y: 8 },
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
                controlPoints: [{ x: -54, y: 325 }, { x: 206, y: 325 }],
                rotation: 90,
            }
        },
    ],
    setPVRequest: {
        fileId:0,
        regionId:1,
        width:3,
    },
    imageDataSequence1: [0,0,0,0,0,0,0,0],
    imageDataIndex2: [0,500,1000,1500,2000,3000],
    imageData2: [241,77,63,201,254,220],
    imageDataSequence2: [245,112,51,42,145,32,151,35,241,6,107]
};

describe("PV_GENERATOR_NaN:Testing PV generator with a region covers NaN and none pixel.", () => {

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

        test(`(Step 4): set SET_REGION`,async()=>{
            await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
            let RegionResponse = await Connection.receive(CARTA.SetRegionAck);
            expect(RegionResponse.regionId).toEqual(1);
            expect(RegionResponse.success).toEqual(true);
        });

        test(`(Step 5): PV Request`, async()=>{
            await Connection.send(CARTA.PvRequest, assertItem.setPVRequest);
            let PVresponse = await Connection.receive(CARTA.PvProgress);
            let ReceiveProgress = PVresponse.progress;
            if (ReceiveProgress != 1) {
                while (ReceiveProgress < 1) {
                    PVresponse = await Connection.receive(CARTA.PvProgress);
                    ReceiveProgress = PVresponse.progress;
                    console.warn('' + assertItem.openFile.file + ' PV response progress :', ReceiveProgress);
                    if (ReceiveProgress === 1) {
                        let PVRegionHistogramResponse = await Connection.receiveAny();
                        let finalPVResponse = await Connection.receive(CARTA.PvResponse);
                    }
                };
            } else if (ReceiveProgress === 1) {
                let PVRegionHistogramResponse = await Connection.receiveAny();
                let finalPVResponse = await Connection.receive(CARTA.PvResponse);
            }
        },PVTimeout)

        test(`(Step 6 & 7): request 2 tiles after PV response`, async()=>{
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
            let TilesResponse = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            let Tile1 = TilesResponse.RasterTileData[0];
            let Tile2 = TilesResponse.RasterTileData[1];
            if (Tile1.tiles[0].width === 5) {
                expect(Tile1.tiles[0].layer).toEqual(1);
                expect(Tile1.tiles[0].width).toEqual(5);
                expect(Tile1.tiles[0].height).toEqual(25);
                expect(Tile1.tiles[0].x).toEqual(1);
                for (let i = 0; i < assertItem.imageDataSequence1.length; i++) {
                    expect(Tile1.tiles[0].imageData[i]).toEqual(assertItem.imageDataSequence1[i]);
                }
            
                expect(Tile2.tiles[0].layer).toEqual(1);
                expect(Tile2.tiles[0].width).toEqual(256);
                expect(Tile2.tiles[0].height).toEqual(25);
                for (let i=0; i<assertItem.imageData2.length; i++) {
                    expect(Tile2.tiles[0].imageData[assertItem.imageDataIndex2[i]]).toEqual(assertItem.imageData2[i]);
                }
                for (let i = 0; i <= 10; i++) {
                    expect(Tile2.tiles[0].imageData[i+2510]).toEqual(assertItem.imageDataSequence2[i]);
                }
            } else if (Tile1.tiles[0].width === 256){
                expect(Tile2.tiles[0].layer).toEqual(1);
                expect(Tile2.tiles[0].width).toEqual(5);
                expect(Tile2.tiles[0].height).toEqual(25);
                expect(Tile2.tiles[0].x).toEqual(1);
                for (let i = 0; i < assertItem.imageDataSequence1.length; i++) {
                    expect(Tile2.tiles[0].imageData[i]).toEqual(assertItem.imageDataSequence1[i]);
                }
            
                expect(Tile1.tiles[0].layer).toEqual(1);
                expect(Tile1.tiles[0].width).toEqual(256);
                expect(Tile1.tiles[0].height).toEqual(25);
                for (let i=0; i<assertItem.imageData2.length; i++) {
                    expect(Tile1.tiles[0].imageData[assertItem.imageDataIndex2[i]]).toEqual(assertItem.imageData2[i]);
                }
                for (let i = 0; i <= 10; i++) {
                    expect(Tile1.tiles[0].imageData[i+2510]).toEqual(assertItem.imageDataSequence2[i]);
                }
            }
        })

        test(`(step 8): set cursor and check the return value`, async()=>{
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
            let SpatialProfileDataResponse1 = await Connection.receive(CARTA.SpatialProfileData);
            expect(SpatialProfileDataResponse1.fileId).toEqual(1000);
            expect(SpatialProfileDataResponse1.value).toEqual(NaN);

            await Connection.send(CARTA.SetCursor, assertItem.setCursor[2]);
            let SpatialProfileDataResponse2 = await Connection.receive(CARTA.SpatialProfileData);
            console.log(SpatialProfileDataResponse2)
            expect(SpatialProfileDataResponse2.fileId).toEqual(1000);
            expect(SpatialProfileDataResponse2.value).toEqual(-0.0035615740343928337);
        })

    });

    afterAll(() => Connection.close());
});