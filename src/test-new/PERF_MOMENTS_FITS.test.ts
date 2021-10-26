import { CARTA } from "carta-protobuf";
import config from "./config.json";
import { checkConnection, Stream } from './myClient';
import { MessageController } from "./MessageController";


let testServerUrl = config.serverURL0;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout: number = 7000;//config.timeout.openFile;
let readFileTimeout = 5000;//config.timeout.readFile;
let momentTimeout = 400000;//config.timeout.moment;

interface AssertItem {
    precisionDigit: number;
    filelist: CARTA.IFileListRequest;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    momentRequest: CARTA.IMomentRequest;
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory},
    openFile: [
       {
           directory: testSubdirectory,
           file: "S255_IR_sci.spw25.cube.I.pbcor.fits",
           hdu: "0",
           fileId: 0,
           renderMode: CARTA.RenderMode.RASTER,
       },
    ],
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    setCursor: {
        fileId: 0,
        point: { x: 960, y: 960 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x"}, {coordinate:"y"}]
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 0,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
    momentRequest: {
        fileId: 0,
        regionId: 0,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 0, max: 400 },
        // spectralRange: { min: 73, max: 114 },
    },
};
const momentName = [
    "average", "integrated", "weighted_coord", "weighted_dispersion_coord",
    "median", "median_coord", "standard_deviation", "rms", "abs_mean_dev",
    "maximum", "maximum_coord", "minimum", "minimum_coord",
];

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

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        let OpenFileResponse: CARTA.IOpenFileAck;
        test(`(Step 1)"${assertItem.openFile[0].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async () => {
            assertItem.openFile[0].directory = basepath + "/" + assertItem.filelist.directory;
            OpenFileResponse = await msgController.loadFile(assertItem.openFile[0]);
            expect(OpenFileResponse.success).toEqual(true);

            let res1 = await Stream(CARTA.RegionHistogramData,1);
            console.log(res1)
            
        },openFileTimeout);

        test(`(Step 2)"${assertItem.openFile[0].file}" SetCursor & setSpatialRequest responses should arrive within ${readFileTimeout} ms`, async()=>{
            msgController.setCursor(assertItem.setCursor);
            let res2 = await Stream(CARTA.SpatialProfileData,1);
            console.log(res2)

            msgController.setSpatialRequirements(assertItem.setSpatialReq);
            let res3 = await Stream(CARTA.SpatialProfileData,1);
            console.log(res3)

        },readFileTimeout)

        let FileId: number[] = [];
        let MomentProgressData: any[] = [];
        let RegionHistogramData: any[] = []
        let MomentResponse: any[] = []
        describe(`Moment generator`,()=>{
            test(`(Step 3)"${assertItem.openFile[0].file}": Receive a series of moment progress within ${momentTimeout}ms`, async()=>{
                // would like to print out the progress, then modify the MessageController.ts
                // the RequestMoment will not return MomenResponse
                // the MomentResponse becomes a stream
                msgController.requestMoment(assertItem.momentRequest);
                MomentProgressData =  await Stream(CARTA.MomentProgress,9);
                // console.log(MomentProgressData);

                RegionHistogramData = await Stream(CARTA.RegionHistogramData,13);
                // console.log(RegionHistogramData);
                FileId = RegionHistogramData.map(data => data.fileId);
                // console.log(FileId)

                MomentResponse = await Stream(CARTA.MomentResponse,1);
                // console.log(MomentResponse);

                // let _count = 0
                // let resMomentProgressData = msgController.momentProgressStream.pipe(take(9));
                // resMomentProgressData.subscribe(data => {
                //     console.log(data);
                //     MomentProgressData.push(data);
                //     _count++
                //     if (_count === 9){
                //         console.log(MomentProgressData);
                //         // done();
                //     }
                // })

                // let resRegionHistogramData = msgController.histogramStream.pipe(take(13));
                // resRegionHistogramData.subscribe(data => {
                //     RegionHistogramData.push(data);
                // })

                // let resMomentResponse = msgController.momentResponseStream.pipe(take(1));
                // resMomentResponse.subscribe(data => {
                //     MomentResponse.push(data);
                //     // console.log(data);
                //     done();
                // })
            },momentTimeout);

            test(`Receive ${assertItem.momentRequest.moments.length} REGION_HISTOGRAM_DATA`, ()=>{
                expect(FileId.length).toEqual(assertItem.momentRequest.moments.length);
            });

            test(`Assert MomentResponse.success = true`,()=>{
                expect(MomentResponse[0].success).toBe(true);
            });

            test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest.moments.length}`,()=>{
                expect(MomentResponse[0].openFileAcks.length).toEqual(assertItem.momentRequest.moments.length);
            });

            test(`Assert all MomentResponse.openFileAcks[].success = true`,()=>{
                MomentResponse[0].openFileAcks.map(ack => {
                    expect(ack.success).toBe(true);
                })
            });

            test(`Assert all openFileAcks[].fileId > 0`,()=>{
                MomentResponse[0].openFileAcks.map(ack => {
                    expect(ack.fileId).toBeGreaterThan(0);
                });
            });

            test(`Assert openFileAcks[].fileInfo.name`,()=>{
                MomentResponse[0].openFileAcks.map((ack,index)=>{
                    expect(ack.fileInfo.name).toEqual(assertItem.openFile[0].file + ".moment." + momentName[index])
                });
            });
        });
    });

    afterAll(() => msgController.closeConnection());
})
