import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectTimeout = config.timeout.connection;

describe("FILETYPE_PARSER test: Testing if all supported image types can be detected and displayed in the file list", () => {
    let Connection: WebSocket;
    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: ""
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            done();
        }
    }, connectTimeout);

    describe(`Go to "public" folder`, () => {
        let FileListResponseTemp: CARTA.FileListResponse;
        test(`should get "FILE_LIST_RESPONSE" within ${connectTimeout} ms.`, async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: testSubdirectoryName
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    FileListResponse => {
                        expect(FileListResponse.success).toBe(true);
                        FileListResponseTemp = FileListResponse;
                        resolve();
                    }
                );                
            });
        }, connectTimeout);

        test("FILE_LIST_RESPONSE.success = True", () => {
            expect(FileListResponseTemp.success).toBe(true);
        });

        test(`FILE_LIST_RESPONSE.parent = "public"`, () => {
            expect(FileListResponseTemp.parent).toEqual("public");
        });

        test(`FILE_LIST_RESPONSE.directory = "${testSubdirectoryName}"`, () => {
            expect(FileListResponseTemp.directory).toEqual(testSubdirectoryName);
        });

        describe(`assert the file is existent`, () => {
            [
                ["M17_SWex.image", CARTA.FileType.CASA, 53009869, [""]],
                ["M17_SWex.fits", CARTA.FileType.FITS, 51393600, ["0"]],
                ["M17_SWex.miriad", CARTA.FileType.MIRIAD, 52993642, [""]],
                ["M17_SWex.hdf5", CARTA.FileType.HDF5, 112823720, ["0"]],
                ["spire500_ext.fits", CARTA.FileType.FITS, 17591040,  ["0", "1", "2", "3", "4", "5", "6", "7"]],
            ].map(
                function([file, type, size, hdu]: [string, CARTA.FileType, number, string[]]) {
                    test(`file "${file}" should exist, image type be ${CARTA.FileType[type]}, size = ${size}, HDU = [${hdu}].`, () => {
                        let fileInfo = FileListResponseTemp.files.find(f => f.name === file);
                        expect(fileInfo).toBeDefined();
                        expect(fileInfo.type).toBe(type);
                        expect(fileInfo.size.toNumber()).toEqual(size);
                        expect(fileInfo.HDUList).toEqual(hdu);
                    });
                }
            );
        });
        
        describe(`assert the file is non-existent`, () => {
            [
                ["empty2.miriad"], ["empty2.fits"], ["empty2.image"], 
                ["empty2.hdf5"], ["empty.txt"], ["empty.image"], 
                ["empty.miriad"], ["empty.fits"], ["empty.hdf5"],
            ].map(
                function([file]: [string]) {
                    test(`the file "${file}" should not exist.`,  () => {
                        let fileInfo = FileListResponseTemp.files.find(f => f.name === file);
                        expect(fileInfo).toBeUndefined();
                    });
                }
            );
        });        
        
        describe(`assert the folder should exist inside "${testSubdirectoryName}"`, () => {
            [
                ["empty_folder"], ["empty.image"], 
                ["empty.miriad"], ["empty.fits"], 
                ["empty.hdf5"],
            ].map(
                ([folder]) => {
                    test(`the folder "${folder}" should exist.`, () => {
                        let folderInfo = FileListResponseTemp.subdirectories.find(f => f === folder);
                        expect(folderInfo).toBeDefined();
                    });
                }
            );
        });
    });

    afterAll( () => {
        Connection.close();
    });
});
