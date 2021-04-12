import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.casa_varients;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    fileInfoRequest: CARTA.IFileInfoRequest[];
    precisionDigit?: number;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    precisionDigit: 4,
    fileInfoRequest: [
        {
            file: "componentlist.image",
            hdu: "",
        },
        {
            file: "concatenated.image",
            hdu: "",
        },
        {
            file: "pVimage.image",
            hdu: "",
        },
        {
            file: "UVamp.image",
            hdu: "",
        },
        {
            file: "UVphase.image",
            hdu: "",
        },
    ],
};

describe("FILEINFO_CASA_VARIENTS: Testing if file info of a variant CASA images is correctly delivered by the backend", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        let basePath: string;
        beforeAll(async () => {
            await Connection.send(CARTA.FileListRequest, { directory: "$BASE" });
            basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
        }, listFileTimeout);
        assertItem.fileInfoRequest.map(fileInfoRequest => {
            describe(`query the info of file : ${fileInfoRequest.file}`, () => {
                let FileInfoResponse: CARTA.FileInfoResponse;
                test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                    await Connection.send(CARTA.FileInfoRequest, {
                        directory: `${basePath}/` + testSubdirectory,
                        ...fileInfoRequest,
                    });
                    FileInfoResponse = await Connection.receive(CARTA.FileInfoResponse);
                }, openFileTimeout);

                test(`FILE_INFO_RESPONSE should match snapshot".`, async () => {
                    expect(FileInfoResponse).toMatchSnapshot({
                        fileInfo: {
                            // Date for creating a file is not a constant
                            date: expect.any(Object), // Might be a Number or Long
                        },
                        fileInfoExtended: {
                            "": {
                                // Skip this
                                headerEntries: expect.any(Object),
                            },
                        },
                    });
                    // Tolerance for precision digits 
                    FileInfoResponse.fileInfoExtended[""].headerEntries.map(item => {
                        if (item["numericValue"]) {
                            expect(item).toMatchSnapshot({
                                numericValue: expect.any(Number),
                            });
                            expect(item["numericValue"].toFixed(assertItem.precisionDigit)).toMatchSnapshot();
                        }else{
                            expect(item).toMatchSnapshot();
                        }
                    });
                }, openFileTimeout);
            });
        });
    });
    afterAll(() => Connection.close());
});