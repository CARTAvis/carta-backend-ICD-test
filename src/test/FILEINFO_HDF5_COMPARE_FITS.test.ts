import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

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
            file: "SDC335.579-0.292.spw0.line.fits",
            hdu: "",
        },
        {
            file: "SDC335.579-0.292.spw0.line.hdf5",
            hdu: "",
        },
    ]
};

describe("FILEINFO_HDF5: Testing if info of an HDF5 image file is correctly delivered by the backend", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
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

        describe(`Open hdf5 then open fits, then compare`,()=>{

            let FileInfo_fits_Response: CARTA.FileInfoResponse;
            let fitsHeaderEntries: any;
            test(`Open fits`,async()=>{
                await Connection.send(CARTA.FileInfoRequest, {
                    directory: `${basePath}/` + testSubdirectory,
                    ...assertItem.fileInfoRequest[0],
                });
                FileInfo_fits_Response = await Connection.receive(CARTA.FileInfoResponse);
                fitsHeaderEntries =  FileInfo_fits_Response.fileInfoExtended['0'].headerEntries//.fileInfoExtended['0'].headerEntries);
            });

            let FileInfo_hdf5_Response: CARTA.FileInfoResponse;
            let hdf5HeaderEntries: any;
            test(`Open hdf5`,async()=>{
                await Connection.send(CARTA.FileInfoRequest, {
                    directory: `${basePath}/` + testSubdirectory,
                    ...assertItem.fileInfoRequest[1],
                });
                FileInfo_hdf5_Response = await Connection.receive(CARTA.FileInfoResponse);
                hdf5HeaderEntries = FileInfo_hdf5_Response.fileInfoExtended['0'].headerEntries//.fileInfoExtended['0'].headerEntries);
            });

            test(`Match each header entry of hdf5 to fits`,()=>{
                let hdf5HeaderArray = [];
                hdf5HeaderEntries.map((hdf5entry,index)=>{
                    hdf5HeaderArray.push(hdf5entry.name);
                });

                let fitsHeaderArray = [];
                fitsHeaderEntries.map((fitsentry,index)=>{
                    fitsHeaderArray.push(fitsentry.name);
                });

                let intersection = hdf5HeaderArray.filter(x => fitsHeaderArray.includes(x));

                let difference_hdf5 = hdf5HeaderArray.filter(x => !fitsHeaderArray.includes(x));
                if (difference_hdf5.length != 0){
                    console.warn("Additional header entries in hdf5:",difference_hdf5);
                }

                let difference_fits = fitsHeaderArray.filter(x => !hdf5HeaderArray.includes(x));
                if (difference_fits.length != 0){
                    console.warn("Additional header entries in fits:",difference_fits);
                }

                intersection.map((input,index)=>{
                   let hdf5Index = hdf5HeaderEntries.findIndex(x => x.name == input);
                   let fitsIndex = fitsHeaderEntries.findIndex(y => y.name == input);
                   expect(hdf5HeaderEntries[hdf5Index].value).toEqual(fitsHeaderEntries[fitsIndex].value)
                //    console.log(hdf5HeaderEntries[hdf5Index].value);
                //    console.log(fitsHeaderEntries[fitsIndex].value);
                });
            });
        });
    
    });
    afterAll(() => Connection.close());
});
