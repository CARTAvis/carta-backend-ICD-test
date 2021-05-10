import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

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
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            file: "M17_SWex_Partial.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    shapeSize: ['[640, 800, 16, 1]','[640, 800, 11, 1]']
};