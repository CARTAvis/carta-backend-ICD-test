import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
var W3CWebSocket = require('websocket').w3cwebsocket;

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let largeImageTimeout = config.timeout.readLargeImage;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setRegion: CARTA.ISetRegion[];
    regionAck: CARTA.ISetRegionAck;
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory,
            file: "S255_IR_sci.spw29.cube.I.pbcor.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "S255_IR_sci.spw25.cube.I.pbcor.fits",
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
    setCursor: [
        {
            fileId: 0,
            point: { x: 1, y: 1 },
        },
        {
            fileId: 1,
            point: { x: 1, y: 1 },
        },
    ],
    setSpatialReq: [
        {
            fileId: 0,
            regionId: 0,
            spatialProfiles: ["x", "y"]
        },
        {
            fileId: 1,
            regionId: 0,
            spatialProfiles: ["x", "y"]
        },
    ],
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 630.0, y: 1060.0 }, { x: 600.0, y: 890.0 }],
                rotation: 0.0,
            }
        },
        {
            fileId: 1,
            regionId: -1,
            regionInfo: {
                regionType: CARTA.RegionType.RECTANGLE,
                controlPoints: [{ x: 630.0, y: 1060.0 }, { x: 600.0, y: 890.0 }],
                rotation: 0.0,
            }
        },
    ],
    regionAck:
    {
        success: true,
        regionId: 1,
    },
    setSpectralRequirements: [
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
        {
            fileId: 0,
            regionId: 1,
            spectralProfiles: [],
        },
        {
            fileId: 1,
            regionId: 1,
            spectralProfiles: [
                {
                    coordinate: "z",
                    statsTypes: [
                        CARTA.StatsType.Mean,
                    ],
                }
            ],
        },
    ],
};

describe("[Case 1] Request SPECTRAL_REQUIREMENTS and then CLOSE_FILE when data is still streaming :", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(W3CWebSocket.OPEN);
    });

    test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen[0]);
        let OpenAck = await Connection.receive(CARTA.OpenFileAck)
        await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
        expect(OpenAck.success).toBe(true)
        expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file)
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
        ack = await Connection.stream(5, 2500) as AckStream;
        expect(ack.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq[0].tiles.length) //only 1 Tile returned
    }, readFileTimeout);

    let SetRegionAckTemp: CARTA.SetRegionAck;
    let SpectralProfileDataTemp: CARTA.SpectralProfileData;
    let ReceiveProgress: number;
    test(`(Step 3) Set REGION & SPECTRAL_PROFILE streaming, once progress>0.5 then CLOSE_FILE & Check whether the backend is alive:`, async () => {
        // Set REGION
        await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
        SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck)
        expect(SetRegionAckTemp.regionId).toEqual(assertItem.regionAck.regionId)
        expect(SetRegionAckTemp.success).toEqual(assertItem.regionAck.success)

        //Set SPECTRAL_PROFILE streaming
        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[0]);
        SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
        ReceiveProgress = SpectralProfileDataTemp.progress;
        if (ReceiveProgress != 1) {
            while (ReceiveProgress <= 0.5) {
                SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                ReceiveProgress = SpectralProfileDataTemp.progress
                console.warn('' + assertItem.fileOpen[0].file + ' SPECTRAL_PROFILE progress :', ReceiveProgress)
            };

            //Once progress>0.5, then CLOSE_FILE
            await Connection.send(CARTA.CloseFile, { fileId: 0 });

            //Check whether the backend ist alive?
            let Response = await Connection.receiveAny(1000, false)
            expect(Response).toEqual(undefined)

            await Connection.send(CARTA.FileListRequest, assertItem.filelist)
            let BackendStatus = await Connection.receive(CARTA.FileListResponse)
            expect(BackendStatus).toBeDefined()
            expect(BackendStatus.success).toBe(true);
            expect(BackendStatus.directory).toBe(assertItem.filelist.directory)
        };
    }, largeImageTimeout);
    afterAll(() => Connection.close());
});

