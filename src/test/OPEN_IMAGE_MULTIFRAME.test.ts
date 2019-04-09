import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;

let baseDirectory: string;

describe("OPEN_IMAGE_MULTIFRAME test: Testing the case of opening multiple images one by one without closing former ones", () => {   
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

    describe(`prepare to read files`, () => {
        [
            ["HH211_IQU_zoom_4ch.image.pbcor",             0,       "",        {xMin: 0, xMax:   251, yMin: 0, yMax:   251},  1],
            ["S255_IR_sci.spw25.cube.I.pbcor.fits",        1,      "0",        {xMin: 0, xMax:  1920, yMin: 0, yMax:  1920},  4],
            ["G34mm1_lsb_all.uv.part1.line.natwt.sml",     2,       "",        {xMin: 0, xMax:   129, yMin: 0, yMax:   129},  1],
            ["orion_12co_hera.hdf5",                       3,       "",        {xMin: 0, xMax:   688, yMin: 0, yMax:   575},  1],
        ].map(
            function ([testFileName,    fileId,     hdu,    imageBounds,                                              mip]: 
                      [string,          number,     string, {xMin: number, xMax: number, yMin: number, yMax: number}, number]) {
                 
                 describe(`read the file "${testFileName}" to`, 
                 () => {

                    test(`assert to open the file "${testFileName}".`, 
                    async () => {
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
                                    expect(OpenFileAck.fileId).toEqual(fileId);
                                    resolve();
                                }
                            );
                            
                        });
                    }, openFileTimeout);
                    
                    test(`assert the file ID of "${testFileName}" to be ${fileId}.`, 
                    async () => {
                        await Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
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
                        await new Promise( resolve => {
                            Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                RasterImageData => {
                                    expect(RasterImageData.fileId).toEqual(fileId);
                                    resolve();
                                }
                            );                
                        });
                    }, readFileTimeout);

                });  
            }
        );
    }); // describe

    afterAll( () => {
        Connection.close();
    });
});