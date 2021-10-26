import { CARTA } from "carta-protobuf";
import config from "./config.json";
import {MessageController, ConnectionStatus} from "./MessageController";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = 16000;//config.timeout.openFile
let readFileTimeout: number = config.timeout.readFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
}
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory + "/cube_B"},
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_B",
            file: "cube_B_09600_z00100.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [33558529, 33558528, 33554433, 33554432, 33562625, 33558530, 33562624, 33554434, 33562626],
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
}

export function checkConnection() {
    const msgController = MessageController.Instance;
    test("check connection", () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE)
    })
}

describe("PERF_LOAD_IMAGE",()=>{
    const msgController = MessageController.Instance;
    beforeAll(async ()=> {
        await msgController.connect(testServerUrl);
    }, connectTimeout);
    
    checkConnection();

    let basepath: string;
    test(`Get basepath`, async () => {
        let fileListResponse = await msgController.getFileList("$BASE");
        basepath = fileListResponse.directory;
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`,()=>{
        let OpenFileResponse: CARTA.IOpenFileAck;
        test(`(Step 1)"${assertItem.fileOpen[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async (done) => {
            assertItem.fileOpen[0].directory = basepath + "/" + assertItem.filelist.directory;
            OpenFileResponse = await msgController.loadFile(assertItem.fileOpen[0]);
            
            let RegionHistogramData: CARTA.RegionHistogramData[] = [];
            msgController.histogramStream.subscribe(data => {
                RegionHistogramData.push(data);
                expect(RegionHistogramData.length).toEqual(1);
                done();
            });
        },openFileTimeout);

        test(`(Step 1)"${assertItem.fileOpen[0].file}" SetCursor responses should arrive within ${readFileTimeout} ms`, (done)=>{
            msgController.setCursor(assertItem.initSetCursor);
            let SpatialProfileData: CARTA.SpatialProfileData[] = [];
            msgController.spatialProfileStream.subscribe(data => {
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

    });

    afterAll(() => msgController.closeConnection());
});
