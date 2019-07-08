import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectory = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    fileOpenAck: CARTA.IOpenFileAck;
    regionHistogram: CARTA.IRegionHistogramData;
    setImageChannel: CARTA.ISetImageChannels;
    rasterTileData: CARTA.IRasterTileData;
    assert: {
        channelHistogramData: {
            numBins: number;
            lengthOfBins: number;
            binWidth: number;
            firstBinCenter: number;
            binValue: {binIndex: number, value: number}[];
            sumOfBinCount: number;
        }
        nanEncodings: {
            length: number;
        }
        imageData: {
            length: number;
            assertPoints: {point: {x: number, y: number, xMax: number}, value: number}[];
        }
    };
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "",
    },
    filelist: {directory: testSubdirectory},    
    fileOpen: {
        directory: testSubdirectory,
        file: "G14.114-0.574.continuum.image.pbcor.fits",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    fileOpenAck: {
            success: true,
            fileId: 0,
            fileInfo: {
                name: "G14.114-0.574.continuum.image.pbcor.fits",
                type: CARTA.FileType.FITS,
                size: 4337280,
                HDUList: ["0"],
            },
            fileInfoExtended: {
                dimensions: 4,
                width: 1024,
                height: 1024,
                depth: 1,
                stokes: 1,
                stokesVals: [""],
                headerEntries: [
                    {
                        name: 'BMAJ',
                        value: '0.00104662',
                        entryType: 1,
                        numericValue: 0.00104662431611 },
                    {
                        name: 'BMIN',
                        value: '0.000521827',
                        entryType: 1,
                        numericValue: 0.0005218272076713 },
                    {
                        name: 'BPA',
                        value: '86.4304',
                        entryType: 1,
                        numericValue: 86.43037414551 },
                    { name: 'LONPOLE', value: '180', entryType: 1, numericValue: 180 },
                    {
                        name: 'LATPOLE',
                        value: '-16.9498',
                        entryType: 1,
                        numericValue: -16.94981289706 },
                    { name: 'CTYPE3', value: 'FREQ' },
                    {
                        name: 'CRVAL3',
                        value: '1.04008e+11',
                        entryType: 1,
                        numericValue: 104008101097.8 },
                    {
                        name: 'CDELT3',
                        value: '4.00019e+09',
                        entryType: 1,
                        numericValue: 4000189550.454 },
                    { name: 'CRPIX3', value: '1', entryType: 1, numericValue: 1 },
                    { name: 'CUNIT3', value: 'Hz' },
                    { name: 'CTYPE4', value: 'STOKES' },
                    { name: 'CRVAL4', value: '1', entryType: 1, numericValue: 1 },
                    { name: 'CDELT4', value: '1', entryType: 1, numericValue: 1 },
                    { name: 'CRPIX4', value: '1', entryType: 1, numericValue: 1 },
                    { name: 'CUNIT4' },
                    {
                        name: 'RESTFRQ',
                        value: '1.03e+11',
                        entryType: 1,
                        numericValue: 103000000000 },
                    { name: 'VELREF', value: '259', entryType: 2, numericValue: 259 },
                ],
                computedEntries: [
                    {
                        name: 'Name',
                        value: 'G14.114-0.574.continuum.image.pbcor.fits' },
                    { name: 'Shape', value: '[1024, 1024, 1, 1]' },
                    {
                        name: 'Number of channels',
                        value: '1',
                        entryType: 2,
                        numericValue: 1 },
                    {
                        name: 'Number of Stokes',
                        value: '1',
                        entryType: 2,
                        numericValue: 1 },
                    { name: 'Coordinate type', value: 'RA---SIN, DEC--SIN' },
                    { name: 'Image reference pixels', value: '[513, 513] ' },
                    {
                        name: 'Image reference coordinates',
                        value: '[274.5623 deg, -16.9498 deg]' },
                    {
                        name: 'Image ref coords (coord type)',
                        value: '[18:18:14.9466, -016.56.59.3264]' },
                    { name: 'Celestial frame', value: 'ICRS' },
                    { name: 'Spectral frame', value: 'TOPOCENT' },
                    { name: 'Pixel unit', value: 'Jy/beam' },
                    { name: 'Pixel increment', value: '-0.50", 0.50"' },
                    { name: 'Restoring beam', value: '3.77" X 1.88", 86.4304 deg' }
                ],
            },
    },
    regionHistogram: {
        fileId: 0,
        stokes: 0,
    },
    setImageChannel: {
        fileId: 0,
        channel: 0,
        requiredTiles: {
            fileId: 0,
            tiles: [0],
            compressionType: CARTA.CompressionType.NONE,
        },
    },
    rasterTileData: {},
    assert: {
        channelHistogramData: {
            numBins: 1024,
            lengthOfBins: 1024,
            binWidth: 0.000010574989573797211,
            firstBinCenter:  -0.0012399675051710801,
            binValue: [{binIndex: 117, value: 11452}],
            sumOfBinCount: 302412,
        },
        nanEncodings: {
            length: 0,
        },
        imageData: {
            length: 465124,
            assertPoints: [
                {point: {x: 190, y: 156, xMax: 341}, value: 0.005836978}, 
                {point: {x: 155, y: 127, xMax: 341}, value: 0.0002207166},
            ],
        },
    }
}

