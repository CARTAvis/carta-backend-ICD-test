/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let expectRootPath = config.path.root;
let expectBasePath = config.path.base;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

describe("FILETYPE_PARSER test: Testing if all supported image types can be detected and displayed in the file list", 
() => {   
    // Establish a websocket connection in the transfer form of binary: arraybuffer 
    let Connection: WebSocket;

    beforeEach( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        // While open a Websocket
        Connection.onopen = () => {
            // Checkout if Websocket server is ready
            if (Connection.readyState === WebSocket.OPEN) {
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        done();
                    }
                );
                Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234"
                    }
                );
            } else {
                console.log(`Can not open a connection. @${new Date()}`);
            }
            done();
        };
    }, connectionTimeout);
    
    let baseDirectory: string;
    test(`assert the base path.`, 
    done => {
        
        Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
            FileListResponseBase => {                
                baseDirectory = FileListResponseBase.directory;    
                done();
            }
        );
        Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
            {
                directory: expectBasePath
            }
        );
    }, connectionTimeout);

    describe(`send EventName: "FILE_LIST_REQUEST" to CARTA ${testServerUrl}`, 
    () => {
        test(`assert the received EventName is "FILE_LIST_RESPONSE" within ${connectionTimeout} ms.`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName
                }
            );
        }, connectionTimeout);
    
        test(`assert the "FILE_LIST_RESPONSE.success" is true.`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    expect(FileListResponse.success).toBe(true);
                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName
                }
            );
        }, connectionTimeout);         

        test(`assert the "FILE_LIST_RESPONSE.parent" is "$BASE".`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    expect(FileListResponse.parent).toBe(baseDirectory);
                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName
                }
            );
        }, connectionTimeout);

        test(`assert the "FILE_LIST_RESPONSE.directory" is the path "$BASE/${testSubdirectoryName}".`, 
        done => {
            Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponse => {
                    expect(FileListResponse.directory).toBe(baseDirectory === expectRootPath ? testSubdirectoryName : baseDirectory + "/" + testSubdirectoryName);
                    // console.log(FileListResponse.directory);
                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName
                }
            );
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
                    done => {
                        Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            FileListResponse => {
                                expect(FileListResponse.success).toBe(true);

                                let fileInfo = FileListResponse.files.find(f => f.name === file);
                                expect(fileInfo).toBeDefined();
                                expect(fileInfo.type).toBe(type);
                                expect(fileInfo.size.toNumber()).toBe(size);
                                expect(fileInfo.HDUList).toEqual(hdu);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName
                            }
                        );
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
                    done => {
                        Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            FileListResponse => {
                                expect(FileListResponse.success).toBe(true);
                                let fileInfo = FileListResponse.files.find(f => f.name === file);
                                expect(fileInfo).toBeUndefined();
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName
                            }
                        );
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
                    done => {
                        Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            FileListResponse => {
                                expect(FileListResponse.success).toBe(true);
                                let folderInfo = FileListResponse.subdirectories.find(f => f === folder);
                                expect(folderInfo).toBeDefined();
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName
                            }
                        );
                    }, connectionTimeout);
                }
            );
        });

    });

    afterEach( done => {
        Connection.close();
        done();
    });
});
