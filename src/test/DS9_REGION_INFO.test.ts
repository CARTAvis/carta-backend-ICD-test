import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let regionSubdirectory = config.path.region;
let connectTimeout = config.timeout.connection;
let listTimeout = config.timeout.listFile;
let readTimeout = config.timeout.readFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    precisionDigits: number;
    regionListRequest: CARTA.IRegionListRequest;
    regionListResponse: CARTA.IRegionListResponse;
    regionFileInfoRequest: CARTA.IRegionFileInfoRequest[];
    regionFileInfoResponse: CARTA.IRegionFileInfoResponse[];
};
let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        apiKey: "",
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        file: "M17_SWex.image",
        fileId: 0,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    precisionDigits: 4,
    regionListRequest:
    {
        directory: regionSubdirectory,
    },
    regionListResponse:
    {
        success: true,
        directory: regionSubdirectory,
        parent: testSubdirectory,
        subdirectories: [],
        files: [
            {
                name: "M17_SWex_regionSet1_pix.reg",
                type: CARTA.FileType.DS9_REG,
            },
            {
                name: "M17_SWex_regionSet1_world.reg",
                type: CARTA.FileType.DS9_REG,
            },
        ],
    },
    regionFileInfoRequest:
        [
            {
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet1_world.reg",
            },
            {
                directory: regionSubdirectory,
                file: "M17_SWex_regionSet1_pix.reg",
            },
        ],
    regionFileInfoResponse:
        [
            {
                success: true,
                fileInfo: {
                    name: "M17_SWex_regionSet1_world.reg",
                    type: CARTA.FileType.DS9_REG,
                },
                contents: [
                    `# Region file format: DS9 CARTA 1.4`,
                    `global color=green dashlist=8 3 width=1 font="helvetica 10 normal roman" select=1 highlite=1 dash=0 fixed=0 edit=1 move=1 delete=1 include=1 source=1`,
                    `icrs`,
                    `point(275.136531, -16.179095) # color=green width=1`,
                    `box(275.136788, -16.188550, 30.0324", 30.0324", 0) # color=green width=1`,
                    `box(275.138179, -16.201438, 54.8867", 21.7476", 0) # color=green width=1`,
                    `box(275.138415, -16.219327, 69.3851", 17.6052", 45) # color=green width=1`,
                    `circle(275.036788, -16.176650, 20.1942") # color=green width=1`,
                    `ellipse(275.037832, -16.193191, 11.9094", 27.9612", 90) # color=green width=1`,
                    `ellipse(275.038279, -16.206136, 7.2492", 31.5858", 135) # color=green width=1`,
                    `polygon(275.036928,-16.217211,275.041717,-16.234040,275.028537,-16.225982) # color=green width=1`,
                    `point(275.104182, -16.181545) # color=green width=1`,
                    `box(275.105086, -16.189555, 22.7832", 22.7832", 0) # color=green width=1`,
                    `box(275.109484, -16.199554, 48.6731", 14.4984", 0) # color=green width=1`,
                    `box(275.112957, -16.215665, 28.5588", 49.0627", 45) # color=green width=1`,
                    `circle(275.067040, -16.183415, 19.6764") # color=green width=1`,
                    `ellipse(275.062844, -16.198805, 10.3560", 27.9612", 90) # color=green width=1`,
                    `ellipse(275.064041, -16.213044, 8.8026", 32.1036", 135) # color=green width=1`,
                    `polygon(275.067644,-16.221824,275.076331,-16.234913,275.056707,-16.235343) # color=green width=1`,
                    ``,
                ],
            },
            {
                success: true,
                fileInfo: {
                    name: "M17_SWex_regionSet1_pix.reg",
                    type: CARTA.FileType.DS9_REG,
                },
                contents: [
                    `# Region file format: DS9 CARTA 1.4`,
                    `global color=green dashlist=8 3 width=1 font="helvetica 10 normal roman" select=1 highlite=1 dash=0 fixed=0 edit=1 move=1 delete=1 include=1 source=1`,
                    `physical`,
                    `point(-103.80, 613.10) # color=green width=1`,
                    `box(-106.40, 528.90, 75.10, 75.10, 0) # color=green width=1`,
                    `box(-118.00, 412.40, 137.20, 54.40, 0) # color=green width=1`,
                    `box(-120.60, 251.90, 173.50, 44.00, 45) # color=green width=1`,
                    `circle(758.30, 635.10, 50.50) # color=green width=1`,
                    `ellipse(749.30, 486.20, 29.80, 69.90, 90) # color=green width=1`,
                    `ellipse(745.40, 369.70, 18.10, 79.00, 135) # color=green width=1`,
                    `polygon(757.00, 270.10,715.60,118.60,829.50,191.10) # color=green width=1`,
                    `point(175.80, 591.10) # color=green width=1`,
                    `box(168.00, 519.90, 57.00, 57.00, 0) # color=green width=1`,
                    `box(130.50, 429.30, 121.70, 36.20, 0) # color=green width=1`,
                    `box(100.70, 284.30, 137.20, 36.20, 45) # color=green width=1`,
                    `circle(496.80, 574.30, 49.20) # color=green width=1`,
                    `ellipse(533.10, 435.70, 25.90, 69.90, 90) # color=green width=1`,
                    `ellipse(522.70, 307.60, 22.00, 80.30, 135) # color=green width=1`,
                    `polygon(491.60, 228.60,416.50,110.80,586.10,106.90) # color=green width=1`,
                    ``,
                ],
            },
        ],
};

