import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let expectRootPath = config.path.root;
let expectBasePath = config.path.base;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;
let readLargeImageTimeout = config.timeout.readLargeImage;

describe("FILEINFO test: Testing if info of an image file is correctly delivered by the backend", 
() => {   
    let Connection: WebSocket;

    beforeEach( done => {
        Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEvent(this, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            done();
        }
    }, connectionTimeout);
    
    describe(`access directory to `, () => {
        [
            [expectRootPath],
            [expectBasePath],
            [expectBasePath + "/" + testSubdirectoryName], 
        ].map(
            ([dir]) => {
                test(`open the directory "${dir}".`, 
                async () => {
                    await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                        {
                            directory: dir
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                                FileListResponseBase => {
                                expect(FileListResponseBase.success).toBe(true);
                                resolve();
                            }
                        );                
                    });
                }, connectionTimeout);
            }
        );
    });

    describe(`access the folder "${testSubdirectoryName}" to `, 
    () => {
        let baseDirectory: string; 
        beforeEach( 
            async () => {
                await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                    {
                        directory: expectBasePath
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            FileListResponseBase => {
                            expect(FileListResponseBase.success).toBe(true);
                            baseDirectory = FileListResponseBase.directory;
                            resolve();
                        }
                    );                
                });
                await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                    {
                        directory: baseDirectory
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            FileListResponseBase => {
                            expect(FileListResponseBase.success).toBe(true);
                            resolve();
                        }
                    );                
                });
            }, connectionTimeout); 

        describe(`test an existent file`, () => {
            [
                ["S255_IR_sci.spw25.cube.I.pbcor.fits",    "0",    7048405440,      CARTA.FileType.FITS,        [1920, 1920, 478, 1],   4],
                ["SDC335.579-0.292.spw0.line.image",        "",    1864975311,      CARTA.FileType.CASA,        [336, 350, 3840, 1],    4],
                ["G34mm1_lsb_all.uv.part1.line.natwt.sml",  "",      34521240,      CARTA.FileType.MIRIAD,      [129, 129, 512, 1],     4],
                ["orion_12co_hera.hdf5",                   "0",     118888712,      CARTA.FileType.HDF5,        [688, 575, 35],         3],
                ["spire500_ext.fits",                      "1",      17591040,      CARTA.FileType.FITS,        [830, 870],             2],
            ].map(
                function([fileName, hdu,    fileSize,   fileType,       shape,      NAXIS]: 
                         [string,   string, number,     CARTA.FileType, number[],   number]) {
                    test(`assert the info of ${CARTA.FileType[fileType]} file "${fileName}".`, 
                    async () => {
                        await Utility.setEvent(Connection, "FILE_INFO_REQUEST", CARTA.FileInfoRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName, 
                                file: fileName, 
                                hdu
                            }
                        );
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, "FILE_INFO_RESPONSE", CARTA.FileInfoResponse, 
                                (FileInfoResponse: CARTA.FileInfoResponse) => {
                                    expect(FileInfoResponse.success).toBe(true);
                                    expect(FileInfoResponse.fileInfo.HDUList.find( f => f === hdu)).toEqual(hdu);
                                    expect(FileInfoResponse.fileInfo.name).toBe(fileName);
                                    expect(FileInfoResponse.fileInfo.size.toString()).toEqual(fileSize.toString());
                                    expect(FileInfoResponse.fileInfo.type).toBe(fileType);
                                    resolve();
                                }
                            );                
                        });                                                 
                    }, readLargeImageTimeout);

                    test(`assert the extended info of ${CARTA.FileType[fileType]} file "${fileName}".`, 
                    async () => {
                        await Utility.setEvent(Connection, "FILE_INFO_REQUEST", CARTA.FileInfoRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName, 
                                file: fileName, 
                                hdu
                            }
                        );
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, "FILE_INFO_RESPONSE", CARTA.FileInfoResponse, 
                                (FileInfoResponse: CARTA.FileInfoResponse) => {                                    
                                    expect(FileInfoResponse.fileInfoExtended.dimensions).toEqual(NAXIS);
                                    expect(FileInfoResponse.fileInfoExtended.width).toEqual(shape[0]);
                                    expect(FileInfoResponse.fileInfoExtended.height).toEqual(shape[1]);
                                    if (NAXIS > 2) {
                                        expect(FileInfoResponse.fileInfoExtended.depth).toEqual(shape[2]);
                                    }
                                    if (NAXIS > 3) {
                                        expect(FileInfoResponse.fileInfoExtended.stokes).toEqual(shape[3]);
                                    }
                                    expect(FileInfoResponse.fileInfoExtended.stokesVals[0]).toEqual("");
                                    
                                    const fileInfoExtComputedShape = 
                                        FileInfoResponse.fileInfoExtended.computedEntries.find( f => f.name === "Shape").value;
                                    expect(
                                        fileInfoExtComputedShape.replace("[", "").replace("]", "").split(",").map(Number)
                                        ).toEqual(shape);

                                    resolve();
                                }
                            );                
                        });                    
                    }, readLargeImageTimeout);

                    test(`assert the header info of ${CARTA.FileType[fileType]} file "${fileName}".`, 
                    async () => {
                        await Utility.setEvent(Connection, "FILE_INFO_REQUEST", CARTA.FileInfoRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName, 
                                file: fileName, 
                                hdu
                            }
                        );
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, "FILE_INFO_RESPONSE", CARTA.FileInfoResponse, 
                                (FileInfoResponse: CARTA.FileInfoResponse) => {                                    
                                    const fileInfoExtHeaderNAXIS = 
                                        FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS").value;
                                    expect(parseInt(fileInfoExtHeaderNAXIS)).toEqual(NAXIS);
                                    const fileInfoExtHeaderNAXIS1 = 
                                        FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS1").value;
                                    expect(parseInt(fileInfoExtHeaderNAXIS1)).toEqual(shape[0]);
                                    const fileInfoExtHeaderNAXIS2 = 
                                        FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS2").value;
                                    expect(parseInt(fileInfoExtHeaderNAXIS2)).toEqual(shape[1]);
                                    if (NAXIS > 2) {
                                        const fileInfoExtHeaderNAXIS3 = 
                                            FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS3").value;
                                        expect(parseInt(fileInfoExtHeaderNAXIS3)).toEqual(shape[2]);
                                    }
                                    if (NAXIS > 3) {
                                        const fileInfoExtHeaderNAXIS4 = 
                                            FileInfoResponse.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS4").value;
                                        expect(parseInt(fileInfoExtHeaderNAXIS4)).toEqual(shape[3]);
                                    }
                                    resolve();
                                }
                            );                
                        });                    
                    }, readLargeImageTimeout);

                } // function([ ])
            ); // map
        }); // describe

    });

    afterEach( () => {
        Connection.close();
    });
});

