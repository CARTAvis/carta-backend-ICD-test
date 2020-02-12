import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config2.json";
import { async } from "q";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels[];
    cursor: CARTA.ISetCursor;
    setContour: CARTA.ISetContourParameters[];
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
            file: "h_m51_b_s05_drz_sci.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannel: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [33558529, 33558528, 33554433, 33554432, 33562625, 33558530, 33562624, 33554434, 33562626],
            },
        },
    ],
    cursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    setContour: [
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 2,
            smoothingFactor: 4,
            levels: [0.4314895888171266, 0.32135802071359154, 0.21122645261005651, 0.10109488450652149, -0.009036683597013595],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 0,
            smoothingFactor: 4,
            levels: [0.4314895888171266, 0.32135802071359154, 0.21122645261005651, 0.10109488450652149, -0.009036683597013595],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
        {
            fileId: 0,
            referenceFileId: 0,
            smoothingMode: 1,
            smoothingFactor: 4,
            levels: [0.4314895888171266, 0.32135802071359154, 0.21122645261005651, 0.10109488450652149, -0.009036683597013595],
            imageBounds: { xMin: 0, xMax: 8600, yMin: 0, yMax: 12200 },
            decimationFactor: 4,
            compressionLevel: 8,
            contourChunkSize: 100000,
        },
    ],
};

let number = new Array(assertItem.setContour.length).fill(1).map((_, i) => i);
let newnumber = [];

while (newnumber.length < 3) {
    let selnum = number[Math.floor(Math.random() * number.length)];
    number = number.filter(function (item) {
        return item !== selnum
    });
    newnumber.push(selnum);
};
console.log('New Contour smoothing sequence (random everytime):', newnumber);


describe("PERF_CONTOUR_DATA", () => {
    assertItem.setContour.map((ContourItem, index) => {
        let Connection: Client;
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        // test(`(Step 0) Connection Open?`, () => {
        //     expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        // });

        describe(`Go to "${assertItem.fileOpen[0].directory}" folder and open image "${assertItem.fileOpen[0].file}" with smoothing_mode of "${assertItem.setContour[newnumber[index]].smoothingMode}":": `, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1, });
                await Connection.send(CARTA.OpenFile, assertItem.fileOpen[0]);
                await Connection.receive(CARTA.OpenFileAck);
                await Connection.receive(CARTA.RegionHistogramData); // return OpenFileAck | RegionHistogramData (not sure the sequence)
            });

            test(`(Step 0) Connection Open?`, () => {
                expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            });

            let RasterTileDataTempTotal: any;
            let CursorResult: any;
            test(`(Step 1) Open file and Set "image channels" & "cursor:`, async () => {
                await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                RasterTileDataTempTotal = await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length);
                expect(RasterTileDataTempTotal.RasterTileData.length).toEqual(assertItem.setImageChannel[0].requiredTiles.tiles.length)

                await Connection.send(CARTA.SetCursor, assertItem.cursor);
                CursorResult = await Connection.receive(CARTA.SpatialProfileData);
            });

            test(`(Step 2) Set Contour Parameters:`, async () => {
                await Connection.send(CARTA.SetContourParameters, assertItem.setContour[newnumber[index]]);
                let ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
                let ReceiveProgress: number = ContourImageDataTemp.progress;

                if (ReceiveProgress != 1) {
                    while (ReceiveProgress < 1) {
                        ContourImageDataTemp = await Connection.receive(CARTA.ContourImageData);
                        ReceiveProgress = ContourImageDataTemp.progress
                        // console.warn('' + assertItem.fileOpen[0].file + ' ContourImageData progress :', ReceiveProgress)
                    };
                    expect(ReceiveProgress).toEqual(1);
                };
            })
        });
        afterAll(() => Connection.close());
    });
});