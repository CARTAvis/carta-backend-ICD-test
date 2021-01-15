import { CARTA } from "carta-protobuf";

import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let cursorTimeout = config.timeout.cursor;
let profileTimeout = config.timeout.spatralProfile;
interface IIndexValue {
    index: number;
    value: number;
}
interface ISingleProfile {
    coordinate: string;
    inspectCoordinate: IIndexValue[];
}
interface AssertItem {
    precisionDigits: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    setCursor: CARTA.ISetCursor[];
    spatialProfileData: CARTA.ISpatialProfileData[];
    setSpatialRequirements: CARTA.ISetSpatialRequirements[];
    profiles: CARTA.ISpatialProfile[];
    testProfile: ISingleProfile[];
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
            spatialRequirements: {
                fileId: 100,
                regionId: 0,
                spatialProfiles: [],
            },
        },
        {
            fileId: 101,
            point: { x: 200.0, y: 200.0 },
            spatialRequirements: {
                fileId: 100,
                regionId: 0,
                spatialProfiles: [],
            },
        },
        {
            fileId: 102,
            point: { x: 200.0, y: 200.0 },
            spatialRequirements: {
                fileId: 100,
                regionId: 0,
                spatialProfiles: [],
            },
        },
        {
            fileId: 103,
            point: { x: 200.0, y: 200.0 },
            spatialRequirements: {
                fileId: 100,
                regionId: 0,
                spatialProfiles: [],
            },
        },
    ],
    spatialProfileData: [
        {
            profiles: [],
            fileId: 100,
            x: 200,
            y: 200,
            value: -0.0023265306372195482,
        },
        {
            profiles: [],
            fileId: 101,
            x: 200,
            y: 200,
            value: -0.003293930785730481,
        },
        {
            profiles: [],
            fileId: 102,
            x: 200,
            y: 200,
            value: 0.00045203242916613817,
        },
        {
            profiles: [],
            fileId: 103,
            x: 200,
            y: 200,
            value: -0.0023265306372195482,
        },
    ],
    setSpatialRequirements: [
        {
            fileId: 100,
            regionId: 0,
            spatialProfiles: ["x", "y"],
        },
        {
            fileId: 100,
            regionId: 0,
            spatialProfiles: [],
        },
        {
            fileId: 103,
            regionId: 0,
            spatialProfiles: ["x", "y"],
        },
    ],
    profiles: [
        {
            coordinate: 'x', start: 0, end: 432,
        },
        {
            coordinate: 'y', start: 0, end: 432,
        },
    ],
    testProfile: [
        {
            coordinate: 'x',
            inspectCoordinate: [
                {
                    index: 0,
                    value: 0.003749021328985691,
                },
                {
                    index: 100,
                    value: -0.00412857485935092,
                },
                {
                    index: 200,
                    value: -0.0023265306372195482,
                },
                {
                    index: 300,
                    value: -0.004911878611892462,
                },
            ],
        },
        {
            coordinate: 'y',
            inspectCoordinate: [
                {
                    index: 0,
                    value: 0.010285217314958572,
                },
                {
                    index: 100,
                    value: 0.011745041236281395,
                },
                {
                    index: 200,
                    value: -0.0023265306372195482,
                },
                {
                    index: 300,
                    value: 0.0040122647769749165,
                },
            ],
        },
    ],
};

describe("MATCH_SPATIAL: Test cursor value and spatial profile with spatially matched images", () => {
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
    });

    for (const [index, cursor] of assertItem.setCursor.entries()) {
        describe(`Set cursor ${index}`, () => {
            test(`Assert SpatialProfileData ${JSON.stringify(assertItem.spatialProfileData[index])}`, async () => {
                await Connection.send(CARTA.SetCursor, cursor);
                let spatialProfileData = await Connection.receive(CARTA.SpatialProfileData) as CARTA.SpatialProfileData;
                expect(spatialProfileData).toMatchObject(assertItem.spatialProfileData[index]);
                expect(spatialProfileData.regionId).toEqual(0);
            }, cursorTimeout);
        });
    }

    let spatialProfileData0: CARTA.SpatialProfileData;
    describe(`Set Spatial Requirements for file_id = ${assertItem.setSpatialRequirements[0].fileId}`, () => {
        let spatialProfileData: CARTA.SpatialProfileData;
        test(`Assert SpatialProfileData`, async () => {
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialRequirements[0]);
            spatialProfileData = await Connection.receive(CARTA.SpatialProfileData);
            spatialProfileData0 = spatialProfileData;
            expect(spatialProfileData.profiles).toMatchObject(assertItem.profiles);
            expect(spatialProfileData.regionId).toEqual(0);
            let testingArrayX = spatialProfileData.profiles.find(profile => profile.coordinate == 'x').values;
            assertItem.testProfile[0].inspectCoordinate.map(Coordinates => {
                expect(testingArrayX[Coordinates.index]).toEqual(Coordinates.value)
            });
            let testingArrayY = spatialProfileData.profiles.find(profile => profile.coordinate == 'y').values;
            assertItem.testProfile[1].inspectCoordinate.map(Coordinates => {
                expect(testingArrayY[Coordinates.index]).toEqual(Coordinates.value)
            });
        }, profileTimeout);
    });

    describe(`Set Spatial Requirements for file_id = ${assertItem.setSpatialRequirements[2].fileId}`, () => {
        let spatialProfileData: CARTA.SpatialProfileData[];
        test(`Should receive SpatialProfileData x2`, async () => {
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialRequirements[1]);
            await Connection.send(CARTA.SetSpatialRequirements, assertItem.setSpatialRequirements[2]);
            let ack = await Connection.streamUntil((type, data, ack: AckStream) => ack.SpatialProfileData.length == 2);
            spatialProfileData = ack.SpatialProfileData;
        }, profileTimeout);

        test(`Assert SPATIAL_PROFILE_DATA[first, last].profiles.length = [0, 2]`, () => {
            expect(spatialProfileData.find(data => data.fileId==assertItem.openFile[0].fileId).profiles.length).toEqual(0);
            expect(spatialProfileData.find(data => data.fileId==assertItem.openFile[3].fileId).profiles.length).toEqual(2);
        });

        test(`Assert SPATIAL_PROFILE_DATA of file_id:${assertItem.setSpatialRequirements[0].fileId} & file_id:${assertItem.setSpatialRequirements[2].fileId} are equal`, () => {
            const spatialProfileData1 = spatialProfileData.find(data => data.fileId==assertItem.openFile[3].fileId);
            delete spatialProfileData1.fileId;
            const spatialProfileData2 = spatialProfileData0;
            delete spatialProfileData2.fileId;
            expect(spatialProfileData1).toStrictEqual(spatialProfileData2);
        });
    });

    afterAll(() => Connection.close());
});