describe("FILEINFO_EXCEPTIONS test: Testing error handle of file info generation", () => {   
    let Connection: WebSocket;

    beforeEach( done => {
        Connection = new WebSocket(testServerUrl);
        expect(Connection.readyState).toBe(WebSocket.CONNECTING);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            await Utility.setEvent(this, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "1234"
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            done();
        }
    }, connectionTimeout);

    describe(`access the folder "${testSubdirectoryName}" to `, 
    () => {    
        let baseDirectory: string; 
        beforeEach(
            async () => {
                await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                    {
                        directory: expectBasePath
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            FileListResponseBase => {
                            expect(FileListResponseBase.success).toBe(true);
                            baseDirectory = FileListResponseBase.directory;
                            resolve();
                        }
                    );                
                });
                await Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                    {
                        directory: baseDirectory
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            FileListResponseBase => {
                            expect(FileListResponseBase.success).toBe(true);
                            resolve();
                        }
                    );                
                });
            }, connectionTimeout);            
        
        describe(`test an non-existent file`, () => {
            [
                ["no_such_file.image"],
                ["broken_header.miriad"],
            ].map(
                function([fileName]: [string]) {
                    test(`assert the file "${fileName}" is non-existent.`, 
                    async () => {
                        await Utility.setEvent(Connection, "FILE_INFO_REQUEST", CARTA.FileInfoRequest, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName, 
                                file: fileName, 
                                hdu: "",
                            }
                        );
                        await new Promise( resolve => {                        
                            Utility.getEvent(Connection, "FILE_INFO_RESPONSE", CARTA.FileInfoResponse, 
                                (FileInfoResponse: CARTA.FileInfoResponse) => {
                                    expect(FileInfoResponse.success).toBe(false);
                                    expect(FileInfoResponse.message).toBeDefined();
                                    console.log(`Error message from reading "${fileName}": ${FileInfoResponse.message}`);
                                    resolve();
                                }
                            );
                        });             
                    }, connectionTimeout);
                } // function([ ])
            ); // map
        }); // describe

    });

    afterEach( () => {
        Connection.close();
    });
});
