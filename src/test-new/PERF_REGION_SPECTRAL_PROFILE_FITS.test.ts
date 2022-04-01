import { CARTA } from "carta-protobuf";
// import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
// const WebSocket = require('isomorphic-ws');
import {MessageController, ConnectionStatus} from "./MessageController";
import { take } from 'rxjs/operators';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let readRegionTimeout: number = config.timeout.region;
let spectralProfileTimeout: number = 120000;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    setRegion: CARTA.ISetRegion[];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory + "/cube_B"},
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_B",
            file: "cube_B_01600_z01000.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}],
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                rotation: 0,
                regionType: 3,

            },
        },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
        },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
        },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
        },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
        },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        {
            fileId: 0,
            regionId: -1,
            regionInfo: {
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
        },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
        // {
        //     fileId: 0,
        //     regionId: -1,
        //     regionInfo: {
        //         controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
        //         regionType: 3,
        //         rotation: 0,
        //     },
        // },
    ],
    setSpectralRequirements: [
        {
            spectralProfiles: [{ coordinate: "z", statsTypes: [4] },],
            regionId: 1,
            fileId: 0,
        },
    ],
}

export function checkConnection() {
    const msgController = MessageController.Instance;
    test("check connection", () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE)
    })
}

describe(`PERF_REGION_SPECTRAL_PROFILE`,() => {
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);
    
    checkConnection();

    let basepath: string;
    test(`Get basepath`, async () => {
        let fileListResponse = await msgController.getFileList("$BASE",0);
        basepath = fileListResponse.directory;
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        let OpenFileResponse: CARTA.IOpenFileAck;
        test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async (done) => {
            assertItem.fileOpen[0].directory = basepath + "/" + assertItem.filelist.directory;
            OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
            
            let RegionHistogramData: CARTA.RegionHistogramData[] = [];
            let ex = msgController.histogramStream.pipe(take(1));
            ex.subscribe(data => {
                RegionHistogramData.push(data);
                expect(RegionHistogramData.length).toEqual(1);
                done();
            });
        },openFileTimeout);

        test(`(Step 1)"${assertItem.fileOpen[0].file}" SetCursor responses should arrive within ${readFileTimeout} ms`, (done)=>{
            msgController.setCursor(assertItem.initSetCursor);
            let SpatialProfileData: CARTA.SpatialProfileData[] = [];
            let response = msgController.spatialProfileStream.pipe(take(1));
            response.subscribe(data => {
                SpatialProfileData.push(data);
                expect(SpatialProfileData.length).toEqual(1);
                done();
            });
        },readFileTimeout)

        test(`(Step 1)"${assertItem.fileOpen[0].file}" RasterTileData and RasterTileSync`, (done) => {
            msgController.addRequiredTiles(assertItem.initTilesReq);
            let RasterTileDataTemp: CARTA.RasterTileData[] = [];
            let RasterTileSyncTemp: CARTA.RasterTileSync[] = [];
            msgController.rasterTileStream.subscribe({
                next: data => {
                    RasterTileDataTemp.push(data);
                },
                complete: () => {
                    expect(RasterTileDataTemp.length).toEqual(assertItem.initTilesReq.tiles.length);
                    done();
                },
            });
            msgController.rasterSyncStream.subscribe({
                next: data => {
                    RasterTileSyncTemp.push(data);
                    if (data.endSync){
                        expect(RasterTileSyncTemp.length).toEqual(2);
                        done();
                    }
                },
            });
        });

        test(`(Step 1)"${assertItem.fileOpen[0].file}" setSpatialRequest response`, (done) => {
            msgController.setSpatialRequirements(assertItem.initSpatialRequirements);
            let SpatialProfileData: CARTA.SpatialProfileData[] = [];
            let response = msgController.spatialProfileStream.pipe(take(1));
            response.subscribe(data => {
                SpatialProfileData.push(data);
                expect(SpatialProfileData.length).toEqual(1);
                done();
            });
        });

        test(`(Step 2)"${assertItem.fileOpen[0].file}" SET_REGION_ACK should arrive within ${readRegionTimeout} ms`, async() => {
            let setRegionAck = await msgController.setRegion(assertItem.setRegion[0]);
            expect(setRegionAck.success).toEqual(true);
        });

        test(`(Step 3)"${assertItem.fileOpen[0].file}" SPECTRAL_PROFILE_DATA stream should arrive within ${spectralProfileTimeout} ms`, (done) => {
            msgController.setSpectralRequirements(assertItem.setSpectralRequirements[0]);
            msgController.spectralProfileStream.subscribe({
                next: data => {
                    console.log(data);
                    if (data.progress === 1){
                        done();
                    }
                },
            });
        },spectralProfileTimeout);
    });

    afterAll(() => msgController.closeConnection());
});
