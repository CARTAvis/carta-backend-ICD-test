import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
import { async } from "q";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let playImageTimeout: number = config.timeout.playImages;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    setContour: CARTA.ISetContourParameters[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "h_m51_b_s05_drz_sci.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: [
        {
            fileId: 0,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [33558529, 33558528, 33554433, 33562625, 33554432, 33562624, 33558530, 33554434, 33562626],
        },
    ],
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setSpatialReq: {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"]
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 0,
            smoothingFactor: 4,
            levels: [1.1014473195533452, 1.9245819583813286, 2.747716597209312, 3.5708512360372953, 4.393985874865279],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            levels: [1.1014473195533452, 1.9245819583813286, 2.747716597209312, 3.5708512360372953, 4.393985874865279],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
};

describe("PER_CONTOUR_2D", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.register);
        await Connection.receive(CARTA.RegisterViewerAck);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        }, connectTimeout);

        describe(`(Step 1) Initialize the open image"`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen);
                await Connection.receiveAny()
                await Connection.receiveAny() // OpenFileAck | RegionHistogramData
            }, openFileTimeout);

            let Ack: AckStream;
            test(`Initialised WCS info from frame: ADD_REQUIRED_TILES, SET_CURSOR, and SET_SPATIAL_REQUIREMENTS, then check them are all returned correctly:`, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[0]);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);
                await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq);
                Ack = await Connection.stream(12) as AckStream;; // RasterTileData * 9 + SpatialProfileData * 1 + RasterTileSync * 2(start & end)
                expect(Ack.RasterTileData.length).toEqual(assertItem.addTilesReq[0].tiles.length);
                // console.log(Ack)
            }, playImageTimeout);
        });

        describe(`(Contour Tests)`, () => {
            test(`(Step 2) Set Default Contour Parameters:`, async () => {
                await Connection.send(CARTA.SetContourParameters, assertItem.setContour[0]);
                for (let i = 0; i < assertItem.setContour[0].levels.length; i++) {
                    let ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
                    let ReceiveProgress: number = ContourImageDataTemp.progress;

                    if (ReceiveProgress != 1) {
                        while (ReceiveProgress < 1) {
                            ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
                            ReceiveProgress = ContourImageDataTemp.progress
                            console.warn('' + assertItem.fileOpen.file + ' ContourImageData progress :', ReceiveProgress)
                        };
                        expect(ReceiveProgress).toEqual(1);
                    };
                    // console.log(ContourImageDataTemp);
                };
            });

            let SM_number = new Array(2).fill(1).map((_, i) => i + 1);
            let newnumber = [];
            while (newnumber.length < 2) {
                let selnum = SM_number[Math.floor(Math.random() * SM_number.length)];
                SM_number = SM_number.filter(function (item) {
                    return item !== selnum
                });
                newnumber.push(selnum);
            };
            console.log('New Contour smoothing mode (random between 0 and 1):', newnumber);

            let SF_number = new Array(5).fill(1).map((_, i) => i + 1);
            let newnumber2 = [];
            while (newnumber2.length < 2) {
                let selnum = SF_number[Math.floor(Math.random() * SF_number.length)];
                SF_number = SF_number.filter(function (item) {
                    return item !== selnum
                });
                newnumber2.push(selnum);
            };
            console.log('New Contour smoothing factor (random between 1 and 5):', newnumber2);

            test(`(Step 3) Change Smooth Mode and Smooth Factor with random number:`, async () => {
                await Connection.send(CARTA.SetContourParameters,
                    { ...assertItem.setContour[1], smoothingMode: newnumber[0], smoothingFactor: newnumber2[0] }
                );
                for (let i = 0; i < assertItem.setContour[0].levels.length; i++) {
                    let ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
                    let ReceiveProgress: number = ContourImageDataTemp.progress;

                    if (ReceiveProgress != 1) {
                        while (ReceiveProgress < 1) {
                            ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
                            ReceiveProgress = ContourImageDataTemp.progress
                            console.warn('' + assertItem.fileOpen.file + ' ContourImageData progress :', ReceiveProgress)
                        };
                        expect(ReceiveProgress).toEqual(1);
                    };
                    // console.log(ContourImageDataTemp);
                };
            });



        });

    });


    afterAll(() => Connection.close());

});