describe("CHECK_RASTER_IMAGE_DATA_noCompression test: Testing message RASTER_IMAGE_DATA without compression", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;

        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
            await Utility.getEventAsync(this, CARTA.RegisterViewerAck);
            done();   
        }
    }, connectTimeout);
    
    describe(`Go to "${testSubdirectory}" folder`, () => {

        beforeAll( async () => {            
            await Utility.setEventAsync(Connection, CARTA.CloseFile, {fileId: -1});
        });
        
        describe(`Open image "${assertItem.fileOpen.file}"`, () => {
            let OpenFileAckTemp: CARTA.OpenFileAck;
            let RegionHistogramDataTemp: CARTA.RegionHistogramData;
            test(`OPEN_FILE_ACK should arrive within ${openFileTimeout} ms.`, async () => {
                await Utility.setEventAsync(Connection, CARTA.OpenFile, assertItem.fileOpen);
                OpenFileAckTemp = <CARTA.OpenFileAck>await Utility.getEventAsync(Connection, CARTA.OpenFileAck);
                RegionHistogramDataTemp = <CARTA.RegionHistogramData>await Utility.getEventAsync(Connection, CARTA.RegionHistogramData);
            }, openFileTimeout);            

            test(`OPEN_FILE_ACK.success = ${assertItem.fileOpenAck.success}`, () => {
                expect(OpenFileAckTemp.success).toBe(assertItem.fileOpenAck.success);
            });

            test(`OPEN_FILE_ACK.file_info.file_id = ${assertItem.fileOpenAck.fileId}`, () => {
                expect(OpenFileAckTemp.fileId).toEqual(assertItem.fileOpenAck.fileId);
            });

            test("Assert OPEN_FILE_ACK.file_info", () => {
                expect(OpenFileAckTemp.fileInfo.HDUList).toEqual(assertItem.fileOpenAck.fileInfo.HDUList);
                expect(OpenFileAckTemp.fileInfo.name).toEqual(assertItem.fileOpenAck.fileInfo.name);
                expect(OpenFileAckTemp.fileInfo.size.toString()).toEqual(assertItem.fileOpenAck.fileInfo.size.toString());
            });

            test("assert OPEN_FILE_ACK.file_info_extended", () => {                
                expect(OpenFileAckTemp.fileInfoExtended.depth).toEqual(assertItem.fileOpenAck.fileInfoExtended.depth);               
                expect(OpenFileAckTemp.fileInfoExtended.height).toEqual(assertItem.fileOpenAck.fileInfoExtended.height);               
                expect(OpenFileAckTemp.fileInfoExtended.width).toEqual(assertItem.fileOpenAck.fileInfoExtended.width);               
                expect(OpenFileAckTemp.fileInfoExtended.stokes).toEqual(assertItem.fileOpenAck.fileInfoExtended.stokes);               
                expect(OpenFileAckTemp.fileInfoExtended.stokesVals).toEqual(assertItem.fileOpenAck.fileInfoExtended.stokesVals);               
                expect(OpenFileAckTemp.fileInfoExtended.dimensions).toEqual(assertItem.fileOpenAck.fileInfoExtended.dimensions);
            });

            test("assert OPEN_FILE_ACK.file_info_extended.computed_entries", () => {
                assertItem.fileOpenAck.fileInfoExtended.computedEntries.map( (entry: CARTA.IHeaderEntry) => {
                    expect(OpenFileAckTemp.fileInfoExtended.computedEntries).toContainEqual(entry);
                });
            });

            test("assert OPEN_FILE_ACK.file_info_extended.header_entries", () => { 
                assertItem.fileOpenAck.fileInfoExtended.headerEntries.map( (entry: CARTA.IHeaderEntry) => {
                    expect(OpenFileAckTemp.fileInfoExtended.headerEntries).toContainEqual(entry);
                });
            });

            test(`REGION_HISTOGRAM_DATA.file_id = ${assertItem.regionHistogram.fileId}`, () => {
                expect(RegionHistogramDataTemp.fileId).toEqual(assertItem.regionHistogram.fileId);
            });

            test(`REGION_HISTOGRAM_DATA.stokes = ${assertItem.regionHistogram.stokes}`, () => {
                expect(RegionHistogramDataTemp.stokes).toEqual(assertItem.regionHistogram.stokes);
            });

            test("Assert REGION_HISTOGRAM_DATA.histogram", () => {
                expect(RegionHistogramDataTemp.histograms[0].numBins).toEqual(assertItem.assert.channelHistogramData.numBins);
                expect(RegionHistogramDataTemp.histograms[0].bins.length).toEqual(assertItem.assert.channelHistogramData.lengthOfBins);
                expect(RegionHistogramDataTemp.histograms[0].binWidth).toBeCloseTo(assertItem.assert.channelHistogramData.binWidth, 8);
                expect(RegionHistogramDataTemp.histograms[0].firstBinCenter).toBeCloseTo(assertItem.assert.channelHistogramData.firstBinCenter, 8);
                assertItem.assert.channelHistogramData.binValue.map( item => {
                    expect(RegionHistogramDataTemp.histograms[0].bins[item.binIndex]).toEqual(item.value);
                });
                expect(RegionHistogramDataTemp.histograms[0].bins.reduce((sum, next) => sum += next)).toEqual(assertItem.assert.channelHistogramData.sumOfBinCount);
            });
        });

        // describe(`Set image view for "${assertItem.fileOpen.file}"`, () => {
        //     let RasterImageDataTemp: CARTA.RasterImageData;
        //     test(`RASTER_IMAGE_DATA should arrive within ${openFileTimeout} ms.`, async () => {
        //         await Utility.setEventAsync(Connection, CARTA.SetImageChannels, assertItem.setImageChannel);
        //         await Utility.getEventAsync(Connection, CARTA.RasterTileData,
        //                 (RasterTileData: CARTA.RasterTileData, resolve) => {
        //                     RasterTileDataTemp = RasterTileData;
        //                     resolve();
        //                 }
        //             );
        //     }, readFileTimeout);

        //     test(`RASTER_IMAGE_DATA.image_bounds = {xMax: ${assertItem.rasterImageData.imageBounds}, yMax: ${assertItem.rasterImageData.imageBounds.yMax}}`, () => {
        //         expect(RasterImageDataTemp.imageBounds).toEqual({xMax: assertItem.rasterImageData.imageBounds.xMax, yMax: assertItem.rasterImageData.imageBounds.yMax});
        //     });

        //     test(`RASTER_IMAGE_DATA.compression_type = ${CARTA.CompressionType[assertItem.rasterImageData.compressionType]}`, () => {
        //         expect(RasterImageDataTemp.compressionType).toEqual(assertItem.rasterImageData.compressionType);
        //     });

        //     test(`RASTER_IMAGE_DATA.channel = ${assertItem.rasterImageData.channel}`, () => {
        //         expect(RasterImageDataTemp.channel).toEqual(assertItem.rasterImageData.channel);
        //     });

        //     test("Assert RASTER_IMAGE_DATA.nan_encodings", () => {
        //         expect(RasterImageDataTemp.nanEncodings.length).toEqual(assertItem.assert.nanEncodings.length);
        //     });

        //     test("Assert RASTER_IMAGE_DATA.image_data", () => {
        //         let _sum: number = 0;
        //         RasterImageDataTemp.imageData.map(item => _sum += item.length);
        //         expect(_sum).toEqual(assertItem.assert.imageData.length);
        //         if (assertItem.rasterImageData.compressionType === CARTA.CompressionType.NONE) {
        //             assertItem.assert.imageData.assertPoints.map( assertPoint => {
        //                 let _movingIndex = 4 * ( assertPoint.point.y * assertPoint.point.xMax + assertPoint.point.x );
        //                 expect(Buffer.from(RasterImageDataTemp.imageData[0].slice(_movingIndex, _movingIndex + 4)).readFloatLE(0)).toBeCloseTo(assertPoint.value, 8);
        //             });
        //         }
        //     });

        // });
    }); 

    afterAll( () => {
        Connection.close();
    });
});