import { CARTA } from "carta-protobuf";
import { Client, IOpenFile } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let tmpdirectory: string = config.path.save;
let connectTimeout: number = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout: number = config.timeout.openFile;
let saveFileTimeout: number = config.timeout.saveFile;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    precisionDigit?: number;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    setRegion: CARTA.ISetRegion;
    saveFile: CARTA.ISaveFile[];
    exportedFileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels;
    errorMessage: string;
}

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    precisionDigit: 4,
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setRegion: 
    {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: -100.0, y: 35.0 }, { x: 50.0, y: 50.0 }],
            rotation: 0.0,
        },
    },
    saveFile: [
        {
            fileId: 0,
            outputFileName: "M17_SWex_error.fits",
            outputFileType: CARTA.FileType.FITS,
            regionId: 1,
            keepDegenerate: true,
        },
        {
            fileId: 0,
            outputFileName: "M17_SWex_error.image",
            outputFileType: CARTA.FileType.CASA,
            regionId: 1,
            keepDegenerate: true,
        },
    ],
    errorMessage:"The selected region is entirely outside the image"
}

describe("EXPORT_IMAGE_ERROR_MESSAGE: Exporting of a region out of the image", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.register);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        let basePath: string;
        beforeAll(async () => {
            await Connection.send(CARTA.FileListRequest, { directory: "$BASE" });
            basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
        }, listFileTimeout);

        test(`(Step 0) Connection open? | `, () => {
            expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
        });

        test(`(Step 1) OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
            await Connection.send(CARTA.CloseFile, { fileId: 0 });
            await Connection.openFile(assertItem.fileOpen);
        }, openFileTimeout);

        test(`(Step 2) Set a region`,async()=>{
            await Connection.send(CARTA.SetRegion,assertItem.setRegion);
            let SetRegionResponse = await Connection.receive(CARTA.SetRegionAck);
            expect(SetRegionResponse.success).toEqual(true);
        });

        assertItem.saveFile.map((SaveImageInput,index)=>{
            test(`Save imagd "${SaveImageInput.outputFileName}" & Check the error message:`,async()=>{
                await Connection.send(CARTA.SaveFile,{
                    outputFileDirectory: tmpdirectory,
                    ...SaveImageInput
                });
                let SaveImageResponse = await Connection.receive(CARTA.SaveFileAck);
                expect(SaveImageResponse.message).toContain(assertItem.errorMessage);
            },saveFileTimeout);
        });
    });
    afterAll(() => Connection.close());
});