describe("[Case 2] Request SPECTRAL_REQUIREMENTS of TWO images and then CLOSE_FILE when the SECOND data is still streaming :", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(W3CWebSocket.OPEN);
    });

    test(`(Step 1) IMAGE 1 : OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
        await Connection.send(CARTA.CloseFile, { fileId: 0 });
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen[0]);
        let OpenAck = await Connection.receive(CARTA.OpenFileAck)
        await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
        expect(OpenAck.success).toBe(true)
        expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[0].file)
    }, openFileTimeout);

    let ack: AckStream;
    test(`(Step 2) IMAGE 1 : return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[0]);
        ack = await Connection.stream(5, 2500) as AckStream;
        expect(ack.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
        expect(ack.RasterTileData.length).toEqual(assertItem.addTilesReq[0].tiles.length) //only 1 Tile returned
    }, readFileTimeout);

    test(`(Step 3) IMAGE 2 : OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: 1 });
        await Connection.send(CARTA.OpenFile, assertItem.fileOpen[1]);
        let OpenAck = await Connection.receive(CARTA.OpenFileAck)
        await Connection.receive(CARTA.RegionHistogramData) // OpenFileAck | RegionHistogramData
        expect(OpenAck.success).toBe(true)
        expect(OpenAck.fileInfo.name).toEqual(assertItem.fileOpen[1].file)
    }, openFileTimeout);

    let ack2: AckStream;
    test(`(Step 4) IMAGE 2 : return RASTER_TILE_DATA(Stream) and check total length `, async () => {
        await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);
        await Connection.send(CARTA.SetCursor, assertItem.setCursor[1]);
        await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[1]);
        ack2 = await Connection.stream(5, 2500) as AckStream;
        expect(ack2.RasterTileSync.length).toEqual(2) //RasterTileSync: start & end
        expect(ack2.RasterTileData.length).toEqual(assertItem.addTilesReq[1].tiles.length) //only 1 Tile returned
    }, readFileTimeout);

    let SetRegionAckTemp: CARTA.SetRegionAck;
    let SpectralProfileDataTemp1: CARTA.SpectralProfileData;
    let ReceiveProgress1: number;
    let SpectralProfileDataTemp2: CARTA.SpectralProfileData;
    let ReceiveProgress2: number;
    // let SetRegionAckTemp2: CARTA.SetRegionAck;
    test(`(Step 5) Set REGION & SPECTRAL_PROFILE streaming, once progress1>0.5 -> progress2>0.5 -> CLOSE_FILE two images & Check whether the backend is alive:`, async () => {
        // Set REGION
        await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
        SetRegionAckTemp = await Connection.receive(CARTA.SetRegionAck)
        // console.log(SetRegionAckTemp)

        //Set 1st image SPECTRAL_PROFILE streaming
        await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[0]);
        SpectralProfileDataTemp1 = await Connection.receive(CARTA.SpectralProfileData);
        ReceiveProgress1 = SpectralProfileDataTemp1.progress;
        // console.log(SpectralProfileDataTemp1)
        if (ReceiveProgress1 != 1) {
            while (ReceiveProgress1 <= 0.5) {
                SpectralProfileDataTemp1 = await Connection.receive(CARTA.SpectralProfileData);
                ReceiveProgress1 = SpectralProfileDataTemp1.progress
                console.warn('(Case 2) ' + assertItem.fileOpen[0].file + ' SPECTRAL_PROFILE progress :', ReceiveProgress1)
            };
            await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[1]);

            // Set  2nd image SPECTRAL_PROFILE streaming
            await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[2]);
            SpectralProfileDataTemp2 = await Connection.receive(CARTA.SpectralProfileData);
            console.log(SpectralProfileDataTemp2)
            ReceiveProgress2 = SpectralProfileDataTemp2.progress;
            if (ReceiveProgress2 != 1) {
                while (ReceiveProgress2! < 0.5) {
                    SpectralProfileDataTemp2 = await Connection.receive(CARTA.SpectralProfileData);
                    // console.log(SpectralProfileDataTemp2)
                    ReceiveProgress2 = SpectralProfileDataTemp2.progress
                    console.warn('(Case 2) ' + assertItem.fileOpen[1].file + ' SPECTRAL_PROFILE progress :', ReceiveProgress2)
                };
                //Once ReceiveProgress2>0.5, then CLOSE_FILE to 1st & 2nd image
                await Connection.send(CARTA.CloseFile, { fileId: 0 });
                await Connection.send(CARTA.CloseFile, { fileId: 1 });

                //Check whether the backend ist alive?
                let Response = await Connection.receiveAny(1000, false)
                expect(Response).toEqual(undefined)

                await Connection.send(CARTA.FileListRequest, assertItem.filelist)
                let BackendStatus = await Connection.receive(CARTA.FileListResponse)
                expect(BackendStatus).toBeDefined()
                expect(BackendStatus.success).toBe(true);
                expect(BackendStatus.directory).toBe(assertItem.filelist.directory)
            };
        };
    }, largeImageTimeout);
    afterAll(() => Connection.close());
});