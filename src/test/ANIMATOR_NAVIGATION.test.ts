/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let baseDirectory: string;
let messageReturnTimeout = 200;

describe("ANIMATOR_NAVIGATION tests", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
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
            await Utility.setEvent(this, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                        FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        baseDirectory = FileListResponseBase.directory;
                        resolve();
                    }
                );                
            });
            done();
        }        
    }, connectionTimeout);

    describe(`read the files`, () => {
        [
         ["HH211_IQU_zoom_4ch.image.pbcor",             0,       "",        {xMin: 0, xMax:   251, yMin: 0, yMax:   251},  1],
         ["S255_IR_sci.spw25.cube.I.pbcor.fits",        1,      "0",        {xMin: 0, xMax:  1920, yMin: 0, yMax:  1920},  4],
        ].map(
            function ([testFileName,    fileId,     hdu,    imageBounds,                                              mip]: 
                      [string,          number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number]) {
                
                test(`assert file name ${testFileName} with file id: ${fileId} ready.`, 
                async done => {
                    await Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                        {
                            directory: baseDirectory + "/" + testSubdirectoryName, 
                            file: testFileName, 
                            hdu, 
                            fileId, 
                            renderMode: CARTA.RenderMode.RASTER,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                            OpenFileAck => {
                                expect(OpenFileAck.success).toBe(true);
                                resolve();
                            }
                        );
                        
                    });
                    await Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                        {
                            fileId, 
                            imageBounds: {
                                xMin: imageBounds.xMin, 
                                xMax: imageBounds.xMax, 
                                yMin: imageBounds.yMin, 
                                yMax: imageBounds.yMax,
                            }, 
                            mip, 
                            compressionType: CARTA.CompressionType.NONE,
                            compressionQuality: 0, 
                            numSubsets: 0,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                            RasterImageData => {
                                expect(RasterImageData.fileId).toEqual(fileId);
                                resolve();
                            }
                        );                        
                    });
                    done();
                }, openFileTimeout);                
            }
        );
    }); // describe

    test(`assert image channel to be 0 on file ID 0.`, 
    async done => {
        await Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 0, 
                channel: 1, 
                stokes: 1,
            }
        );
        await new Promise( resolve => {
            Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                RasterImageData => {
                    expect(RasterImageData.fileId).toEqual(0);
                    expect(RasterImageData.channel).toEqual(1);
                    expect(RasterImageData.stokes).toEqual(1);
                    expect(RasterImageData.imageBounds).toEqual({xMax:   251, yMax:   251});
                    expect(RasterImageData.mip).toEqual(1);
                    resolve();
                }
            );
        });
        done();
    }, readFileTimeout); // test

    test(`assert image channel to be 100 on file ID 1.`, 
    async done => {
        await Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 1, 
                channel: 100,
            }
        );
        await new Promise( resolve => {
            Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                RasterImageData => {
                    expect(RasterImageData.fileId).toEqual(1);
                    expect(RasterImageData.channel).toEqual(100);
                    expect(RasterImageData.stokes).toEqual(0);
                    expect(RasterImageData.imageBounds).toEqual({xMax:   1920, yMax:   1920});
                    expect(RasterImageData.mip).toEqual(4);
                    resolve();
                }
            );
        });
        done();
    }, readFileTimeout); // test

    afterAll( done => {
        Connection.close();
        done();
    });
});

describe("ANIMATOR_NAVIGATION_ERROR tests", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
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
            await Utility.setEvent(this, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                        FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        baseDirectory = FileListResponseBase.directory;
                        resolve();
                    }
                );                
            });
            done();
        }
    }, connectionTimeout);

    describe(`read the files`, () => {
        [
         ["HH211_IQU_zoom_4ch.image.pbcor",             0,       "",        {xMin: 0, xMax:   251, yMin: 0, yMax:   251},  1],
         ["S255_IR_sci.spw25.cube.I.pbcor.fits",        1,      "0",        {xMin: 0, xMax:  1920, yMin: 0, yMax:  1920},  4],
        ].map(
            function ([testFileName,    fileId,     hdu,    imageBounds,                                              mip]: 
                      [string,          number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number]) {
                
                test(`assert file name ${testFileName} with file id: ${fileId} ready.`, 
                async done => { 
                    await Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                        {
                            directory: baseDirectory + "/" + testSubdirectoryName, 
                            file: testFileName, 
                            hdu, 
                            fileId, 
                            renderMode: CARTA.RenderMode.RASTER,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                            OpenFileAck => {
                                expect(OpenFileAck.success).toBe(true);
                                resolve();
                            }
                        );
                        
                    });
                    await Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                        {
                            fileId, 
                            imageBounds: {
                                xMin: imageBounds.xMin, 
                                xMax: imageBounds.xMax, 
                                yMin: imageBounds.yMin, 
                                yMax: imageBounds.yMax,
                            }, 
                            mip, 
                            compressionType: CARTA.CompressionType.NONE,
                            compressionQuality: 0, 
                            numSubsets: 0,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                            RasterImageData => {
                                expect(RasterImageData.fileId).toEqual(fileId);
                                resolve();
                            }
                        );                        
                    });
                    done();
                }, openFileTimeout);
                                
            }
        );
    }); // describe

    test(`assert not returns (image channel: 1000 & stokes: 3 on file ID 0).`, 
    async done => {
        await Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 0, 
                channel: 100, 
                stokes: 3,
            }
        );
        await new Promise( resolve => {
            setTimeout( () => { 
                expect.assertions(1);
                
                Connection.onmessage = (messageEvent: MessageEvent) => {
                    let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                    return expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
                }; // onmessage "RASTER_IMAGE_DATA"

                expect(Connection.readyState).toBe(WebSocket.OPEN);

                resolve();
            }, messageReturnTimeout);
        });        
        done();
    }, readFileTimeout); // test

    test(`assert not returns (image channel: 3000 & stokes: 1 on file ID 1).`, 
    async done => { 
        await Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 1, 
                channel: 3000, 
                stokes: 1,
            }
        );
        await new Promise( resolve => {
            setTimeout( () => {
                expect.assertions(2); 
                // While receive a message
                Connection.onmessage = (messageEvent: MessageEvent) => {
                    let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                    return expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
                }; // onmessage "RASTER_IMAGE_DATA"

                expect(Connection.readyState).toBe(WebSocket.OPEN);

                resolve();
            }, messageReturnTimeout);
        });
        done();
    }, readFileTimeout); // test

    test(`assert not returns (image channel: 0 & stokes: 0 on file ID 2).`, 
    async done => {
        await Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 2, 
                channel: 0, 
                stokes: 0,
            }
        );
        await new Promise( resolve => {
            setTimeout( () => { 
                expect.assertions(2);
                // While receive a message
                Connection.onmessage = (messageEvent: MessageEvent) => {
                    let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                    return expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
                }; // onmessage "RASTER_IMAGE_DATA"

                expect(Connection.readyState).toBe(1);

                done();
            }, messageReturnTimeout);
        });
        
        done();
    }, readFileTimeout); // test

    afterAll( done => {
        Connection.close();
        done();
    });
});