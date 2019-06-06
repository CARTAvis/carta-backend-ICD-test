import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl: string = config.serverURL;
let testSubdirectoryName: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let readFileTimeout: number = config.timeout.readFile;
type AssertItem = [
    string,
    number,
    string,
    {xMin: number, xMax: number, yMin: number, yMax: number},
    number    
]
let assertItems: AssertItem[] = [
    [   "M17_SWex.fits",    0,  "0",    {xMin: 0, xMax: 640, yMin: 0, yMax: 800},   1],
    [   "M17_SWex.hdf5",    1,  "0",    {xMin: 0, xMax: 640, yMin: 0, yMax: 800},   2],
    [   "M17_SWex.image",   2,  "",     {xMin: 0, xMax: 640, yMin: 0, yMax: 800},   4],
    [   "M17_SWex.miriad",  3,  "",     {xMin: 0, xMax: 640, yMin: 0, yMax: 800},   8],
];

describe("OPEN_IMAGE_APPEND test: Testing the case of opening multiple images one by one without closing former ones", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
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
            await done();   
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectoryName}" folder`, () => {
        beforeAll( async () => {
            await Utility.setEvent(Connection, CARTA.CloseFile, 
                {
                    fileId: -1,
                }
            );
        }, connectTimeout);

        assertItems.map( function ([fileName, fileId, hdu, imageBounds, mip]: AssertItem) {
                    
            describe(`open the file "${fileName}"`, () => {
                let OpenFileAckTemp: CARTA.OpenFileAck;
                test(`OPEN_FILE_ACK should arrive within ${openFileTimeout} ms`, async () => {
                    await Utility.setEvent(Connection, CARTA.OpenFile, 
                        {
                            directory: testSubdirectoryName, 
                            file: fileName, 
                            hdu: hdu, 
                            fileId: fileId, 
                            renderMode: CARTA.RenderMode.RASTER,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.OpenFileAck, 
                            (OpenFileAck: CARTA.OpenFileAck) => {
                                OpenFileAckTemp = OpenFileAck;
                                resolve();
                            }
                        );
                        
                    });
                }, openFileTimeout);

                test("OPEN_FILE_ACK.success = true", () => {
                    expect(OpenFileAckTemp.success).toBe(true);
                });

                test(`OPEN_FILE_ACK.file_id = ${fileId}`, () => {                    
                    expect(OpenFileAckTemp.fileId).toEqual(fileId);
                });

            });

            describe(`set image view for the file "${fileName}"`, () => {
                let RasterImageDataTemp: CARTA.RasterImageData;
                test(`RASTER_IMAGE_DATA should arrive within ${readFileTimeout} ms`, async () => {
                    await Utility.setEvent(Connection, CARTA.SetImageView, 
                        {
                            fileId: fileId, 
                            imageBounds: imageBounds, 
                            mip: mip, 
                            compressionType: CARTA.CompressionType.NONE,
                            compressionQuality: 0, 
                            numSubsets: 0,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.RasterImageData, 
                            (RasterImageData: CARTA.RasterImageData) => {
                                RasterImageDataTemp = RasterImageData;
                                resolve();
                            }
                        );                
                    });
                }, readFileTimeout);

                test(`RASTER_IMAGE_DATA.file_id = ${fileId}`, () => {
                    expect(RasterImageDataTemp.fileId).toEqual(fileId);
                });

            });
            
        });
    });

    afterAll( () => {
        Connection.close();
    });
});