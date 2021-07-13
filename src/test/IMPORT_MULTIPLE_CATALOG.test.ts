import { AckStream, Client } from "./CLIENT";
import { CARTA } from "carta-protobuf";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.catalogArtificial;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let regionTimeout = config.timeout.region;

type IOpenCatalogFileAck = {
    success: boolean,
    dataSize?: number,
    system?: string,
    headerLength?: number,
};
interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    openFile: CARTA.IOpenFile;
    openCatalogFile: CARTA.IOpenCatalogFile[];
    OpenCatalogFileAck: IOpenCatalogFileAck[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    openFile:
    {
        directory: testSubdirectory,
        file: "Gaussian_J2000.fits",
        fileId: 100,
        hdu: "",
        renderMode: CARTA.RenderMode.RASTER,
    },
    openCatalogFile: [
        {
            directory: testSubdirectory,
            name: "artificial_catalog_B1950.xml",
            fileId: 101,
            previewDataSize: 0,
        },
        {
            directory: testSubdirectory,
            name: "artificial_catalog_Ecliptic.xml",
            fileId: 102,
            previewDataSize: 0,
        },
        {
            directory: testSubdirectory,
            name: "Gaussian_J2000.fits",
            fileId: 103,
            previewDataSize: 0,
        },
        {
            directory: testSubdirectory,
            name: "artificial_catalog_Galactic.xml",
            fileId: 104,
            previewDataSize: 0,
        },
        {
            directory: testSubdirectory,
            name: "artificial_catalog_J2000.xml",
            fileId: 105,
            previewDataSize: 0,
        },
    ],
    OpenCatalogFileAck: [
        {
            success: true,
            dataSize: 29,
            system: "FK4",
            headerLength: 235,

        },
        {
            success: true,
            dataSize: 29,
            system: "Ecliptic",
            headerLength: 235,

        },
        {
            success: false,
        },
        {
            success: true,
            dataSize: 29,
            system: "Galactic",
            headerLength: 235,

        },
        {
            success: true,
            dataSize: 29,
            system: "FK5",
            headerLength: 235,

        },
    ],
};

describe("IMPORT_MULTIPLE_CATALOG: Opening multiple region files at once", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        beforeAll(async () => {
            await Connection.openFile(assertItem.openFile);
        }, openFileTimeout);

        assertItem.openCatalogFile.map((catalogFile, index) => {
            describe(`open catalog file : ${catalogFile.name}`, () => {
                let openCatalogFileAck: CARTA.OpenCatalogFileAck;
                test(`OPEN_CATALOG_FILEACK should arrive within ${openFileTimeout} ms".`, async () => {
                    await Connection.send(CARTA.OpenCatalogFile, catalogFile);
                    openCatalogFileAck = (await Connection.streamUntil(type => type == CARTA.OpenCatalogFileAck) as AckStream).Responce[0];

                }, regionTimeout);

                test(`OPEN_CATALOG_FILEACK.success = ${assertItem.OpenCatalogFileAck[index].success}`, () => {
                    expect(openCatalogFileAck.success).toBe(assertItem.OpenCatalogFileAck[index].success);
                });

                if (assertItem.OpenCatalogFileAck[index].success) {
                    test(`OPEN_CATALOG_FILEACK.dataSize = ${assertItem.OpenCatalogFileAck[index].dataSize}`, () => {
                        expect(openCatalogFileAck.dataSize).toEqual(assertItem.OpenCatalogFileAck[index].dataSize);
                    });

                    test(`OPEN_CATALOG_FILEACK.fileInfo.coosys[0].system = ${assertItem.OpenCatalogFileAck[index].system}`, () => {
                        expect(openCatalogFileAck.fileInfo.coosys[0].system).toEqual(assertItem.OpenCatalogFileAck[index].system);
                    });

                    test(`OPEN_CATALOG_FILEACK.header.length = ${assertItem.OpenCatalogFileAck[index].headerLength}`, () => {
                        expect(openCatalogFileAck.headers.length).toEqual(assertItem.OpenCatalogFileAck[index].headerLength);
                    });
                }
            });
        });
    });
    afterAll(() => Connection.close());
});