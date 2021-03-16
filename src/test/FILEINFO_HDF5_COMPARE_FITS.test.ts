import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    fileInfoRequest: CARTA.IFileInfoRequest[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    fileInfoRequest: 
    [
        {
            file: "M17_SWex.hdf5",
            hdu: "",
        },
        {
            file: "M17_SWex.fits",
            hdu: "",
        },
    ]
}