import { CARTA } from "carta-protobuf";
import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL0;
let testSubdirectory: string = config.path.concat_stokes;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let concatStokeTimeout = config.timeout.concatStokes;

interface ConcatStokesFilesAckExt extends CARTA.IConcatStokesFilesAck {
    OpenFileAckBeamLength: number
}

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    fileInfoReq: CARTA.IFileInfoRequest[];
    ConcatReq: CARTA.IConcatStokesFiles;
    ConcatReqIV: CARTA.IConcatStokesFiles;
    ConcatReqQU: CARTA.IConcatStokesFiles;
    ConcatReqIQU: CARTA.IConcatStokesFiles;
    ConcatReqQUV: CARTA.IConcatStokesFiles;
    ConcatResponse: ConcatStokesFilesAckExt[];
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
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                stokesType: 2
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.I.manual.pbcor.fits',
                stokesType: 1
            },
        ],
    },
    ConcatReqIV: {
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
                file:'IRCp10216_sci.spw0.cube.I.manual.pbcor.fits',
                stokesType: 1
            },
        ],
    },
    ConcatReqQU: {
        fileId: 0,
        renderMode: 0,
        stokesFiles:[
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
                stokesType: 3
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                stokesType: 2
            },
        ],
    },
    ConcatReqIQU: 
    {
        fileId: 0,
        renderMode: 0,
        stokesFiles:[
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.U.manual.pbcor.fits',
                stokesType: 3
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                stokesType: 2
            },
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.I.manual.pbcor.fits',
                stokesType: 1
            },
        ],
    },
    ConcatReqQUV: {
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
            {
                directory: testSubdirectory, 
                hdu:"",
                file:'IRCp10216_sci.spw0.cube.Q.manual.pbcor.fits',
                stokesType: 2
            },
        ],
    },
    ConcatResponse:[
    {
        success: true,
        openFileAck: {
            success: true,
            fileInfo: {
                name:"IRCp10216_sci.spw0.cube.hypercube_IQUV.manual.pbcor.fits"
            },
            fileInfoExtended:{
                depth: 480,
                dimensions: 4,
                height: 256,
                stokes: 4,
                width: 256,
            },
        },
        OpenFileAckBeamLength: 1920,
    },
    {
        success: true,
        openFileAck: {
            success: true,
            fileInfo: {
                name:"IRCp10216_sci.spw0.cube.hypercube_IV.manual.pbcor.fits"
            },
            fileInfoExtended:{
                depth: 480,
                dimensions: 4,
                height: 256,
                stokes: 2,
                width: 256,
            },
        },
        OpenFileAckBeamLength: 960,
    },
    {
        success: true,
        openFileAck: {
            success: true,
            fileInfo: {
                name:"IRCp10216_sci.spw0.cube.hypercube_QU.manual.pbcor.fits"
            },
            fileInfoExtended:{
                depth: 480,
                dimensions: 4,
                height: 256,
                stokes: 2,
                width: 256,
            },
        },
        OpenFileAckBeamLength: 960,
    }
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
        describe(`Case 1: Combine I,Q,U,V |`,()=>{
            test(`(Step 1) Assert FileListRequest |`, async()=>{
                await Connection.send(CARTA.FileListRequest,assertItem.filelist);
                basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
            });

            let FileInfoResponse: CARTA.FileInfoResponse;
            assertItem.fileInfoReq.map((input,index)=>{
                test(`FILE_INFO_RESPONSE-${index+1} should arrive within ${openFileTimeout} ms" | `, async () => {
                    await Connection.send(CARTA.FileInfoRequest, {
                        directory: `${basePath}/` + testSubdirectory,
                        ...input,
                    });
                    FileInfoResponse = await Connection.receive(CARTA.FileInfoResponse);
                    expect(FileInfoResponse.success).toEqual(true);
                }, openFileTimeout);
            });

            let ConcatStokesResponse: CARTA.ConcatStokesFilesAck;
            test(`(Step 2) Modify assert concatenate directory and request CONCAT_STOKES_FILES_ACK within ${concatStokeTimeout} ms | `,async()=>{
                assertItem.ConcatReq.stokesFiles.map((input,index)=>{
                    assertItem.ConcatReq.stokesFiles[index].directory = basePath + `/` + testSubdirectory; //`${basePath}/` + testSubdirectory;
                });

                await Connection.send(CARTA.CloseFile, { fileId: -1 });
                await Connection.send(CARTA.ConcatStokesFiles,assertItem.ConcatReq);
                await Connection.receive(CARTA.RegionHistogramData);
                ConcatStokesResponse = await Connection.receive(CARTA.ConcatStokesFilesAck);
                // console.log(ConcatStokesResponse);
            
            },concatStokeTimeout);

            test(`(Step 3) Check CONCAT_STOKES_FILES_ACK response | `,()=>{
                expect(ConcatStokesResponse.success).toEqual(assertItem.ConcatResponse[0].success);
                expect(ConcatStokesResponse.openFileAck.success).toEqual(assertItem.ConcatResponse[0].openFileAck.success);
                expect(ConcatStokesResponse.openFileAck.beamTable.length).toEqual(assertItem.ConcatResponse[0].OpenFileAckBeamLength);
                expect(ConcatStokesResponse.openFileAck.fileInfo.name).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfo.name);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.dimensions).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.dimensions);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.stokes).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.stokes);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.width).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.width);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.height).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.height);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.depth).toEqual(assertItem.ConcatResponse[0].openFileAck.fileInfoExtended.depth);
            })
        });

        describe(`Case 2: Combine I & V |`,()=>{
            test(`(Step 1) Assert FileListRequest |`, async()=>{
                await Connection.send(CARTA.FileListRequest,assertItem.filelist);
                basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
            });

            let FileInfoResponse: CARTA.FileInfoResponse;
            let inputIndex = [0,3];
            inputIndex.map((input,index)=>{
                test(`FILE_INFO_RESPONSE-${index+1} should arrive within ${openFileTimeout} ms" | `, async () => {
                    await Connection.send(CARTA.FileInfoRequest, {
                        directory: `${basePath}/` + testSubdirectory,
                        ...assertItem.fileInfoReq[input],
                    });
                    FileInfoResponse = await Connection.receive(CARTA.FileInfoResponse);
                    expect(FileInfoResponse.success).toEqual(true);
                }, openFileTimeout);
            });

            let ConcatStokesResponse: CARTA.ConcatStokesFilesAck;
            test(`(Step 2) Modify assert concatenate directory and request CONCAT_STOKES_FILES_ACK within ${concatStokeTimeout} ms | `,async()=>{
                assertItem.ConcatReqIV.stokesFiles.map((input,index)=>{
                    assertItem.ConcatReqIV.stokesFiles[index].directory = basePath + `/` + testSubdirectory; //`${basePath}/` + testSubdirectory;
                });

                await Connection.send(CARTA.CloseFile, { fileId: -1 });
                await Connection.send(CARTA.ConcatStokesFiles,assertItem.ConcatReqIV);
                await Connection.receive(CARTA.RegionHistogramData);
                ConcatStokesResponse = await Connection.receive(CARTA.ConcatStokesFilesAck);
                // console.log(ConcatStokesResponse);
            
            },concatStokeTimeout);

            test(`(Step 3) Check CONCAT_STOKES_FILES_ACK response | `,()=>{
                expect(ConcatStokesResponse.success).toEqual(assertItem.ConcatResponse[1].success);
                expect(ConcatStokesResponse.openFileAck.success).toEqual(assertItem.ConcatResponse[1].openFileAck.success);
                expect(ConcatStokesResponse.openFileAck.beamTable.length).toEqual(assertItem.ConcatResponse[1].OpenFileAckBeamLength);
                expect(ConcatStokesResponse.openFileAck.fileInfo.name).toEqual(assertItem.ConcatResponse[1].openFileAck.fileInfo.name);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.dimensions).toEqual(assertItem.ConcatResponse[1].openFileAck.fileInfoExtended.dimensions);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.stokes).toEqual(assertItem.ConcatResponse[1].openFileAck.fileInfoExtended.stokes);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.width).toEqual(assertItem.ConcatResponse[1].openFileAck.fileInfoExtended.width);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.height).toEqual(assertItem.ConcatResponse[1].openFileAck.fileInfoExtended.height);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.depth).toEqual(assertItem.ConcatResponse[1].openFileAck.fileInfoExtended.depth);
            })
        });

        describe(`Case 3: Combine Q & U |`,()=>{
            test(`(Step 1) Assert FileListRequest |`, async()=>{
                await Connection.send(CARTA.FileListRequest,assertItem.filelist);
                basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
            });

            let FileInfoResponse: CARTA.FileInfoResponse;
            let inputIndex = [1,2];
            inputIndex.map((input,index)=>{
                test(`FILE_INFO_RESPONSE-${index+1} should arrive within ${openFileTimeout} ms" | `, async () => {
                    await Connection.send(CARTA.FileInfoRequest, {
                        directory: `${basePath}/` + testSubdirectory,
                        ...assertItem.fileInfoReq[input],
                    });
                    FileInfoResponse = await Connection.receive(CARTA.FileInfoResponse);
                    expect(FileInfoResponse.success).toEqual(true);
                }, openFileTimeout);
            });

            let ConcatStokesResponse: CARTA.ConcatStokesFilesAck;
            test(`(Step 2) Modify assert concatenate directory and request CONCAT_STOKES_FILES_ACK within ${concatStokeTimeout} ms | `,async()=>{
                assertItem.ConcatReqQU.stokesFiles.map((input,index)=>{
                    assertItem.ConcatReqQU.stokesFiles[index].directory = basePath + `/` + testSubdirectory; //`${basePath}/` + testSubdirectory;
                });

                await Connection.send(CARTA.CloseFile, { fileId: -1 });
                await Connection.send(CARTA.ConcatStokesFiles,assertItem.ConcatReqQU);
                await Connection.receive(CARTA.RegionHistogramData);
                ConcatStokesResponse = await Connection.receive(CARTA.ConcatStokesFilesAck);
                // console.log(ConcatStokesResponse);
            
            },concatStokeTimeout);

            test(`(Step 3) Check CONCAT_STOKES_FILES_ACK response | `,()=>{
                expect(ConcatStokesResponse.success).toEqual(assertItem.ConcatResponse[2].success);
                expect(ConcatStokesResponse.openFileAck.success).toEqual(assertItem.ConcatResponse[2].openFileAck.success);
                expect(ConcatStokesResponse.openFileAck.beamTable.length).toEqual(assertItem.ConcatResponse[2].OpenFileAckBeamLength);
                expect(ConcatStokesResponse.openFileAck.fileInfo.name).toEqual(assertItem.ConcatResponse[2].openFileAck.fileInfo.name);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.dimensions).toEqual(assertItem.ConcatResponse[2].openFileAck.fileInfoExtended.dimensions);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.stokes).toEqual(assertItem.ConcatResponse[2].openFileAck.fileInfoExtended.stokes);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.width).toEqual(assertItem.ConcatResponse[2].openFileAck.fileInfoExtended.width);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.height).toEqual(assertItem.ConcatResponse[2].openFileAck.fileInfoExtended.height);
                expect(ConcatStokesResponse.openFileAck.fileInfoExtended.depth).toEqual(assertItem.ConcatResponse[2].openFileAck.fileInfoExtended.depth);
            })
        });

    });
    afterAll(() => Connection.close());
});