import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.performance;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = 80000;//config.timeout.readFile;
let readRegionTimeout: number = config.timeout.region;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile[];
    setImageChannel: CARTA.ISetImageChannels[];
    setCursor: CARTA.ISetCursor[];
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
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z02000.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z04000.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z01000.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z02000.fits",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z04000.fits",
            hdu: "",
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
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z04000.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z01000.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z02000.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z04000.image",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z01000.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z02000.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_01600_z04000.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z01000.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z02000.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory + "/cube_A",
            file: "cube_A_03200_z04000.hdf5",
            hdu: "",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    setImageChannel: [
        {
            fileId: 0,
            channel: 0,
            stokes: 0,
            requiredTiles: {
                fileId: 0,
                compressionType: CARTA.CompressionType.ZFP,
                compressionQuality: 11,
                tiles: [0],
            },
        },
    ],
    setCursor: [
        {
            fileId: 0,
            point: { x: 0, y: 0 },
        },
    ],
    setRegion: [
        {
            controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 800, y: 800 }, { x: 400, y: 400 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
        },
        {
            controlPoints: [{ x: 1600, y: 1600 }, { x: 800, y: 800 }],
            fileId: 0,
            regionId: -1,
            regionType: 3,
            regionName: "",
            rotation: 0,
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

            describe(`open the file "${fileOpen.directory}/${assertItem.fileOpen[index].file}"`, () => {
                test(`(Step 1)"${assertItem.fileOpen[index].file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.OpenFile, fileOpen);
                    await Connection.receiveAny()
                    await Connection.receiveAny() // OpenFileAck | RegionHistogramData
                }, openFileTimeout);

                let ack: AckStream;
                test(`(Step 1)"${assertItem.fileOpen[index].file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetImageChannels, assertItem.setImageChannel[0]);
                    await Connection.send(CARTA.SetCursor, assertItem.setCursor[0]);
                    // await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length);
                    ack = await Connection.stream(assertItem.setImageChannel[0].requiredTiles.tiles.length + 2) as AckStream;
                    // console.log(ack)
                }, readFileTimeout);

                test(`(Step 2)"${assertItem.fileOpen[index].file}" SET_REGION_ACK should arrive within ${readRegionTimeout} ms`, async () => {
                    await Connection.send(CARTA.SetRegion, assertItem.setRegion[index]);
                    await Connection.receive(CARTA.SetRegionAck);
                }, readRegionTimeout);

                let ack3: AckStream;
                test(`(Step 3)"${assertItem.fileOpen[index].file}" SPECTRAL_PROFILE_DATA stream should arrive within ${readFileTimeout} ms`, async () => {
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
                }, readFileTimeout);

            });

        });
        afterAll(() => Connection.close());
    });

});
