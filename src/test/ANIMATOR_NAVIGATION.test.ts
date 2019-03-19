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

        function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            Event1(this);
        }
        function Event1 (connection: WebSocket) {
            Utility.getEvent(connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                RegisterViewerAck => {
                    expect(RegisterViewerAck.success).toBe(true);
                    Event2(connection);
                }
            );
            Utility.setEvent(connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "1234"
                }
            );
        }
        function Event2 (connection: WebSocket) {
            Utility.getEvent(connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponseBase => {
                    expect(FileListResponseBase.success).toBe(true);
                    baseDirectory = FileListResponseBase.directory;
                    done();
                }
            );
            Utility.setEvent(connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
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
                done => {
                    Event1(Connection);

                    function Event1 (connection: WebSocket) {
                        Utility.getEvent(connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                            OpenFileAck => {
                                expect(OpenFileAck.success).toBe(true);
                                Event2(Connection);
                            }
                        );
                        Utility.setEvent(connection, "OPEN_FILE", CARTA.OpenFile, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName, 
                                file: testFileName, 
                                hdu, 
                                fileId, 
                                renderMode: CARTA.RenderMode.RASTER,
                            }
                        );
                    }
                    function Event2 (connection: WebSocket) {
                        Utility.getEvent(connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                            RasterImageData => {
                                expect(RasterImageData.fileId).toEqual(fileId);
                                done();
                            }
                        );
                        Utility.setEvent(connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
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
                    }
                }, openFileTimeout);
                
            }
        );
    }); // describe

    test(`assert image channel to be 0 on file ID 0.`, 
    done => {
        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
            RasterImageData => {
                expect(RasterImageData.fileId).toEqual(0);
                expect(RasterImageData.channel).toEqual(1);
                expect(RasterImageData.stokes).toEqual(1);
                expect(RasterImageData.imageBounds).toEqual({xMax:   251, yMax:   251});
                expect(RasterImageData.mip).toEqual(1);
                done();
            }
        );
        Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 0, 
                channel: 1, 
                stokes: 1,
            }
        );
    }, readFileTimeout); // test

    test(`assert image channel to be 100 on file ID 1.`, 
    done => {
        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
            RasterImageData => {
                expect(RasterImageData.fileId).toEqual(1);
                expect(RasterImageData.channel).toEqual(100);
                expect(RasterImageData.stokes).toEqual(0);
                expect(RasterImageData.imageBounds).toEqual({xMax:   1920, yMax:   1920});
                expect(RasterImageData.mip).toEqual(4);
                done();
            }
        );
        Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 1, 
                channel: 100,
            }
        );
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

        function OnOpen (this: WebSocket, ev: Event) {
            expect(this.readyState).toBe(WebSocket.OPEN);
            Event1(this);
        }
        function Event1 (connection: WebSocket) {
            Utility.getEvent(connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                RegisterViewerAck => {
                    expect(RegisterViewerAck.success).toBe(true);
                    Event2(connection);
                }
            );
            Utility.setEvent(connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                {
                    sessionId: "", 
                    apiKey: "1234"
                }
            );
        }
        function Event2 (connection: WebSocket) {
            Utility.getEvent(connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                FileListResponseBase => {
                    expect(FileListResponseBase.success).toBe(true);
                    baseDirectory = FileListResponseBase.directory;
                    done();
                }
            );
            Utility.setEvent(connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                {
                    directory: expectBasePath
                }
            );
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
                done => { 
                    Event1(Connection);

                    function Event1 (connection: WebSocket) {
                        Utility.getEvent(connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                            (OpenFileAck: CARTA.OpenFileAck) => {
                                expect(OpenFileAck.success).toBe(true);
                                Event2(connection);
                            }
                        );
                        Utility.setEvent(connection, "OPEN_FILE", CARTA.OpenFile, 
                            {
                                directory: baseDirectory + "/" + testSubdirectoryName, 
                                file: testFileName, 
                                hdu, 
                                fileId, 
                                renderMode: CARTA.RenderMode.RASTER,
                            }
                        );
                    }
                    function Event2 (connection: WebSocket) {
                        Utility.getEvent(connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                            (RasterImageData: CARTA.RasterImageData) => {
                                expect(RasterImageData.fileId).toEqual(fileId);
                                done();
                            }
                        );
                        Utility.setEvent(connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
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
                    }
                }, openFileTimeout);
                                
            }
        );
    }); // describe

    test(`assert not returns (image channel: 1000 & stokes: 3 on file ID 0).`, 
    done => {
        setTimeout( () => { 
            expect.assertions(1);
            
            Connection.onmessage = (messageEvent: MessageEvent) => {
                let eventName = Utility.getEventName(new Uint8Array(messageEvent.data, 0, 32));
                return expect(eventName).not.toEqual("RASTER_IMAGE_DATA");
            }; // onmessage "RASTER_IMAGE_DATA"

            expect(Connection.readyState).toBe(1);

            done();
        }, messageReturnTimeout);
        Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 0, 
                channel: 100, 
                stokes: 3,
            }
        );
    }, readFileTimeout); // test

    test(`assert not returns (image channel: 3000 & stokes: 1 on file ID 1).`, 
    done => { 
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
        Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 1, 
                channel: 3000, 
                stokes: 1,
            }
        );
    }, readFileTimeout); // test

    test(`assert not returns (image channel: 0 & stokes: 0 on file ID 2).`, 
    done => {
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
        Utility.setEvent(Connection, "SET_IMAGE_CHANNELS", CARTA.SetImageChannels, 
            {
                fileId: 2, 
                channel: 0, 
                stokes: 0,
            }
        );
    }, readFileTimeout); // test

    afterAll( done => {
        Connection.close();
        done();
    });
});