import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
let messageReturnTimeout = config.timeout.messageEvent;

let baseDirectory: string;

describe("ANIMATOR_NAVIGATION test: Testing using animator to see different frames of images", 
() => {   
    let Connection: WebSocket;

    beforeAll( done => {
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
            await Utility.setEvent(this, CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, CARTA.FileListResponse, 
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
    
    [
        ["HH211_IQU_zoom_4ch.image.pbcor",             0,       "",        {xMin: 0, xMax:   251, yMin: 0, yMax:   251},  1],
        ["S255_IR_sci.spw25.cube.I.pbcor.fits",        1,      "0",        {xMin: 0, xMax:  1920, yMin: 0, yMax:  1920},  4],
    ].map(
        function ([testFileName,    fileId,     hdu,    imageBounds,                                              mip]: 
                    [string,          number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number]) {
            
            test(`assert file name ${testFileName} with file id: ${fileId} ready.`, 
            async () => {
                await Utility.setEvent(Connection, CARTA.OpenFile, 
                    {
                        directory: baseDirectory + "/" + testSubdirectoryName, 
                        file: testFileName, 
                        hdu, 
                        fileId, 
                        renderMode: CARTA.RenderMode.RASTER,
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, CARTA.OpenFileAck, 
                        OpenFileAck => {
                            expect(OpenFileAck.success).toBe(true);
                            resolve();
                        }
                    );
                    
                });
                await Utility.setEvent(Connection, CARTA.SetImageView, 
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
                    Utility.getEvent(Connection, CARTA.RasterImageData, 
                        RasterImageData => {
                            expect(RasterImageData.fileId).toEqual(fileId);
                            resolve();
                        }
                    );                        
                });
            }, openFileTimeout);                
        }
    );

    test(`assert image channel to be 0 on file ID 0.`, 
    async () => {
        await Utility.setEvent(Connection, CARTA.SetImageChannels, 
            {
                fileId: 0, 
                channel: 1, 
                stokes: 1,
            }
        );
        await new Promise( resolve => {
            Utility.getEvent(Connection, CARTA.RasterImageData, 
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
    }, readFileTimeout);

    test(`assert image channel to be 100 on file ID 1.`, 
    async () => {
        await Utility.setEvent(Connection, CARTA.SetImageChannels, 
            {
                fileId: 1, 
                channel: 100,
            }
        );
        await new Promise( resolve => {
            Utility.getEvent(Connection, CARTA.RasterImageData, 
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
    }, readFileTimeout);

    afterAll( () => {
        Connection.close();
    });
});

describe("ANIMATOR_NAVIGATION_ERROR test: Testing error handle of animator", 
() => {   
    let Connection: WebSocket;

    beforeAll( done => {
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
            await Utility.setEvent(this, CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(this, CARTA.FileListResponse, 
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
    
    [
        ["HH211_IQU_zoom_4ch.image.pbcor",             0,       "",        {xMin: 0, xMax:   251, yMin: 0, yMax:   251},  1],
        ["S255_IR_sci.spw25.cube.I.pbcor.fits",        1,      "0",        {xMin: 0, xMax:  1920, yMin: 0, yMax:  1920},  4],
    ].map(
        function ([testFileName,    fileId,     hdu,    imageBounds,                                              mip]: 
                    [string,          number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number]) {
            
            test(`assert file name ${testFileName} with file id: ${fileId} ready.`, 
            async () => { 
                await Utility.setEvent(Connection, CARTA.OpenFile, 
                    {
                        directory: baseDirectory + "/" + testSubdirectoryName, 
                        file: testFileName, 
                        hdu, 
                        fileId, 
                        renderMode: CARTA.RenderMode.RASTER,
                    }
                );
                await new Promise( resolve => {
                    Utility.getEvent(Connection, CARTA.OpenFileAck, 
                        OpenFileAck => {
                            expect(OpenFileAck.success).toBe(true);
                            resolve();
                        }
                    );
                    
                });
                await Utility.setEvent(Connection, CARTA.SetImageView, 
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
                    Utility.getEvent(Connection, CARTA.RasterImageData, 
                        RasterImageData => {
                            expect(RasterImageData.fileId).toEqual(fileId);
                            resolve();
                        }
                    );                        
                });
            }, openFileTimeout);
                            
        }
    );

    test(`assert no returning message (image channel: 1000 & stokes: 3 on file ID 0).`, 
    async () => {
        await Utility.setEvent(Connection, CARTA.SetImageChannels, 
            {
                fileId: 0, 
                channel: 100, 
                stokes: 3,
            }
        );
        await new Promise( resolve => {
            Connection.onmessage = (messageEvent: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
            };
            let Timer = setTimeout(() => {
                clearTimeout(Timer);
                resolve();
            }, messageReturnTimeout);      
        });
    }, readFileTimeout);

    test(`assert no returning message (image channel: 3000 & stokes: 1 on file ID 1).`, 
    async () => { 
        await Utility.setEvent(Connection, CARTA.SetImageChannels, 
            {
                fileId: 1, 
                channel: 3000, 
                stokes: 1,
            }
        );
        await new Promise( resolve => {
            Connection.onmessage = (messageEvent: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
            };
            let Timer = setTimeout(() => {
                clearTimeout(Timer);
                resolve();
            }, messageReturnTimeout);      
        });
    }, readFileTimeout); 

    test(`assert no returning message (image channel: 0 & stokes: 0 on file ID 2).`, 
    async () => {
        await Utility.setEvent(Connection, CARTA.SetImageChannels, 
            {
                fileId: 2, 
                channel: 0, 
                stokes: 0,
            }
        );
        await new Promise( resolve => {
            Connection.onmessage = (messageEvent: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
            };
            let Timer = setTimeout(() => {
                clearTimeout(Timer);
                resolve();
            }, messageReturnTimeout);      
        });
    }, readFileTimeout); 

    afterAll( () => {
        Connection.close();
    });
});