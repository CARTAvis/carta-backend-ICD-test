import { CARTA } from "carta-protobuf";
import config from "./config.json";
import {MessageController, ConnectionStatus} from "./MessageController";
import { take } from 'rxjs/operators';
import { identity } from "rxjs";

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = 5000;//config.timeout.openFile;
let readFileTimeout: number = 5000;//config.timeout.readFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setImageChannel: CARTA.ISetImageChannels[];
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
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33558529, 33558528, 33554433, 33554432, 33562625, 33558530, 33562624, 33554434, 33562626],
        },
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [67125252, 67129348, 67125253, 67129349, 67125251, 67121156, 67129347, 67121157, 67121155, 67133444, 67125254, 67133445, 67129350, 67133443, 67121158, 67125250, 67117060, 67129346, 67117061, 67121154, 67117059, 67133446, 67137540, 67125255, 67133442, 67117062, 67137541, 67129351, 67137539, 67121159, 67117058, 67125249, 67129345, 67137542, 67133447, 67121153, 67137538, 67117063, 67133441, 67125256, 67117057, 67129352, 67137543, 67121160, 67125248, 67133448, 67137537, 67129344, 67121152, 67117064, 67133440, 67117056, 67137544, 67137536],
            // tiles: [0],
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
            let ex = msgController.rasterTileStream;//.pipe(take(1));
            ex.subscribe({
                next:data => {RasterTileDataTemp.push(data);
                console.log(data)},
                complete: () => {
                    expect(RasterTileDataTemp.length).toEqual(1)
                }
            });

            let ex2 = msgController.rasterSyncStream;//.pipe(take(2));
            ex2.subscribe({
                next: data => {RasterTileSyncTemp.push(data)
                if (data.endSync){
                    done()
                }},
                // complete: () => {
                //     expect(RasterTileSyncTemp.length).toEqual(2);
                //     expect(RasterTileSyncTemp[RasterTileSyncTemp.length-1].endSync).toEqual(true);
                //     done();
                // }
            })
            // ex2.subscribe(val => {
            //     console.log(val);
            //     if(val.endSync){
            //         done();
            //     }
            // });

            // msgController.rasterTileStream.subscribe({
            //     next: data => {
            //         RasterTileDataTemp.push(data);
            //     },
            //     complete: () => {
            //         expect(RasterTileDataTemp.length).toEqual(assertItem.initTilesReq.tiles.length);
            //         done();
            //     },
            // });
            // msgController.rasterSyncStream.subscribe({
            //     next: data => {
            //         RasterTileSyncTemp.push(data);
            //         if (data.endSync){
            //             expect(RasterTileSyncTemp.length).toEqual(2);
            //             done();
            //         }
            //     },
            // });
        });

        test(`(Step 2)"${assertItem.fileOpen[0].file}" RasterTileData responses should arrive within ${readFileTimeout} ms`, (done) => {
            msgController.addRequiredTiles(assertItem.addTilesReq[1]);
            let RasterTileDataTemp2: CARTA.RasterTileData[] = [];
            let RasterTileSyncTemp2: CARTA.RasterTileSync[] = [];

            let ex3 = msgController.rasterTileStream;//.pipe(take(assertItem.addTilesReq[1].tiles.length));
            let tt3 = ex3.subscribe({
                next: data => {
                    RasterTileDataTemp2.push(data);
                    console.log(data);
                },
                complete: () => {
                    expect(RasterTileDataTemp2.length).toEqual(assertItem.addTilesReq[1].tiles.length)
                }
            });

            let ex4 = msgController.rasterSyncStream;//.pipe(take(2));
            ex4.subscribe({
                next: data => {
                    RasterTileSyncTemp2.push(data)
                    if(data.endSync){
                        done();
                    }
                },
                // complete: 
                // () => {
                //     expect(RasterTileSyncTemp2.length).toEqual(2);
                //     expect(RasterTileSyncTemp2[RasterTileSyncTemp2.length-1].endSync).toEqual(true);
                //     done();
                // }
            });

            // msgController.rasterTileStream.subscribe({
            //     next: data => {
            //         RasterTileDataTemp2.push(data);
            //     },
            //     complete: () => {
            //         expect(RasterTileDataTemp2.length).toEqual(assertItem.addTilesReq[1].tiles.length);
            //         done();
            //     },
            // });
            // msgController.rasterSyncStream.subscribe({
            //     next: data => {
            //         RasterTileSyncTemp2.push(data);
            //         console.log(RasterTileSyncTemp2);
            //         if (data.endSync){
            //             expect(RasterTileSyncTemp2.length).toEqual(2);
            //             done();
            //         }
            //     },
            // });
        })

    });

    afterAll(() => msgController.closeConnection());
});

// describe("PERF_RASTER_TILE_DATA", () => {
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
//                 describe(`open the file "${value.directory}/${assertItem.fileOpen[key].file}"`, () => {
//                     test(`(Step 1)"${assertItem.fileOpen[key].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
//                         let OpenAck = await Connection.openFile(value); // OpenFileAck | RegionHistogramData
//                     }, openFileTimeout);

//                     let ack: AckStream;
//                     test(`(Step 1)"${assertItem.fileOpen[key].file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
//                         await Connection.send(CARTA.SetCursor, assertItem.initSetCursor);
//                         await Connection.send(CARTA.SetSpatialRequirements, assertItem.initSpatialRequirements);
//                         await Connection.send(CARTA.AddRequiredTiles, assertItem.initTilesReq);

//                         ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
//                         expect(ack.RasterTileSync.length).toEqual(2); //RasterTileSync: start & end
//                         expect(ack.RasterTileData.length).toEqual(assertItem.initTilesReq.tiles.length); //only 1 Tile returned
//                     }, readFileTimeout);

//                     let ack2: AckStream;
//                     test(`(Step 2)"${assertItem.fileOpen[key].file}" RasterTileData responses should arrive within ${readFileTimeout} ms`, async () => {
//                         await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[1]);

//                         ack2 = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
//                         let ack2RasterTile = ack2.RasterTileData
//                         expect(ack2RasterTile.length).toBe(assertItem.addTilesReq[1].tiles.length)
//                     }, readFileTimeout);
//                 });
//             });
//             afterAll(async done => {
//                 await Connection.close();
//             }, 10000);
//         });
//     };
// });


