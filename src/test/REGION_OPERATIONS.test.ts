import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let regionTimeout = config.timeout.region;
let returnTimeout = config.timeout.messageEvent;
interface Region {
        regionId: number;
        regionType: CARTA.RegionType;
        controlPoints: CARTA.IPoint[];
        rotation: number;
        regionName: string;
        assertRegionId: number;    
}
interface ImageAssertItem {
    fileId: number;
    fileName: string;
    hdu: string;
    imageDataInfo: {
        compressionQuality: number;
        imageBounds: CARTA.IImageBounds;
        compressionType: CARTA.CompressionType;
        mip: number;
        numSubsets: number;
    }
    regionGroup: Region[];
}
let imageAssertItem: ImageAssertItem = {
    fileId: 0,
    fileName: "M17_SWex.fits",
    hdu: "0",
    imageDataInfo: {
        compressionQuality: 11,
        imageBounds: {xMin: 0, xMax: 640, yMin: 0, yMax: 800},
        compressionType: CARTA.CompressionType.ZFP,
        mip: 2,
        numSubsets: 4,
    },
    regionGroup: [
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 197.0, y: 489.0}, {x: 10.0, y: 10.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 1,
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints:  [{x: 306.0, y: 670.0}, {x: 20.0, y: 48.0}],
            rotation: 27.0,
            regionName: "",
            assertRegionId: 2,
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.ELLIPSE,
            controlPoints: [{x: 551.0, y: 330.0}, {x: 30.0, y: 15.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 3,
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 580.0, y: 240.0}, {x: 35.0, y: 35.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 4,
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints:  [{x: 552.0, y: 184.0}, {x: 350.0, y: 18.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 5,
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints:   [{x: 635.0, y: 128.0}, {x: 25.0, y: 48.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 6,
        },
        {
            regionId: -1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 694.0, y: 80.0}, {x: 25.0, y: 33.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 7,
        },
        {
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 84.0, y: 491.0}, {x: 10.0, y: 10.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 1,
        },
        {
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 43.0, y: 491.0}, {x: 10.0, y: 10.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 1,
        },
        {
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: -1.0, y: 491.0}, {x: 10.0, y: 10.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 1,
        },
        {
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: -14.0, y: 491.0}, {x: 10.0, y: 10.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 1,
        },
        {
            regionId: 1,
            regionType: CARTA.RegionType.RECTANGLE,
            controlPoints: [{x: 197.0, y: 489.0}, {x: 10.0, y: 10.0}],
            rotation: 0.0,
            regionName: "",
            assertRegionId: 1,
        },
    ],
}

describe("REGION_OPERATIONS test: Testing region creation and modification", () => {   
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
    
    describe(`Go to "${testSubdirectory}" folder and open image "${imageAssertItem.fileName}" to set image view`, () => {

        beforeAll( async () => {
            await Utility.setEvent(Connection, CARTA.CloseFile, 
                {
                    fileId: -1,
                }
            );
            await Utility.setEvent(Connection, CARTA.OpenFile, 
                {
                    directory: testSubdirectory, 
                    file: imageAssertItem.fileName,
                    fileId: imageAssertItem.fileId,
                    hdu: imageAssertItem.hdu,
                    renderMode: CARTA.RenderMode.RASTER,
                }
            ); 
            await new Promise( resolve => {           
                Utility.getEvent(Connection, CARTA.OpenFileAck, 
                    (OpenFileAck: CARTA.OpenFileAck) => {
                        resolve();
                    }
                );
            });
            await Utility.setEvent(Connection, CARTA.SetImageView, 
                {
                    fileId: imageAssertItem.fileId, 
                    imageBounds: imageAssertItem.imageDataInfo.imageBounds, 
                    mip: imageAssertItem.imageDataInfo.mip, 
                    compressionType: imageAssertItem.imageDataInfo.compressionType,
                    compressionQuality: imageAssertItem.imageDataInfo.compressionQuality,
                    numSubsets: imageAssertItem.imageDataInfo.numSubsets,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.RasterImageData, 
                    (RasterImageData: CARTA.RasterImageData) => {
                        resolve();
                    }
                );
            });
        });

        imageAssertItem.regionGroup.map( function( region: Region) {

            describe(`${region.regionId < 0?"Creating":"Modify"} ${CARTA.RegionType[region.regionType]} region #${region.assertRegionId} on ${JSON.stringify(region.controlPoints)}`, () => {
                let SetRegionAckTemp: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                    await Utility.setEvent(Connection, CARTA.SetRegion, region);
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.SetRegionAck, 
                            (SetRegionAck: CARTA.SetRegionAck) => {
                                SetRegionAckTemp = SetRegionAck;
                                resolve();
                            }
                        );
                    });
                }, regionTimeout);

                test("SET_REGION_ACK.success = True", () => {
                    expect(SetRegionAckTemp.success).toBe(true);
                });

                test(`SET_REGION_ACK.region_id = ${region.assertRegionId}`, () => {
                    expect(SetRegionAckTemp.regionId).toEqual(region.assertRegionId);
                });

            });

        });

        describe("Remove region #3", () => {

            beforeAll( async () => {
                await Utility.setEvent(Connection, CARTA.RemoveRegion, 
                    {
                        regionId: 3,
                    }
                );
            });

            test(`should not return within ${returnTimeout} ms`, async () => {
                await new Promise( (resolve, reject) => {
                    Connection.onmessage = () => {
                        reject();
                    }
                    let failTimer = setTimeout(() => {
                        clearTimeout(failTimer);
                        resolve();
                    }, returnTimeout);
                });
            });

            describe("Modify region #3", () => {
                let SetRegionAckTemp: CARTA.SetRegionAck;
                test(`SET_REGION_ACK should return within ${regionTimeout} ms`, async () => {
                    await Utility.setEvent(Connection, CARTA.SetRegion, 
                        {
                            fileId: 0,
                            regionId: 3,
                            regionName: "",
                            regionType: CARTA.RegionType.ELLIPSE,
                            controlPoint: [{x: 551.0, y: 330.0}, {x: 30.0, y: 15.0}],
                            rotation: 30.0,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.SetRegionAck, 
                            (SetRegionAck: CARTA.SetRegionAck) => {
                                SetRegionAckTemp = SetRegionAck;
                                resolve();
                            }
                        );
                    });
                }, regionTimeout);

                test("SET_REGION_ACK.success = false", () => {
                    expect(SetRegionAckTemp.success).toBe(false);
                });

            });
        });
    }); 

    afterAll( () => {
        Connection.close();
    });
});