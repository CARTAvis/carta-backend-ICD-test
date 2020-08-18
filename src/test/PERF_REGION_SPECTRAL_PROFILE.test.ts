import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config2.json";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
let readRegionTimeout: number = config.timeout.region;
let spectralProfileTimeout: number = 120000;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    // setImageChannel: CARTA.ISetImageChannels[];
    // setCursor: CARTA.ISetCursor[];
    initTilesReq: CARTA.IAddRequiredTiles;
    initSetCursor: CARTA.ISetCursor;
    initSpatialRequirements: CARTA.ISetSpatialRequirements;
    setRegion: CARTA.ISetRegion[];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: [
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z01000.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z02000.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z04000.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z01000.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z02000.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z04000.fits",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z01000.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z02000.image",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z04000.image",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z01000.image",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z02000.image",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z04000.image",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z01000.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z02000.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z04000.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z01000.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z02000.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z04000.hdf5",
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    initTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },
    initSetCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: ["x", "y"],
    },
    setRegion: [
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                rotation: 0,
                regionType: 3,

            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
        {
            fileId: 0,
            regionId: -1,
            regionInfo:{
                controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
                regionType: 3,
                rotation: 0,
            },
            // regionName: "",
        },
    ],
    setSpectralRequirements: [
        {
            spectralProfiles: [{ coordinate: "z", statsTypes: [4] },],
            regionId: 1,
            fileId: 0,
        },
    ],
}

describe("PERF_REGION_SPECTRAL_PROFILE", () => {

    assertItem.fileOpen.map((fileOpen: CARTA.IOpenFile, index) => {
        let Connection: Client;
        beforeAll(async () => {
            Connection = new Client(testServerUrl);
            await Connection.open();
            await Connection.send(CARTA.RegisterViewer, assertItem.register);
            await Connection.receive(CARTA.RegisterViewerAck);
        }, connectTimeout);

        describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
            beforeAll(async () => {
                await Connection.send(CARTA.CloseFile, { fileId: -1 });
            }, connectTimeout);

            // test(`(Step 0) Connection open? | `, () => {
            //     expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
            // });

            describe(`open the file "${fileOpen.directory}/${assertItem.fileOpen[index].file}"`, () => {
                test(`(Step 1)"${assertItem.fileOpen[index].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.OpenFile, fileOpen);
                    let temp = await Connection.receiveAny()
                    // console.log(temp);
                    let temp2 = await Connection.receiveAny() // OpenFileAck | RegionHistogramData
                    // console.log(temp2);
                }, openFileTimeout);

                let ack: AckStream;
                test(`(Step 1)"${assertItem.fileOpen[index].file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.AddRequiredTiles, assertItem.initTilesReq);
                    await Connection.send(CARTA.SetCursor, assertItem.initSetCursor);
                    await Connection.send(CARTA.SetSpatialRequirements, assertItem.initSpatialRequirements);

                    ack = await Connection.stream(assertItem.initTilesReq.tiles.length + 3) as AckStream;
                    console.log(ack)
                }, readFileTimeout);

                test(`(Step 2)"${assertItem.fileOpen[index].file}" SET_REGION_ACK should arrive within ${readRegionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetRegion, assertItem.setRegion[index]);
                    await Connection.receive(CARTA.SetRegionAck);
                }, readRegionTimeout);

                let ack3: AckStream;
                test(`(Step 3)"${assertItem.fileOpen[index].file}" SPECTRAL_PROFILE_DATA stream should arrive within ${spectralProfileTimeout} ms`, async () => {
                    // await sleep(sleepTimeout);
                    await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements[0]);

                    let SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                    let ReceiveProgress: number = SpectralProfileDataTemp.progress;
                    console.warn('' + assertItem.fileOpen[index].file + ' SpectralProfileData progress :', ReceiveProgress)


                    if (ReceiveProgress != 1) {
                        while (ReceiveProgress < 1) {
                            SpectralProfileDataTemp = await Connection.receive(CARTA.SpectralProfileData);
                            ReceiveProgress = SpectralProfileDataTemp.progress
                            console.warn('' + assertItem.fileOpen[index].file + ' SpectralProfileData progress :', ReceiveProgress)
                        };
                        expect(ReceiveProgress).toEqual(1);
                    };
                }, spectralProfileTimeout);

            });

        });
        afterAll(() => Connection.close());
    });

});
