import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');
import { execSync } from "child_process";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let tmpdirectory: string = config.path.save;
let connectTimeout: number = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout: number = config.timeout.openFile;
let saveFileTimeout: number = config.timeout.saveFile

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
    saveFileReq: CARTA.ISaveFile[];
    exportFileOpen: CARTA.IOpenFile[];
    shapeSize: string[]
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    saveFileReq:[
    {
        outputFileName: "M17_SWex_Partial.image",
        outputFileType: CARTA.FileType.CASA,
        fileId: 0,
        channels: [5, 20, 1],
        keepDegenerate: true,
    },
    {
        outputFileName: "M17_SWex_Partial.fits",
        outputFileType: CARTA.FileType.FITS,
        fileId: 0,
        channels: [5, 20, 1],
        keepDegenerate: true,
    },],
    exportFileOpen: [
        {
            file: "M17_SWex_Partial.image",
            hdu: "",
            fileId: 1,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            file: "M17_SWex_Partial.fits",
            hdu: "",
            fileId: 2,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    shapeSize: ['[640, 800, 16, 1]','[640, 800, 16, 1]']
};

describe("EXPORT IMAGE CHANNEL test: Exporting of a partial spectral range of an image cube", () => {

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

        assertItem.saveFileReq.map((SaveFileInput,index)=>{
            describe(`Save Image: ${SaveFileInput.outputFileName}`,()=>{
                test(`(Step 2) SAVE_FILE_ACK should arrive within ? ms | `, async() => {
                    await Connection.send(CARTA.SaveFile,{
                        outputFileDirectory: tmpdirectory,
                        ...SaveFileInput
                    });
                    let SaveFileResponse = await Connection.receive(CARTA.SaveFileAck);
                    expect(SaveFileResponse.success).toEqual(true);
                },saveFileTimeout);

                let responses_openFileAck: any;
                test(`(Step 3) Open the saved file, OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`,async()=>{
                    await Connection.send(CARTA.OpenFile,{
                        directory: tmpdirectory,
                        ...assertItem.exportFileOpen[index]});
                    let responses = await Connection.stream(2) as AckStream;
                    responses_openFileAck = responses.Responce[0];
                },openFileTimeout);

                test(`(Step 4) Mactch the returned message`,()=>{
                    expect(responses_openFileAck.fileInfoExtended.computedEntries.find(o => o.name == 'Shape').value).toEqual(assertItem.shapeSize[index]);

                    expect(responses_openFileAck).toMatchSnapshot({
                        fileInfoExtended: {
                            headerEntries: expect.any(Object)
                        },
                    });
                    responses_openFileAck.fileInfoExtended.headerEntries.map(item => {
                        if(item.name === "DATE"){
                            expect(item).toMatchSnapshot({
                                value: expect.any(String)
                            })
                        } else {
                            expect(item).toMatchSnapshot();
                        }
                    })
                })
            });
        });
    });
    
    afterAll(() => {
        Connection.close();
        describe(`Delete test image`,()=>{
            const output = execSync('rm -r /tmp/M17_SWex_Partial.image /tmp/M17_SWex_Partial.fits',{encoding: 'utf-8'});
            console.log(output);
        });
    });
});
