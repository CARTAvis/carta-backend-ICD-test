import { CARTA } from "carta-protobuf";

import { Client, AckStream, Wait } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let saveSubdirectory = config.path.save;
let connectTimeout = config.timeout.connection;
let readFileTimeout = config.timeout.readFile;
let saveFileTimeout = config.timeout.saveFile;
let momentTimeout = config.timeout.moment;
interface AssertItem {
    precisionDigit: number;
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    momentRequest: CARTA.IMomentRequest;
    saveFile: CARTA.ISaveFile[][];
};

let assertItem: AssertItem = {
    precisionDigit: 4,
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: {
        directory: testSubdirectory,
        file: "HD163296_CO_2_1.fits",
        hdu: "",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    momentRequest: {
        fileId: 0,
        regionId: 0,
        axis: CARTA.MomentAxis.SPECTRAL,
        mask: CARTA.MomentMask.Include,
        moments: [0, 1,],
        pixelRange: { min: 0.1, max: 1.0 },
        spectralRange: { min: 73, max: 114 },
    },
    saveFile: [
        [
            {
                outputFileDirectory: saveSubdirectory,
                outputFileName: 'HD163296_CO_2_1.fits.moment.average.fits',
                outputFileType: CARTA.FileType.FITS,
            },
            {
                outputFileDirectory: saveSubdirectory,
                outputFileName: 'HD163296_CO_2_1.fits.moment.average.image',
                outputFileType: CARTA.FileType.CASA,
            },
        ],
        [
            {
                outputFileDirectory: saveSubdirectory,
                outputFileName: 'HD163296_CO_2_1.fits.moment.integrated.fits',
                outputFileType: CARTA.FileType.FITS,
            },
            {
                outputFileDirectory: saveSubdirectory,
                outputFileName: 'HD163296_CO_2_1.fits.moment.integrated.image',
                outputFileType: CARTA.FileType.CASA,
            },
        ],
    ],
};

describe("MOMENTS_GENERATOR_SAVE: Testing moments generator for saving resultant image", () => {
    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    describe(`Preparation`, () => {
        test(`Open image`, async () => {
            await Connection.send(CARTA.OpenFile, assertItem.openFile);
            await Connection.stream(2);
        }, readFileTimeout);

    });

    let FileId: number[] = [];
    describe(`Moment generator`, () => {
        let ack: AckStream;
        test(`Receive a series of moment progress`, async () => {
            await Connection.send(CARTA.MomentRequest, assertItem.momentRequest);
            ack = await Connection.streamUntil(type => type == CARTA.MomentResponse);
            FileId = ack.RegionHistogramData.map(data => data.fileId);
            expect(ack.MomentProgress.length).toBeGreaterThan(0);
        }, momentTimeout);

        test(`Receive ${assertItem.momentRequest.moments.length} REGION_HISTOGRAM_DATA`, () => {
            expect(FileId.length).toEqual(assertItem.momentRequest.moments.length);
        });

        test(`Assert MomentResponse.success = true`, () => {
            expect(ack.MomentResponse[0].success).toBe(true);
        });

        test(`Assert MomentResponse.openFileAcks.length = ${assertItem.momentRequest.moments.length}`, () => {
            expect(ack.MomentResponse[0].openFileAcks.length).toEqual(assertItem.momentRequest.moments.length);
        });

        test(`Assert all MomentResponse.openFileAcks[].success = true`, () => {
            ack.MomentResponse[0].openFileAcks.map(ack => {
                expect(ack.success).toBe(true);
            });
        });

    });

    describe(`Save images`, () => {
        let saveFileAck: CARTA.SaveFileAck[] = [];
        for (let i = 0; i < assertItem.saveFile.length; i++) {
            for (let j = 0; j < assertItem.saveFile[i].length; j++) {
                test(`Save moment generated image ${assertItem.saveFile[i][j].outputFileName}`, async () => {
                    await Connection.send(CARTA.SaveFile, {
                        fileId: FileId[i],
                        ...assertItem.saveFile[i][j],
                    });
                    saveFileAck.push(await Connection.receive(CARTA.SaveFileAck));
                    await Wait(200);
                    expect(saveFileAck.slice(-1)[0].fileId).toEqual(FileId[i]);
                }, saveFileTimeout);
            }
        }

        test(`Assert all message.success = true`, () => {
            saveFileAck.map((ack, index) => {
                expect(ack.success).toBe(true);
            });
        });
    });

    afterAll(() => Connection.close());
});