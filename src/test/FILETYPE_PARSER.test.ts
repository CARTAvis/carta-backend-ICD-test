import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let expectRootPath = config.path.root;
let expectBasePath = config.path.base;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;

describe("FILETYPE_PARSER test: Testing if all supported image types can be detected and displayed in the file list", 
() => {
    let Connection: WebSocket;

    beforeEach( done => {
        Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "1234"
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
    }, connectionTimeout);
    
    let baseDirectory: string;
    test(`assert the base path.`,      
        async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    FileListResponse => {
                        expect(FileListResponse.success).toBe(true);
                        baseDirectory = FileListResponse.directory;
                        resolve();
                    }
                );                
            });
        }, connectionTimeout);

    describe(`send EventName: "FILE_LIST_REQUEST" to CARTA ${testServerUrl}`, 
    () => {
        test(`assert the received EventName is "FILE_LIST_RESPONSE" within ${connectionTimeout} ms.`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    FileListResponse => {
                        resolve();
                    }
                );                
            });
        }, connectionTimeout);
    
        test(`assert the "FILE_LIST_RESPONSE.success" is true.`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.success).toBe(true);
                        resolve();
                    }
                );                
            });
        }, connectionTimeout);         

        test(`assert the "FILE_LIST_RESPONSE.parent" is "$BASE".`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.parent).toBe(baseDirectory);
                        resolve();
                    }
                );                
            });
        }, connectionTimeout);

        test(`assert the "FILE_LIST_RESPONSE.directory" is the path "$BASE/${testSubdirectoryName}".`, 
        async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    (FileListResponse: CARTA.FileListResponse) => {
                        expect(FileListResponse.directory).toBe(baseDirectory === expectRootPath ? testSubdirectoryName : baseDirectory + "/" + testSubdirectoryName);
                        resolve();
                    }
                );                
            });
        }, connectionTimeout);

        describe(`test the file is existent`, () => {
            [
                ["SDC335.579-0.292.spw0.line.image", CARTA.FileType.CASA, 1864975311, [""]],
                ["S255_IR_sci.spw25.cube.I.pbcor.fits", CARTA.FileType.FITS, 7048405440, ["0"]],
                ["spire500_ext.fits", CARTA.FileType.FITS, 17591040, ["0", "1", "2", "3", "4", "5", "6", "7", ]],
                ["G34mm1_lsb_all.uv.part1.line.natwt.sml", CARTA.FileType.MIRIAD, 34521240, [""]],
	            ["orion_12co_hera.hdf5", CARTA.FileType.HDF5, 118888712, ["0"]],
            ].map(
                function([file, type, size, hdu]:
                         [string, CARTA.FileType, number, string[]]) {
    
                    test(`assert the file "${file}" exists, image type is ${CARTA.FileType[type]}, size = ${size}, HDU = [${hdu}].`, 
                    async () => {
                        await Utility.setEvent(Connection, CARTA.FileListRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName,
                            }
                        );
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, CARTA.FileListResponse, 
                                (FileListResponse: CARTA.FileListResponse) => {
                                    expect(FileListResponse.success).toBe(true);
    
                                    let fileInfo = FileListResponse.files.find(f => f.name === file);
                                    expect(fileInfo).toBeDefined();
                                    expect(fileInfo.type).toBe(type);
                                    expect(fileInfo.size.toNumber()).toBe(size);
                                    expect(fileInfo.HDUList).toEqual(hdu);
                                    resolve();
                                }
                            );                
                        });
                    }, connectionTimeout);

                }
            );
        });
        
        describe(`test the file is non-existent`, () => {
            [
                ["empty2.miriad"], ["empty2.fits"], ["empty2.image"], ["empty2.hdf5"],
                ["empty.txt"], ["empty.miriad"], ["empty.fits"], ["empty.hdf5"],
                ["empty.image"],
            ].map(
                function([file]: [string]) {
                    test(`assert the file "${file}" does not exist.`, 
                    async () => {
                        await Utility.setEvent(Connection, CARTA.FileListRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName,
                            }
                        );
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, CARTA.FileListResponse, 
                                (FileListResponse: CARTA.FileListResponse) => {
                                    expect(FileListResponse.success).toBe(true);
                                    let fileInfo = FileListResponse.files.find(f => f.name === file);
                                    expect(fileInfo).toBeUndefined();
                                    resolve();
                                }
                            );                
                        });
                    }, connectionTimeout);
                }
            );
        });        
        
        describe(`test the folder is existent inside "${testSubdirectoryName}"`, () => {
            [
                ["empty_folder"], ["empty.miriad"], ["empty.fits"], 
                ["empty.image"], ["empty.hdf5"],
            ].map(
                ([folder]) => {
                    test(`assert the folder "${folder}" exists.`, 
                    async () => {
                        await Utility.setEvent(Connection, CARTA.FileListRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName,
                            }
                        );
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, CARTA.FileListResponse, 
                                (FileListResponse: CARTA.FileListResponse) => {
                                    expect(FileListResponse.success).toBe(true);
                                    let folderInfo = FileListResponse.subdirectories.find(f => f === folder);
                                    expect(folderInfo).toBeDefined();
                                    resolve();
                                }
                            );                
                        });
                    }, connectionTimeout);
                }
            );
        });

    });

    afterEach( () => {
        Connection.close();
    });
});
