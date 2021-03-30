import { AckStream, Client, IOpenFile } from "./CLIENT";
import { CARTA } from "carta-protobuf";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
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
            file: "M17_SWex.fits",
            fileId: 100,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.image",
            fileId: 101,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "broken_header.mirad",
            fileId: 102,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.hdf5",
            fileId: 103,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
        {
            directory: testSubdirectory,
            file: "M17_SWex.miriad",
            fileId: 104,
            hdu: "",
            renderMode: CARTA.RenderMode.RASTER,
        },
    ],
    openFileSuccess: [
        true,
        true,
        false,
        true,
        true,
    ],
};

describe("IMPORT_MULTIPLE_IMAGE: Opening multiple image files at once", () => {

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