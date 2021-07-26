import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;
let cursorTimeout = config.timeout.cursor;
let profileTimeout = config.timeout.spectralProfile;
interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    addTilesReq: CARTA.IAddRequiredTiles[];
    setCursor: CARTA.ISetCursor[];
    setSpatialReq: CARTA.ISetSpatialRequirements[];
    setSpectralRequirements: CARTA.ISetSpectralRequirements[];
    setRegion: CARTA.ISetRegion[];
}
let assertItem: AssertItem = {
    precisionDigits: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: [
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.fits",
            fileId: 100,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_13CO_2-1.fits",
            fileId: 101,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_C18O_2-1.fits",
            fileId: 102,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "HD163296_CO_2_1.image",
            fileId: 103,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    addTilesReq: [
        {
            fileId: 100,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 101,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 102,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
        {
            fileId: 103,
            compressionQuality: 11,
            compressionType: CARTA.CompressionType.ZFP,
            tiles: [0],
        },
    ],
    setCursor: [
        {
            fileId: 100,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 101,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 102,
            point: { x: 200.0, y: 200.0 },
        },
        {
            fileId: 103,
            point: { x: 200.0, y: 200.0 },
        },
    ],
    setSpatialReq: [
        {
            fileId: 100,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
        {
            fileId: 101,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
        {
            fileId: 102,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
        {
            fileId: 103,
            regionId: 0,
            spatialProfiles: [{coordinate:"x", mip:1}, {coordinate:"y", mip:1}]
        },
    ],
    setSpectralRequirements: [
        {
            fileId: 100,
            regionId: 1,
            spectralProfiles: [{ coordinate: "z", statsTypes: [2] }],
        },
        {
            fileId: 101,
            regionId: 1,
            spectralProfiles: [{ coordinate: "z", statsTypes: [2] }],
        },
        {
            fileId: 102,
            regionId: 1,
            spectralProfiles: [{ coordinate: "z", statsTypes: [2] }],
        },
        {
            fileId: 103,
            regionId: 1,
            spectralProfiles: [{ coordinate: "z", statsTypes: [2] }],
        },
    ],
    setRegion: [
        {
            fileId: 100,
            regionId: 1,
            regionInfo: {
                regionType: 3,
                rotation: 0,
                controlPoints: [{ x: 200, y: 200 }, { x: 200, y: 200 }],
            },
        },
        {
            fileId: 100,
            regionId: 1,
            regionInfo: {
                regionType: 3,
                rotation: 30,
                controlPoints: [{ x: 200, y: 200 }, { x: 200, y: 200 }],
            },
        },
    ],
};

describe("MATCH_SPECTRAL: Test region spectral profile with spatially and spectrally matched images", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Prepare images`, () => {
        for (const file of assertItem.openFile) {
            test(`Should open image ${file.file} as file_id: ${file.fileId}`, async () => {
                await Connection.openFile(file);
            }, openFileTimeout);
        }
        for (const [index, cursor] of assertItem.setCursor.entries()) {
            let ack: AckStream;
            test(`Prepare image ${index}`, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq[index]);
                await Connection.send(CARTA.SetCursor, cursor);
                await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialReq[index]);
                // await Connection.receiveAny();
                ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
            }, cursorTimeout);
        }
        test(`Should set region 1`, async () => {
            await Connection.send(CARTA.SetRegion, assertItem.setRegion[0]);
            await Connection.receiveAny();
        }, regionTimeout);
    });

    describe(`Test acquire all spectral profiles`, () => {
        let SpectralProfileData: CARTA.SpectralProfileData[];
        test(`Should receive 4 spectral_requirements`, async () => {
            for (const [index, spectralRequirement] of assertItem.setSpectralRequirements.entries()) {
                await Connection.send(CARTA.SetSpectralRequirements, spectralRequirement);
            }
            let ack = await Connection.streamUntil(
                (type, data, ack: AckStream) =>
                    ack.SpectralProfileData.filter(data => data.progress == 1).length == 4
            );
            SpectralProfileData = ack.SpectralProfileData;
        }, profileTimeout);

        test(`Assert all region_id equal to ${assertItem.setSpectralRequirements[0].regionId}`, () => {
            for (const [index, spectralRequirement] of assertItem.setSpectralRequirements.entries()) {
                expect(SpectralProfileData.find(data => data.fileId == spectralRequirement.fileId).regionId).toEqual(spectralRequirement.regionId);
            }
        });

        test(`Assert the first profile equal to the last profile`, () => {
            expect(SpectralProfileData.find(data => data.fileId == assertItem.openFile[0].fileId).profiles).toEqual(SpectralProfileData.find(data => data.fileId == assertItem.openFile[3].fileId).profiles);
        });
    });

    describe(`Test acquire all spectral profiles after enlarge region`, () => {
        let SpectralProfileData: CARTA.SpectralProfileData[];
        test(`Should rotate region 1`, async () => {
            await Connection.send(CARTA.SetRegion, assertItem.setRegion[1]);
            let ack = await Connection.streamUntil(
                (type, data, ack: AckStream) =>
                    ack.SpectralProfileData.filter(data => data.progress == 1).length == 4
            );
            SpectralProfileData = ack.SpectralProfileData;
        }, profileTimeout);

        test(`Assert all region_id`, () => {
            for (const [index, spectralRequirement] of assertItem.setSpectralRequirements.entries()) {
                expect(SpectralProfileData.find(data => data.fileId == spectralRequirement.fileId).regionId).toEqual(spectralRequirement.regionId);
            }
        });

        test(`Assert the first profile equal to the last profile`, () => {
            expect(SpectralProfileData.find(data => data.fileId == assertItem.openFile[0].fileId).profiles).toEqual(SpectralProfileData.find(data => data.fileId == assertItem.openFile[3].fileId).profiles);
        });
    });

    afterAll(() => Connection.close());
});