import { AckStream, Client, IOpenFile } from "./CLIENT";
import { CARTA } from "carta-protobuf";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA + "/header_issue";
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile[];
    openFileSuccess: boolean[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile: [
        {
            directory: testSubdirectory,
            file: "cube_disorder_header01.fits",
            fileId: 100,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "cube_disorder_header02.fits",
            fileId: 1,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "cube_disorder_header03.fits",
            fileId: 2,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "Jordan_case.fits",
            fileId: 3,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "cube_ra_dec_sponge_bob.fits",
            fileId: 4,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "cube_ra_dec_sponge_bob2.fits",
            fileId: 5,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "cube_ra_dec_freq_stokes.fits",
            fileId: 6,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "cube_ra_dec_stokes_freq.fits",
            fileId: 7,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    openFileSuccess: [
        true,
        true,
        true,
        false,
        true,
        true,
        true,
        true,
    ],
};

describe("FILEINFO_FITS_NONSTANDARD: Opening multiple FITS image files with non-standard header", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        assertItem.openFile.map((openFile, index) => {
            describe(`query the info of file : ${openFile.file}`, () => {
                let OpenFileAck: CARTA.OpenFileAck;
                test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                    if (assertItem.openFileSuccess[index]) {
                        OpenFileAck = (await Connection.openFile(openFile) as IOpenFile).OpenFileAck;
                    } else {
                        await Connection.send(CARTA.OpenFile, openFile);
                        OpenFileAck = (await Connection.streamUntil(type => type == CARTA.OpenFileAck) as AckStream).Responce[0];
                    }
                }, openFileTimeout);

                test(`FILE_INFO_RESPONSE.success = ${assertItem.openFileSuccess[index]}`, () => {
                    expect(OpenFileAck.success).toBe(assertItem.openFileSuccess[index]);
                });

            });
        });
    });
    afterAll(() => Connection.close());
});