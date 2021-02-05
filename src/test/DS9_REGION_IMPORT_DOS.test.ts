import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let openfileTimeout = config.timeout.openFile;
let importTimeout = config.timeout.import;

interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    importRegion: CARTA.IImportRegion[];
    importRegionAck: CARTA.IImportRegionAck[];
};

let assertItem: AssertItem = {
    precisionDigits: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: regionSubdirectory,
        file: "1582287955_sdp_l0.GRB200219A_nouvcut_briggs-0.3.image.tt0",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    importRegion:
        [
            {
                groupId: 0,
                type: CARTA.FileType.DS9_REG,
                directory: regionSubdirectory,
                file: "GRB200219A_reg_dos.txt",
            },
            {
                groupId: 0,
                type: CARTA.FileType.DS9_REG,
                directory: regionSubdirectory,
                file: "GRB200219A_reg_unix.txt",
            },
        ],
    importRegionAck: [
        {
            success: true,
            regions: {
                'GRB 200219A': {
                    controlPoints: [
                        { x: 3358.922119140625, y: 3360.932861328125 },
                        { x: 1.8666666746139526, y: 1.8666666746139526 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                'background': {
                    controlPoints: [
                        { x: 3373.03369140625, y: 3334.0830078125 },
                        { x: 13.699333190917969, y: 13.699333190917969 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
            },
        },
        {
            success: true,
            regions: {
                'GRB 200219A': {
                    controlPoints: [
                        { x: 3358.922119140625, y: 3360.932861328125 },
                        { x: 1.8666666746139526, y: 1.8666666746139526 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
                'background': {
                    controlPoints: [
                        { x: 3373.03369140625, y: 3334.0830078125 },
                        { x: 13.699333190917969, y: 13.699333190917969 },
                    ],
                    regionType: CARTA.RegionType.ELLIPSE,
                    rotation: 0,
                },
            },
        },
    ],
};

describe("DS9_REGION_IMPORT_DOS: Testing import of DS9 region files made on DOS & UNIX platform", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${regionSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
            await Connection.openFile(assertItem.openFile);
        }, openfileTimeout);

        let importRegionAck: CARTA.ImportRegionAck[] = [];
        for (const [idxRegion, regionAck] of assertItem.importRegionAck.entries()) {
            describe(`Import "${assertItem.importRegion[idxRegion].file}"`, () => {
                test(`IMPORT_REGION_ACK${idxRegion} should return within ${importTimeout}ms`, async () => {
                    await Connection.send(CARTA.ImportRegion, assertItem.importRegion[idxRegion]);
                    importRegionAck.push(await Connection.receive(CARTA.ImportRegionAck) as CARTA.ImportRegionAck);
                }, importTimeout);

                test(`IMPORT_REGION_ACK${idxRegion}.success = ${regionAck.success}`, () => {
                    expect(importRegionAck[idxRegion].success).toBe(regionAck.success);
                });

                test(`Length of IMPORT_REGION_ACK${idxRegion}.region = ${Object.keys(regionAck.regions).length}`, () => {
                    expect(Object.keys(importRegionAck[idxRegion].regions).length).toEqual(Object.keys(regionAck.regions).length);
                });

            });
        }

        describe(`Assert both imported regions are equal`, () => {
            test(`IMPORT_REGION_ACK${0} = IMPORT_REGION_ACK${1}`, () => {
                for(let index; index<Object.keys(assertItem.importRegionAck[0].regions).length; index++){
                    expect(Object.keys(importRegionAck[0].regions)[index]).toMatchObject(Object.keys(importRegionAck[1].regions)[index]);
                }
            });
        });
    });

    afterAll(() => Connection.close());
});