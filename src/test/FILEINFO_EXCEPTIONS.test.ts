import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
};

describe("FILEINFO_EXCEPTIONS: Testing error handle of file info generation", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        beforeAll(async () => { }, listFileTimeout);

        ["no_such_file.image", "broken_header.miriad"].map((fileName: string) => {
            describe(`query the info of file : ${fileName}`, () => {
                let FileInfoResponseTemp: CARTA.FileInfoResponse;

                test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                    await Connection.send(CARTA.FileInfoRequest,
                        {
                            directory: testSubdirectory,
                            file: fileName,
                            hdu: "",
                        }
                    );
                    FileInfoResponseTemp = await Connection.receive(CARTA.FileInfoResponse);
                }, openFileTimeout);

                test("FILE_INFO_RESPONSE.success = false", () => {
                    expect(FileInfoResponseTemp.success).toBe(false);
                });

                test("FILE_INFO_RESPONSE.message is not None", () => {
                    expect(FileInfoResponseTemp.message).toBeDefined();
                    expect(FileInfoResponseTemp.message).not.toBe("");
                    console.warn(`Error message from reading "${fileName}": ${FileInfoResponseTemp.message}`);
                });
            });
        });
    });

    afterAll(() => Connection.close());
});
