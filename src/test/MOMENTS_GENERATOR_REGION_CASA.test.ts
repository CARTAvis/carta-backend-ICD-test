import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.moment;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let regionTimeout = config.timeout.region;
let momentTimeout = config.timeout.moment;
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    setRegion: CARTA.ISetRegion;
    setSpectralRequirements: CARTA.ISetSpectralRequirements;
    momentRequest: CARTA.IMomentRequest;
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_CO_2_1.image",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    setRegion: {
        fileId: 0,
        regionId: -1,
        regionInfo: {
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{ x: 218, y: 218.0 }, { x: 200.0, y: 200.0 }],
            rotation: 0,
        },
    },
    setSpectralRequirements: {
        fileId: 0,
        regionId: 1,
        spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.Sum] }],
    },
    momentRequest: {
        fileId: 0,
        regionId: 1,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 73, max: 114 },
    },
};
const momentName = [
    "average", "integrated", "weighted_coord", "weighted_dispersion_coord",
    "median", "median_coord", "standard_deviation", "rms", "abs_mean_dev",
    "maximum", "maximum_coord", "minimum", "minimum_coord",
];
const intensity = [ // Testing intensity at the (100, 100) of each moment image
    0.27199, 1.8133, 7.8841, 1.7107,
    0.30889, 7.9918, 0.097597, 0.28819, 0.082819,
    0.36911, 9.2617, 0.10461, 3.2299,
];

describe("MOMENTS_GENERATOR_REGION_CASA: Testing moments generator for a given region on a casa image", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.send(CARTA.RegisterViewer, assertItem.registerViewer);
        await Connection.receive(CARTA.RegisterViewerAck);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Preparation`, () => {
        test(`Open image`, async () => {
            await Connection.send(CARTA.OpenFile, assertItem.openFile);
            await Connection.stream(2);
        }, readFileTimeout);

        test(`Set region`, async () => {
            await Connection.send(CARTA.SetRegion, assertItem.setRegion);
            await Connection.send(CARTA.SetSpectralRequirements, assertItem.setSpectralRequirements);
            await Connection.receiveAny();
        }, regionTimeout);
    });

    let FileId: number[] = [];
    describe(`Moment generator`, () => {
        let MomentProgress: CARTA.MomentProgress[] = [];
        let MomentResponse: CARTA.MomentResponse;
        test(`Receive a series of moment progress`, async () => {
            let ack;
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest);
            // ack = await Connection.streamUntil(3000, type => type!=CARTA.MomentResponse);
            do {
                ack = await Connection.receiveAny();
                switch (ack.constructor.name) {
                    case "MomentResponse":
                        MomentResponse = ack;
                        break;
                    case "MomentProgress":
                        MomentProgress.push(ack);
                        break;
                    case "RegionHistogramData":
                        FileId.push(ack.fileId);
                        break;
                    default:
                        break;
                }
            } while (ack.constructor.name != "MomentResponse");
            expect(MomentProgress.length).toBeGreaterThan(0);
        }, momentTimeout);

        test(`Receive ${assertItem.momentRequest.moments.length} REGION_HISTOGRAM_DATA`, () => {
            expect(FileId.length).toEqual(assertItem.momentRequest.moments.length);
        });

        test(`Assert MomentResponse.success = true`, () => {
            expect(MomentResponse.success).toBe(true);
        });

        test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest.moments.length}`, () => {
            expect(MomentResponse.openFileAcks.length).toEqual(assertItem.momentRequest.moments.length);
        });

        test(`Assert all MomentResponse.openFileAcks[].success = true`, () => {
            MomentResponse.openFileAcks.map(ack => {
                expect(ack.success).toBe(true);
            });
        });

        test(`Assert all openFileAcks[].fileId > 0`, () => {
            MomentResponse.openFileAcks.map(ack => {
                expect(ack.fileId).toBeGreaterThan(0);
            });
        });

        test(`Assert openFileAcks[].fileInfo.name`, () => {
            MomentResponse.openFileAcks.map((ack, index) => {
                expect(ack.fileInfo.name).toEqual(assertItem.openFile.file + ".moment." + momentName[index]);
            });
        });

        test(`Assert openFileAcks[].fileInfoExtended`, () => {
            MomentResponse.openFileAcks.map(ack => {
                const coord = assertItem.setRegion.regionInfo.controlPoints;
                expect(ack.fileInfoExtended.height).toEqual(coord[1].y + 1);
                expect(ack.fileInfoExtended.width).toEqual(coord[1].x + 1);
                expect(ack.fileInfoExtended.dimensions).toEqual(4);
                expect(ack.fileInfoExtended.depth).toEqual(1);
                expect(ack.fileInfoExtended.stokes).toEqual(1);
            });
        });

        test(`Assert openFileAcks[].fileInfoExtended.headerEntries.length = 71`, () => {
            MomentResponse.openFileAcks.map((ack, index) => {
                expect(ack.fileInfoExtended.headerEntries.length).toEqual(71);
            });
        });

        test(`Assert openFileAcks[].fileInfoExtended.computedEntries.length = 15`, () => {
            MomentResponse.openFileAcks.map((ack, index) => {
                expect(ack.fileInfoExtended.computedEntries.length).toEqual(15);
            });
        });

    });

    describe(`Requset moment image`, () => {
        let RasterTileSync: CARTA.RasterTileSync[] = [];
        let RasterTileData: CARTA.RasterTileData[] = [];
        test(`Receive all image data until RasterTileSync.endSync = true`, async () => {
            for (let idx = 0; idx < FileId.length; idx++) {
                await Connection.send(CARTA.AddRequiredTiles, {
                    fileId: FileId[idx],
                    tiles: [0],
                    compressionType: CARTA.CompressionType.NONE,
                    compressionQuality: 0,
                });
                let ack;
                do {
                    ack = await Connection.receiveAny();
                    switch (ack.constructor.name) {
                        case "RasterTileSync":
                            if (ack.endSync) {
                                RasterTileSync.push(ack);
                            }
                            break;
                        case "RasterTileData":
                            RasterTileData.push(ack);
                            break;
                        default:
                            break;
                    }
                } while (!(ack.constructor.name == "RasterTileSync" && ack.endSync));
            }
            RasterTileSync.map(ack => {
                expect(ack.endSync).toBe(true);
            });
        }, readFileTimeout * FileId.length);

        test(`Assert RASTER_TILE_SYNC.fileId`, () => {
            RasterTileSync.map((ack, index) => {
                expect(ack.fileId).toEqual(FileId[index]);
            });
        });

        test(`Receive RASTER_TILE_DATA`, () => {
            expect(RasterTileData.length).toEqual(FileId.length);
        });

        test(`Assert RASTER_TILE_DATA.fileId`, () => {
            RasterTileData.map((ack, index) => {
                expect(ack.fileId).toEqual(FileId[index]);
            });
        });

        test(`Assert RASTER_TILE_DATA.tiles`, () => {
            RasterTileData.map(ack => {
                expect(ack.tiles[0].height).toEqual(201);
                expect(ack.tiles[0].width).toEqual(201);
                expect(ack.tiles[0].imageData.length).toEqual(201 * 201 * 4);
                expect(ack.tiles[0].nanEncodings.length).toEqual(0);
            });
        });

        test(`Assert RASTER_TILE_DATA.tiles[0].imageData[100][100]`, () => {
            RasterTileData.map((ack, index) => {
                const data = (new Float32Array(ack.tiles[0].imageData.slice().buffer));
                expect(data[201 * 100 + 100]).toBeCloseTo(intensity[index], assertItem.precisionDigit);
            });
        });
    });

    afterAll(() => Connection.close());
});