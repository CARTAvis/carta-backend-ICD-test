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
    imageDataIndex: number[];
    imageData1: number[];
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
        file: "HD163296_CO_2_1.fits",
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
                controlPoints: [{ x: 79, y: 77 }, { x: 362, y: 360 }],
                rotation: 135,
            }
        },
    ],
    setPVRequest: {
        fileId:0,
        regionId:1,
        width:3,
    },
    imageDataIndex: [0,2500,5000,7500,10000,15000,20000,25000],
    imageData1: [243,79,158,57,153,57,47,144],
    imageDataSequence1: [243,216,6,114,144,11,20,192,82,21,57],
    imageData2: [239,10,170,6,135,250,209,230],
    imageDataSequence2: [178,5,40,1,83,169,68,79,96,83,72]
};

describe("PV_GENERATOR_FITS:Testing PV generator with fits file.", () => {

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
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
            let TilesResponse = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            let Tile1 = TilesResponse.RasterTileData[0];
            let Tile2 = TilesResponse.RasterTileData[1];

            if (Tile1.tiles[0].width === 145) {
                expect(Tile1.tiles[0].layer).toEqual(1);
                expect(Tile1.tiles[0].width).toEqual(145);
                expect(Tile1.tiles[0].x).toEqual(1);
                for (let i=0; i<assertItem.imageData1.length; i++) {
                    expect(Tile1.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData1[i]);
                }
                for (let i = 0; i <= 10; i++) {
                    expect(Tile1.tiles[0].imageData[i+18800]).toEqual(assertItem.imageDataSequence1[i]);
                }

                expect(Tile2.tiles[0].layer).toEqual(1);
                expect(Tile2.tiles[0].width).toEqual(256);
                expect(Tile2.tiles[0].height).toEqual(250);
                for (let i=0; i<assertItem.imageData2.length; i++) {
                    expect(Tile2.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData2[i]);
                }
                for (let i = 0; i <= 10; i++) {
                    expect(Tile2.tiles[0].imageData[i+35500]).toEqual(assertItem.imageDataSequence2[i]);
                }
            } else if (Tile1.tiles[0].width === 256) {
                expect(Tile2.tiles[0].layer).toEqual(1);
                expect(Tile2.tiles[0].width).toEqual(145);
                expect(Tile2.tiles[0].x).toEqual(1);
                for (let i=0; i<assertItem.imageData2.length; i++) {
                    expect(Tile2.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData1[i]);
                }
                for (let i = 0; i <= 10; i++) {
                    expect(Tile2.tiles[0].imageData[i+18800]).toEqual(assertItem.imageDataSequence1[i]);
                }

                expect(Tile1.tiles[0].layer).toEqual(1);
                expect(Tile1.tiles[0].width).toEqual(256);
                expect(Tile1.tiles[0].height).toEqual(250);
                for (let i=0; i<assertItem.imageData1.length; i++) {
                    expect(Tile1.tiles[0].imageData[assertItem.imageDataIndex[i]]).toEqual(assertItem.imageData2[i]);
                }
                for (let i = 0; i <= 10; i++) {
                    expect(Tile1.tiles[0].imageData[i+35500]).toEqual(assertItem.imageDataSequence2[i]);
                }
            }
        })

    });

    afterAll(() => Connection.close());
});