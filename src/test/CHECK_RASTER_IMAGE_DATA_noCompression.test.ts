import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let connectTimeout = config.timeout.connection;
let openFileTimeout = config.timeout.openFile;
let readFileTimeout = config.timeout.readFile;

interface ImageAssertItem {
    fileId: number;
    hdu: string;
    fileInfo: any;
    fileInfoExtended: any;
    computedEntries: CARTA.IHeaderEntry[];
    headerEntries: CARTA.IHeaderEntry[];
    imageDataInfo: {
        imageBounds: {xMin: number, xMax: number, yMin: number, yMax: number};
        compressionType: CARTA.CompressionType;
        mip: number;
        channel: number;
        stokes: number;
    }
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
}
let imageAssertItem: ImageAssertItem = {
    fileId: 0,
    hdu: "0",
    fileInfo: {
        HDUList: ["0"], 
        name: "G14.114-0.574.continuum.image.pbcor.fits", 
        size: 4337280,
    },    
    fileInfoExtended: {
        stokesVals: [""],
        dimensions: 4,
        width: 1024,
        height: 1024,
        depth: 1,
        stokes: 1 
    },
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
    imageDataInfo: {
        imageBounds: {xMin: 0, xMax: 1024, yMin: 0, yMax: 1024},
        compressionType: CARTA.CompressionType.NONE,
        mip: 3,
        channel: 0,
        stokes: 0,
    },
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

describe("CHECK_RASTER_IMAGE_DATA_noCompression test: Testing message RASTER_IMAGE_DATA without compression", () => {   
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
        });
        
        describe(`Open image "${imageAssertItem.fileInfo.name}"`, () => {
            let OpenFileAckTemp: CARTA.OpenFileAck;
            test(`OPEN_FILE_ACK should arrive within ${openFileTimeout} ms.`, async () => {
                await Utility.setEvent(Connection, CARTA.OpenFile, 
                    {
                        directory: testSubdirectoryName, 
                        file: imageAssertItem.fileInfo.name,
                        fileId: imageAssertItem.fileId,
                        hdu: imageAssertItem.hdu,
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

            test(`OPEN_FILE_ACK.file_info.file_id = ${imageAssertItem.fileId}`, () => {
                expect(OpenFileAckTemp.fileId).toEqual(imageAssertItem.fileId);
            });

            test("assert OPEN_FILE_ACK.file_info", () => {
                expect(OpenFileAckTemp.fileInfo.HDUList).toEqual(imageAssertItem.fileInfo.HDUList);
                expect(OpenFileAckTemp.fileInfo.name).toEqual(imageAssertItem.fileInfo.name);
                expect(OpenFileAckTemp.fileInfo.size.toString()).toEqual(imageAssertItem.fileInfo.size.toString());
            });

            test("assert OPEN_FILE_ACK.file_info_extended", () => {                
                expect(OpenFileAckTemp.fileInfoExtended.depth).toEqual(imageAssertItem.fileInfoExtended.depth);               
                expect(OpenFileAckTemp.fileInfoExtended.height).toEqual(imageAssertItem.fileInfoExtended.height);               
                expect(OpenFileAckTemp.fileInfoExtended.width).toEqual(imageAssertItem.fileInfoExtended.width);               
                expect(OpenFileAckTemp.fileInfoExtended.stokes).toEqual(imageAssertItem.fileInfoExtended.stokes);               
                expect(OpenFileAckTemp.fileInfoExtended.stokesVals).toEqual(imageAssertItem.fileInfoExtended.stokesVals);               
                expect(OpenFileAckTemp.fileInfoExtended.dimensions).toEqual(imageAssertItem.fileInfoExtended.dimensions);
            });

            test("assert OPEN_FILE_ACK.file_info_extended.computed_entries", () => {
                imageAssertItem.computedEntries.map( (entry: CARTA.IHeaderEntry) => {
                    expect(OpenFileAckTemp.fileInfoExtended.computedEntries).toContainEqual(entry);
                });
            });

            test("assert OPEN_FILE_ACK.file_info_extended.header_entries", () => { 
                imageAssertItem.headerEntries.map( (entry: CARTA.IHeaderEntry) => {
                    expect(OpenFileAckTemp.fileInfoExtended.headerEntries).toContainEqual(entry);
                });
            });

        });

        describe(`Set image view for "${imageAssertItem.fileInfo.name}"`, () => {
            let RasterImageDataTemp: CARTA.RasterImageData;
            test(`RASTER_IMAGE_DATA should arrive within ${openFileTimeout} ms.`, async () => {
                await Utility.setEvent(Connection, CARTA.SetImageView, 
                    {
                        fileId: imageAssertItem.fileId, 
                        imageBounds: imageAssertItem.imageDataInfo.imageBounds, 
                        mip: imageAssertItem.imageDataInfo.mip, 
                        compressionType: imageAssertItem.imageDataInfo.compressionType,
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

            test(`RASTER_IMAGE_DATA.file_id = ${imageAssertItem.fileId}`, () => {
                expect(RasterImageDataTemp.fileId).toEqual(imageAssertItem.fileId);
            });

            test(`RASTER_IMAGE_DATA.image_bounds = {xMax: ${imageAssertItem.imageDataInfo.imageBounds.xMax}, yMax: ${imageAssertItem.imageDataInfo.imageBounds.yMax}}`, () => {
                expect(RasterImageDataTemp.imageBounds).toEqual({xMax: imageAssertItem.imageDataInfo.imageBounds.xMax, yMax: imageAssertItem.imageDataInfo.imageBounds.yMax});
            });

            test(`RASTER_IMAGE_DATA.compression_type = ${CARTA.CompressionType[imageAssertItem.imageDataInfo.compressionType]}`, () => {
                expect(RasterImageDataTemp.compressionType).toEqual(imageAssertItem.imageDataInfo.compressionType);
            });

            test(`RASTER_IMAGE_DATA.channel = ${imageAssertItem.imageDataInfo.channel}`, () => {
                expect(RasterImageDataTemp.channel).toEqual(imageAssertItem.imageDataInfo.channel);
            });

            test(`RASTER_IMAGE_DATA.stokes = ${imageAssertItem.imageDataInfo.stokes}`, () => {
                expect(RasterImageDataTemp.stokes).toEqual(imageAssertItem.imageDataInfo.stokes);
            });

            test("Assert RASTER_IMAGE_DATA.channel_histogram_data", () => {
                expect(RasterImageDataTemp.channelHistogramData.histograms[0].numBins).toEqual(imageAssertItem.channelHistogramData.numBins);
                expect(RasterImageDataTemp.channelHistogramData.histograms[0].bins.length).toEqual(imageAssertItem.channelHistogramData.lengthOfBins);
                expect(RasterImageDataTemp.channelHistogramData.histograms[0].binWidth).toBeCloseTo(imageAssertItem.channelHistogramData.binWidth, 8);
                expect(RasterImageDataTemp.channelHistogramData.histograms[0].firstBinCenter).toBeCloseTo(imageAssertItem.channelHistogramData.firstBinCenter, 8);
                imageAssertItem.channelHistogramData.binValue.map( item => {
                    expect(RasterImageDataTemp.channelHistogramData.histograms[0].bins[item.binIndex]).toEqual(item.value);
                });
                expect(RasterImageDataTemp.channelHistogramData.histograms[0].bins.reduce((sum, next) => sum += next)).toEqual(imageAssertItem.channelHistogramData.sumOfBinCount);
            });

            test("Assert RASTER_IMAGE_DATA.nan_encodings", () => {
                expect(RasterImageDataTemp.nanEncodings.length).toEqual(imageAssertItem.nanEncodings.length);
            });

            test("Assert RASTER_IMAGE_DATA.image_data", () => {
                let _sum: number = 0;
                RasterImageDataTemp.imageData.map(item => _sum += item.length);
                expect(_sum).toEqual(imageAssertItem.imageData.length);
                if (imageAssertItem.fileInfo.compressionType === CARTA.CompressionType.NONE) {
                    imageAssertItem.imageData.assertPoints.map( assertPoint => {
                        let _movingIndex = 4 * ( assertPoint.point.y * assertPoint.point.xMax + assertPoint.point.x );
                        expect(Buffer.from(imageAssertItem.imageData[0].slice(_movingIndex, _movingIndex + 4)).readFloatLE(0)).toBeCloseTo(assertPoint.value, 8);
                    });
                }
            });

        });
    }); 

    afterAll( () => {
        Connection.close();
    });
});