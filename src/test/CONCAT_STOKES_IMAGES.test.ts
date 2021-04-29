import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.concat_stokes;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    fileInfoReq: CARTA.IFileInfoRequest[];
    ConcatReq: CARTA.IConcatStokesFiles;
    addTilesReq: CARTA.IAddRequiredTiles[];FileInfoResponse
    setCursor: CARTA.ISetCursor;
    setSpatialReq: CARTA.ISetSpatialRequirements;
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: "$BASE" },
    fileInfoReq:[
        {
            file:"IRCp10216_sci.spw0.cube.I.manual.pbcor.fits",
            hdu: "",
        },
        {
            file:"IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits",
            hdu: "",
        },
        {
            file:"IRCp10216_sci.spw0.cube.U.manual.pbcor.fits",
            hdu: "",
        },
        {
            file:"IRCp10216_sci.spw0.cube.V.manual.pbcor.fits",
            hdu: "",
        },
    ],
    ConcatReq:{
        fileId: 0,
        renderMode: 0,
        stokesFiles:[
            {
                directory:"home/mingyi/carta-test-img/set_StokesCube",//testServerUrl,
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.V.manual.pbcor.fits',
                stokesType: 4
            },
            {
                directory:"home/mingyi/carta-test-img/set_StokesCube",//testServerUrl,
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
                stokesType: 3
            },
            {
                directory:"home/mingyi/carta-test-img/set_StokesCube",//testServerUrl,
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                stokesType: 2
            },
            // '0':{
            //     directory:testSubdirectory,
            //     hdu:"",
            //     file:'IRCp10216_sci.spw0.cube.V.manual.pbcor.fits',
            //     stokesType: 4,
            // },
            // '1':{}
        ],
    },
};

describe("CONCAT_STOKES_IMAGES test: ", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.register);
    }, connectTimeout);

    test(`(Step 0) Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });
    
    let basePath: string;
    describe(`Go to "${testSubdirectory}" folder`,()=>{
        test(`(Step 1) Assert FileListRequest |`, async()=>{
            await Connection.send(CARTA.FileListRequest,assertItem.filelist);
            basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
        });

        let FileInfoResponse: CARTA.FileInfoResponse;
        assertItem.fileInfoReq.map((input,index)=>{
            test(`FILE_INFO_RESPONSE-${index} should arrive within ${openFileTimeout} ms".`, async () => {
                await Connection.send(CARTA.FileInfoRequest, {
                    directory: `${basePath}/` + testSubdirectory,
                    ...input,
                });
                FileInfoResponse = await Connection.receive(CARTA.FileInfoResponse);
                console.log(FileInfoResponse.fileInfoExtended);
            }, openFileTimeout);
        });

        test(`(Step 2)`,async()=>{
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.send(CARTA.ConcatStokesFiles,assertItem.ConcatReq);
            let tt2 = await Connection.receiveAny();
            let tt3 = await Connection.receiveAny();
            console.log(tt2);
            console.log(tt3);
        });
});

    afterAll(() => Connection.close());
});