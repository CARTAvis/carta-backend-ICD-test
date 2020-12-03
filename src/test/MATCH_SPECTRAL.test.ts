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
    setCursor: CARTA.ISetCursor[];
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
                controlPoints: [{ x: 200, y: 200 }, { x: 100, y: 100 }],
            },
        },
        {
            fileId: 100,
            regionId: 1,
            regionInfo: {
                regionType: 3,
                rotation: 0,
                controlPoints: [{ x: 200, y: 200 }, { x: 150, y: 150 }],
            },
        },
    ],
};

describe("MATCH_SPECTRAL: Testing region spectral result as matching multiple images", () => {
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
            test(`Should set cursor ${index}`, async () => {
                await Connection.send(CARTA.SetCursor, cursor);
                await Connection.receiveAny();
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
                expect(SpectralProfileData[index].regionId).toEqual(spectralRequirement.regionId);
            }
        });

        test(`Assert the first profile equal to the last profile`, () => {
            expect(SpectralProfileData[0].profiles).toEqual(SpectralProfileData[3].profiles);
        });
    });

    describe(`Test acquire all spectral profiles after enlarge region`, () => {
        let SpectralProfileData: CARTA.SpectralProfileData[];
        test(`Should move region 1`, async () => {
            await Connection.send(CARTA.SetRegion, assertItem.setRegion[1]);
            let ack = await Connection.streamUntil(
                (type, data, ack: AckStream) =>
                    ack.SpectralProfileData.filter(data => data.progress == 1).length == 4
            );
            SpectralProfileData = ack.SpectralProfileData;
        }, profileTimeout);

        test(`Assert all region_id`, () => {
            for (const [index, spectralRequirement] of assertItem.setSpectralRequirements.entries()) {
                expect(SpectralProfileData[index].regionId).toEqual(spectralRequirement.regionId);
            }
        });

        test(`Assert the first profile equal to the last profile`, () => {
            expect(SpectralProfileData[0].profiles).toEqual(SpectralProfileData[3].profiles);
        });
    });

    afterAll(() => Connection.close());
});