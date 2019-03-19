import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectBasePath = config.path.base;
let connectionTimeout = config.timeout.connection;

let baseDirectory: string;
let testFileName = "G14.114-0.574.continuum.image.pbcor.fits";

describe("CHECK_RASTER_IMAGE_DATA_noCompression test: Testing message RASTER_IMAGE_DATA without compression", 
() => {   
    let Connection: WebSocket;

    beforeEach( done => {
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
    // test.only(``,() => {});
    describe(`test the file "${testFileName}"`, 
    () => {
        
        test(`assert the file "${testFileName}" info be able to read.`, 
        done => {            
            Utility.getEvent(Connection, "FILE_INFO_RESPONSE", CARTA.FileInfoResponse, 
                FileInfoResponse => {
                    expect(FileInfoResponse.success).toBe(true);
                    done();
                }
            );
            Utility.setEvent(Connection, "FILE_INFO_REQUEST", CARTA.FileInfoRequest, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0",
                }
            );
        }, connectionTimeout); // test

        test(`assert the file "${testFileName}" be able to open.`, 
        done => {
            Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                OpenFileAck => {
                    expect(OpenFileAck.success).toBe(true);
                    done();
                }
            );
            Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0", 
                    fileId: 0, 
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
        }, connectionTimeout); // test

        test(`assert the file "${testFileName}" image be able to read.`, 
        done => {       
            Event1(Connection);
            function Event1 (connection: WebSocket) {     
                Utility.getEvent(connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                    OpenFileAck => {
                        expect(OpenFileAck.success).toBe(true);
                        Event2(connection, OpenFileAck);                        
                    }
                );
                Utility.setEvent(connection, "OPEN_FILE", CARTA.OpenFile, 
                    {
                        directory: baseDirectory + "/" + testSubdirectoryName, 
                        file: testFileName, 
                        hdu: "0", 
                        fileId: 0, 
                        renderMode: CARTA.RenderMode.RASTER,
                    }
                );
            }
            function Event2 (connection: WebSocket, OpenFileAck: CARTA.OpenFileAck) {
                Utility.getEvent(connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                    RasterImageData => {
                        expect(RasterImageData.imageData.length).toBeGreaterThan(0);
                        done();
                    }
                );
                Utility.setEvent(connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                    {
                        fileId: 0, 
                        imageBounds: {
                            xMin: 0, xMax: OpenFileAck.fileInfoExtended.width, 
                            yMin: 0, yMax: OpenFileAck.fileInfoExtended.height
                        }, 
                        mip: 3, 
                        compressionType: CARTA.CompressionType.ZFP, 
                        compressionQuality: 11, 
                        numSubsets: 4,
                    }
                );
            } 
        }, connectionTimeout); // test
    }); // describe

    describe(`open the file "${testFileName} and ...`, 
    () => {
        let OpenFileAckTemp: CARTA.OpenFileAck;
        beforeEach( 
        done => {
            Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                OpenFileAck => {
                    expect(OpenFileAck.success).toBe(true);
                    OpenFileAckTemp = OpenFileAck;
                    done();
                }
            );
            Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0", 
                    fileId: 0, 
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
        }, connectionTimeout);       
        
        test(`assert the returned message.`, 
        () => {
            expect(OpenFileAckTemp.success).toBe(true);
            expect(OpenFileAckTemp.fileId).toBe(0);
        });

        test(`assert "file info".`, 
        () => {
            expect(OpenFileAckTemp.fileInfo.HDUList).toEqual(["0"]);
            expect(OpenFileAckTemp.fileInfo.name).toBe(testFileName);
        });

        test(`assert "file info extended".`, 
        () => {
            expect(OpenFileAckTemp.fileInfoExtended.depth).toEqual(1);
            expect(OpenFileAckTemp.fileInfoExtended.height).toEqual(1024);
            expect(OpenFileAckTemp.fileInfoExtended.width).toEqual(1024);
            expect(OpenFileAckTemp.fileInfoExtended.stokes).toEqual(1);
            expect(OpenFileAckTemp.fileInfoExtended.stokesVals).toEqual([""]);
            expect(OpenFileAckTemp.fileInfoExtended.dimensions).toEqual(4);
        }); 

        test(`assert "file info extended headerEntries".`, 
        () => {
            expect(parseInt(OpenFileAckTemp.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS").value)).toEqual(4);
            expect(parseInt(OpenFileAckTemp.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS1").value)).toEqual(1024);
            expect(parseInt(OpenFileAckTemp.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS2").value)).toEqual(1024);
            expect(parseInt(OpenFileAckTemp.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS3").value)).toEqual(1);
            expect(parseInt(OpenFileAckTemp.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS4").value)).toEqual(1);

            expect(OpenFileAckTemp.fileInfoExtended.headerEntries.find( f => f.name === "RADESYS").value).toEqual("ICRS");
        });

    });    

    describe(`open the file "${testFileName} and read image data ...`, 
    () => {
        beforeEach( 
        done => {            
            Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                OpenFileAck => {
                    expect(OpenFileAck.success).toBe(true);
                    done();
                }
            );
            Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                {
                    directory: baseDirectory + "/" + testSubdirectoryName, 
                    file: testFileName, 
                    hdu: "0", 
                    fileId: 0, 
                    renderMode: CARTA.RenderMode.RASTER,
                }
            );
        }, connectionTimeout);

        describe(`test raster image data with extended info.`, () => {
            [[0, {xMin: 0, xMax: 1024, yMin: 0, yMax: 1024}, 3, CARTA.CompressionType.NONE, 0, 4, 465124, 0, 0, 
                    1024, 1024, 0.000010574989573797211, -0.0012399675051710801, {idx: 117, value: 11452}, 302412, 
                    {point: {x: 190, y: 156, xMax: 341}, value: 0.005836978}, {point: {x: 155, y: 127, xMax: 341}, value: 0.0002207166}],
             
            ].map(
                function([fileId, imageBounds, mip, compressionType, compressionQuality, numSubsets, imageDataLength, channel, stokes, 
                            numBins, binsLength, binWidth, firstBinCenter, binsValue, channelHistogramSum, 
                            assertPoint1, assertPoint2]: 
                         [number, {xMin: number, xMax: number, yMin: number, yMax: number}, number, CARTA.CompressionType, number, number, number, number, number, 
                            number, number, number, number, {idx: number, value: number}, number, 
                            {point: {x: number, y: number, xMax: number}, value: number}, {point: {x: number, y: number, xMax: number}, value: number}]) {
                    
                    test(`assert the file returns correct image info.`, 
                    done => {
                        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                            RasterImageData => {
                                expect(RasterImageData.fileId).toEqual(fileId);
                                expect(RasterImageData.imageBounds).toEqual({xMax: imageBounds.xMax, yMax: imageBounds.yMax});
                                expect(RasterImageData.compressionType).toEqual(compressionType);
                                if (RasterImageData.compressionType !== CARTA.CompressionType.NONE) {
                                    expect(RasterImageData.compressionQuality).toEqual(compressionQuality);                                        
                                }
                                expect(RasterImageData.mip).toEqual(mip);
                                expect(RasterImageData.channel).toEqual(channel);
                                expect(RasterImageData.stokes).toEqual(stokes);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                            {
                                fileId, 
                                imageBounds, 
                                mip, 
                                compressionType, 
                                compressionQuality, 
                                numSubsets,
                            }
                        );
                    }, connectionTimeout);

                    test(`assert channel histogram data.`, 
                    done => {                        
                        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                            RasterImageData => {
                                let channelHistogram = RasterImageData.channelHistogramData.histograms[0];
                                expect(channelHistogram.numBins).toEqual(numBins);
                                expect(channelHistogram.bins.length).toEqual(binsLength);
                                expect(channelHistogram.binWidth).toBeCloseTo(binWidth, 12);
                                expect(channelHistogram.firstBinCenter).toBeCloseTo(firstBinCenter, 9);
                                expect(channelHistogram.bins[binsValue.idx]).toEqual(binsValue.value);

                                let HistogramSum = 0;
                                channelHistogram.bins.forEach((x) => HistogramSum += x );
                                expect(HistogramSum).toEqual(channelHistogramSum);
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                            {
                                fileId, 
                                imageBounds, 
                                mip, 
                                compressionType, 
                                compressionQuality, 
                                numSubsets,
                            }
                        );                                       
                    }, connectionTimeout);

                    test(`assert nan_encodings is empty.`, 
                    done => {
                        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                            RasterImageData => {
                                let nanEncodings = RasterImageData.nanEncodings;
                                if (compressionType === CARTA.CompressionType.NONE) {
                                    expect(nanEncodings.length).toEqual(0);
                                } else {
                                    expect(nanEncodings.length).toBeGreaterThan(0);
                                } 
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                            {
                                fileId, 
                                imageBounds, 
                                mip, 
                                compressionType, 
                                compressionQuality, 
                                numSubsets,
                            }
                        );                                                            
                    } , connectionTimeout);

                    test(`assert data value at position (${assertPoint1.point.x}, ${assertPoint1.point.y}) & (${assertPoint2.point.x}, ${assertPoint2.point.y}).`, 
                    done => {
                        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                            RasterImageData => {
                                let imageData = RasterImageData.imageData;
                                let imageDataSum = 0;
                                imageData.forEach((x) => imageDataSum += x.length );
                                expect(imageDataSum).toEqual(imageDataLength);

                                if (compressionType === CARTA.CompressionType.NONE) {
                                    let movingIndex = 4 * ( assertPoint1.point.y * assertPoint1.point.xMax + assertPoint1.point.x );
                                    expect(Buffer.from(imageData[0].slice(movingIndex, movingIndex + 4)).readFloatLE(0)).toBeCloseTo(assertPoint1.value, 8);
                                    
                                    movingIndex = 4 * ( assertPoint2.point.y * assertPoint2.point.xMax + assertPoint2.point.x );
                                    expect(Buffer.from(imageData[0].slice(movingIndex, movingIndex + 4)).readFloatLE(0)).toBeCloseTo(assertPoint2.value, 8);
                                }
                                done();
                            }
                        );
                        Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
                            {
                                fileId, 
                                imageBounds, 
                                mip, 
                                compressionType, 
                                compressionQuality, 
                                numSubsets,
                            }
                        );                                            
                    }, connectionTimeout);

                } // function([ ])
            ); // map
        }); // describe

    });

    afterEach( done => {
        Connection.close();
        done();
    });
});