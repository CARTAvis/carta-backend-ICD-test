/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectionTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

describe("OPEN_IMAGE_MULTIFRAME tests", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        // Establish a websocket connection in the binary form: arraybuffer 
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        // While open a Websocket
        Connection.onopen = () => {
            // Checkout if Websocket server is ready
            if (Connection.readyState === WebSocket.OPEN) {                
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(true);
                        Utility.getEvent(Connection, "FILE_LIST_RESPONSE", CARTA.FileListResponse, 
                            (FileListResponse: CARTA.FileListResponse) => {
                                expect(FileListResponse.success).toBe(true);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "FILE_LIST_REQUEST", CARTA.FileListRequest, 
                            {
                                directory: testSubdirectoryName
                            }
                        );
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
                done();
            }            
        };
    }, connectionTimeout);

    describe(`read the files`, () => {
        [
            ["HH211_IQU_zoom_4ch.image.pbcor",             0,       "",        {xMin: 0, xMax:   251, yMin: 0, yMax:   251},  1],
            ["S255_IR_sci.spw25.cube.I.pbcor.fits",        1,      "0",        {xMin: 0, xMax:  1920, yMin: 0, yMax:  1920},  4],
            ["G34mm1_lsb_all.uv.part1.line.natwt.sml",     2,       "",        {xMin: 0, xMax:   129, yMin: 0, yMax:   129},  1],
        ].map(
            function ([testFileName,    fileId,     hdu,    imageBounds,                                              mip]: 
                      [string,          number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number]) {
                 
                 describe(`read the file "${testFileName}"`, 
                 () => {

                    test(`assert the file "${testFileName}" to open.`, 
                    done => {                    
                        Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                            (OpenFileAck: CARTA.OpenFileAck) => {
                                expect(OpenFileAck.success).toBe(true);
                                expect(OpenFileAck.fileId).toEqual(fileId);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                            {
                                directory: testSubdirectoryName, 
                                file: testFileName, 
                                hdu, 
                                fileId, 
                                renderMode: CARTA.RenderMode.RASTER,
                            }
                        );
                    }, openFileTimeout);
                    
                    test(`assert the file id of "${testFileName}" to be ${fileId}.`, 
                    done => {
                        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                            (RasterImageData: CARTA.RasterImageData) => {
                                expect(RasterImageData.fileId).toEqual(fileId);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                            {
                                fileId, 
                                imageBounds: {
                                    xMin: imageBounds.xMin, xMax: imageBounds.xMax, 
                                    yMin: imageBounds.yMin, yMax: imageBounds.yMax,
                                }, 
                                mip, 
                                compressionType: CARTA.CompressionType.NONE,
                                compressionQuality: 0, 
                                numSubsets: 0, 
                            }
                        );
                    }, readFileTimeout); // test

                });      

            }
        );
    }); // describe

    afterAll( done => {
        Connection.close();
        done();
    });
});