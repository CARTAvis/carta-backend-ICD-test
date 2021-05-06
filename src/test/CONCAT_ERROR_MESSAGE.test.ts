import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.concat_stokes;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let concatStokeTimeout = config.timeout.concatStokes;


interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    ConcatReq: CARTA.IConcatStokesFiles;
    ConcatResponse: string[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: "$BASE" },
    ConcatReq:{
        fileId: 0,
        renderMode: 0,
        stokesFiles:[
            {
                directory: testSubdirectory,
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.V.manual.pbcor.fits',
                stokesType: 4
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
                stokesType: 3
            },
        ],
    },
    ConcatResponse:[
        'is not allowed!',
        'are not consistent!'
    ]
};

describe("CONCAT_STOKES_IMAGES test: concatenate different stokes images into single image", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.register);
    }, connectTimeout);
    
    let basePath: string;
    describe(`Go to "${testSubdirectory}" folder`,()=>{
        describe(`Case 1: U & V`,()=>{
            test(`(Step 1) Assert FileListRequest |`, async()=>{
                await Connection.send(CARTA.FileListRequest,assertItem.filelist);
                basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
            });

            let ConcatStokesResponse: CARTA.ConcatStokesFilesAck;
            test(`(Step 2) Modify assert concatenate directory and request CONCAT_STOKES_FILES_ACK within ${concatStokeTimeout} ms | `,async()=>{
                assertItem.ConcatReq.stokesFiles.map((input,index)=>{
                    assertItem.ConcatReq.stokesFiles[index].directory = basePath + `/` + testSubdirectory; //`${basePath}/` + testSubdirectory;
                });

                await Connection.send(CARTA.CloseFile, { fileId: -1 });
                await Connection.send(CARTA.ConcatStokesFiles,assertItem.ConcatReq);
                ConcatStokesResponse = await Connection.receive(CARTA.ConcatStokesFilesAck);
                // console.log(ConcatStokesResponse.message);
                // console.log(assertItem.ConcatResponse[0])
                expect(ConcatStokesResponse.message).toContain(assertItem.ConcatResponse[0]);
            
            },concatStokeTimeout);
        });
    });
    afterAll(() => Connection.close());
});