describe("DS9_REGION_INFO: Testing DS9_REG region list and info", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder and open image "${assertItem.openFile.file}"`, () => {

        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1, });
            await Connection.openFile(assertItem.openFile);
        });

        describe(`Go to "${regionSubdirectory}" and send REGION_LIST_REQUEST`, () => {
            let regionListResponse: CARTA.RegionListResponse;
            test(`REGION_LIST_RESPONSE should return within ${listTimeout}ms`, async () => {
                await Connection.send(CARTA.RegionListRequest, assertItem.regionListRequest);
                regionListResponse = await Connection.receive(CARTA.RegionListResponse) as CARTA.RegionListResponse;
            }, listTimeout);

            test(`REGION_LIST_RESPONSE.success = ${assertItem.regionListResponse.success}`, () => {
                expect(regionListResponse.success).toBe(assertItem.regionListResponse.success);
            });

            test(`REGION_LIST_RESPONSE.directory = ${assertItem.regionListResponse.directory}`, () => {
                expect(regionListResponse.directory).toEqual(assertItem.regionListResponse.directory);
            });

            test(`REGION_LIST_RESPONSE.parent = ${assertItem.regionListResponse.parent}`, () => {
                expect(RegExp(`${regionListResponse.parent}$`).test(regionListResponse.parent)).toBe(true);
            });

            test(`REGION_LIST_RESPONSE.subdirectories = ${JSON.stringify(assertItem.regionListResponse.subdirectories)}`, () => {
                expect(regionListResponse.subdirectories).toEqual(assertItem.regionListResponse.subdirectories);
            });

            assertItem.regionListResponse.files.map(file => {
                test(`REGION_LIST_RESPONSE.file should contain "${file.name}" in type of ${CARTA.FileType[file.type]}`, () => {
                    expect(regionListResponse.files.find(f => f.name == file.name).type).toEqual(file.type);
                });
            });
        });

        assertItem.regionFileInfoResponse.map((fileInfo, idxInfo) => {
            describe(`Read "${assertItem.regionFileInfoRequest[idxInfo].file}"`, () => {
                let regionFileInfoResponse: CARTA.RegionFileInfoResponse;
                test(`REGION_FILE_INFO_RESPONSE should return within ${readTimeout}ms`, async () => {
                    await Connection.send(CARTA.RegionFileInfoRequest, assertItem.regionFileInfoRequest[idxInfo]);
                    regionFileInfoResponse = await Connection.receive(CARTA.RegionFileInfoResponse) as CARTA.RegionFileInfoResponse;
                }, readTimeout);

                test(`REGION_FILE_INFO_RESPONSE.success = ${fileInfo.success}`, () => {
                    expect(regionFileInfoResponse.success).toBe(fileInfo.success);
                });

                test(`REGION_FILE_INFO_RESPONSE.fileinfo.name = "${fileInfo.fileInfo.name}"`, () => {
                    expect(regionFileInfoResponse.fileInfo.name).toEqual(fileInfo.fileInfo.name);
                });

                test(`REGION_FILE_INFO_RESPONSE.fileinfo.type = ${CARTA.FileType[fileInfo.fileInfo.type]}`, () => {
                    expect(regionFileInfoResponse.fileInfo.type).toEqual(fileInfo.fileInfo.type);
                });

                test(`Length of REGION_FILE_INFO_RESPONSE.contents = ${fileInfo.contents.length}`, () => {
                    expect(regionFileInfoResponse.contents.length).toEqual(fileInfo.contents.length);
                });

                fileInfo.contents.map((message, index) => {
                    test(`REGION_FILE_INFO_RESPONSE.contents[${index}] = "${message.slice(0, 45)}${message.length < 45 ? "" : "..."}"`, () => {
                        expect(regionFileInfoResponse.contents[index]).toEqual(message);
                    });
                });
            });
        });
    });

    afterAll(() => Connection.close());
});