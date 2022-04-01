import { CARTA } from "carta-protobuf";
// import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
// const WebSocket = require('isomorphic-ws');
import {MessageController, ConnectionStatus} from "./MessageController";
import { take } from 'rxjs/operators';

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let playContourTimeout: number = 8000;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    initContour: CARTA.ISetContourParameters;
    setContour: CARTA.ISetContourParameters[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen:
        [
            {
                directory: testSubdirectory,
                file: "h_m51_b_s05_drz_sci.fits",
                hdu: "0",
                fileId: 0,
                renderMode: CARTA.RenderMode.RASTER,
            }
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
    initContour:{
        fileId:0,
        referenceFileId:0,
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 2,
            smoothingFactor: 4,
            levels: [0.1, 0.36, 0.72, 1.09, 1.46],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
};

export function checkConnection() {
    const msgController = MessageController.Instance;
    test("check connection", () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE)
    })
}

describe("PERF_CONTOUR_DATA",()=>{
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

        test(`(Step 2) smoothingMode of ${assertItem.setContour[0].smoothingMode} ContourImageData responses should arrive within ${playContourTimeout} ms`,async (done) => {
            msgController.setContourParameters(assertItem.setContour[0]);
            let countContour: number = 0;
            msgController.contourStream.subscribe({
                next: data => {
                    console.log(data);
                    if (data.progress === 1){
                        countContour++;
                        
                    };
                    if (countContour === 5){
                        done();
                    }
                },
            })
        });

    });

    afterAll(() => msgController.closeConnection());
});

// describe("PERF_CONTOUR_DATA", () => {
//     for (const [key,value] of assertItem.fileOpen.entries()) {
//         let cartaBackend: any;
//         describe(`for "${value.file}"`, () => {

//             let Connection: Client;
//             test(`CARTA is ready & Send a Session:`,async () => {
//                 Connection = new Client(testServerUrl);
//                 await Connection.open();
//                 await Connection.registerViewer(assertItem.registerViewer);
//                 await Connection.send(CARTA.CloseFile, { fileId: -1 });
//             }, connectTimeout);

//             describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
//                 describe(`With smoothingMode of "${assertItem.setContour[key].smoothingMode}"`, () => {
//                     test(`(Step 1) smoothingMode of ${assertItem.setContour[key].smoothingMode} OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
//                             let OpenAck = await Connection.openFile(value);
//                         // OpenFileAck | RegionHistogramData
//                     }, openFileTimeout);

//                     let ack: AckStream;
//                     test(`(Step 1) smoothingMode of ${assertItem.setContour[key].smoothingMode} SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
//                         await Connection.send(CARTA.AddRequiredTiles, assertItem.initTilesReq);
//                         await Connection.send(CARTA.SetCursor, assertItem.initSetCursor);
//                         await Connection.send(CARTA.SetSpatialRequirements, assertItem.initSpatialRequirements);

//                         ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
//                         expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
//                         expect(ack.RasterTileData.length).toEqual(assertItem.initTilesReq.tiles.length); //only 1 Tile returned
//                     }, readFileTimeout);

//                     let ack2: AckStream;
//                     test(`(Step 2) smoothingMode of ${assertItem.setContour[key].smoothingMode} ContourImageData responses should arrive within ${playContourTimeout} ms`, async () => {
//                         await Connection.send(CARTA.SetContourParameters,assertItem.initContour);
//                         await Connection.send(CARTA.SetContourParameters, assertItem.setContour[key]);
//                         let account = 0;

//                         while(account != assertItem.setContour[key].levels.length){
//                             let ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
//                             let ReceiveProgress: number = ContourImageDataTemp.progress;

//                             if(ReceiveProgress != 1){
//                                 while (ReceiveProgress < 1) {
//                                     ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
//                                     ReceiveProgress = ContourImageDataTemp.progress;
//                                     console.warn('' + ContourImageDataTemp.contourSets[0].level + ' ContourImageData progress with ' + assertItem.setContour[key].smoothingMode + ':', ReceiveProgress);
//                                 }
//                                 account=account+1;
//                             } else {
//                                 account=account+1;
//                             };
//                             console.log(account);
//                         };
//                         expect(account).toEqual(assertItem.setContour[key].levels.length)
//                     }, playContourTimeout);
//                 });
//             });
//             afterAll(async done => {
//                 await Connection.close();
//             }, 10000);
//         });
//     };
// });
    
    


