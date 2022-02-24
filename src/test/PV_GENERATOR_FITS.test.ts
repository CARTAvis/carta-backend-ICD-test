import { CARTA } from "carta-protobuf";
import * as Long from "long";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let readTimeout: number = config.timeout.readFile;
let messageTimeout: number = config.timeout.messageEvent;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    openFile: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    setPVRequest: CARTA.IPvRequest;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_CO_2_1.image",
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
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            let OpenFileResponse = await Connection.openFile(assertItem.openFile);
            expect(OpenFileResponse.OpenFileAck.success).toEqual(true);
            expect(OpenFileResponse.OpenFileAck.fileInfo.name).toEqual(assertItem.openFile.file)
            expect(OpenFileResponse.RegionHistogramData.fileId).toEqual(0);

        }, readTimeout);

        test(`(step 2)`, async()=>{
            await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
            await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
            await Connection.stream(4);
            // await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        })

        // test(`step 3:SET_SPATIAL_REQUIREMENTS`, async()=>{
        //     await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
        //     let t3 = await Connection.receiveAny();
        //     // console.log(t3);
        // });

        // test(`Step 4:SET_REGION`,async()=>{
        //     await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
        //     let t4 = await Connection.receiveAny();
        //     console.log(t4);
        // });

        // test(`Step 5:PV Request`, async()=>{
        //     await Connection.send(CARTA.PvRequest, assertItem.setPVRequest);
        //     let PVresponse = await Connection.receive(CARTA.PvResponse);
        //     let ReceiveProgress = PVresponse.progress;
        //     if (ReceiveProgress != 1) {
        //         while (ReceiveProgress < 1) {
        //             PVresponse = await Connection.receive(CARTA.PvResponse);
        //             ReceiveProgress = PVresponse.progress;
        //             console.warn('' + assertItem.openFile.file + ' Catalog loading progress :', ReceiveProgress);
        //         };
        //     };
        // },100000)

        // test(`Step 6: default after PV`, async()=>{
        //     await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
        //     await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
        //     let t6 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
        //     let t61 = t6.RasterTileData[0];
        //     // console.log(t61);
        //     // console.log(t61.tiles[0].imageData[0])
        //     // console.log(t61.tiles[0].imageData[2500]);
        //     // console.log(t61.tiles[0].imageData[5000]);
        //     // console.log(t61.tiles[0].imageData[7500]);
        //     // console.log(t61.tiles[0].imageData[10000]);
        //     // console.log(t61.tiles[0].imageData[15000]);
        //     // console.log(t61.tiles[0].imageData[20000]);
        //     // console.log(t61.tiles[0].imageData[25000]);
        //     // console.log("============================")
        //     // for (let i = 18800; i <= 18810; i++) {
        //     //     console.log(t61.tiles[0].imageData[i]);
        //     // }
        //     let t62 = t6.RasterTileData[1];
        //     console.log(t62);
        //     console.log(t62.tiles[0].imageData[0])
        //     console.log(t62.tiles[0].imageData[2500]);
        //     console.log(t62.tiles[0].imageData[5000]);
        //     console.log(t62.tiles[0].imageData[7500]);
        //     console.log(t62.tiles[0].imageData[10000]);
        //     console.log(t62.tiles[0].imageData[15000]);
        //     console.log(t62.tiles[0].imageData[20000]);
        //     console.log(t62.tiles[0].imageData[25000]);
        //     console.log("============================")
        //     for (let i = 35500; i <= 35510; i++) {
        //         console.log(t62.tiles[0].imageData[i]);
        //     }
        // })

    });

    afterAll(() => Connection.close());
});