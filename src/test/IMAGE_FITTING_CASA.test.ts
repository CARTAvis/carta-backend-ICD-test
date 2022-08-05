import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL;
let testSubdirectory: string = config.path.QA;
let connectTimeout: number = config.timeout.connection;
let openFileTimeout: number = config.timeout.openFile;
let imageFittingTimeout: number = config.timeout.imageFitting;

interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
    fileOpen: CARTA.IOpenFile;
    addTilesReq: CARTA.IAddRequiredTiles;
    setCursor: CARTA.ISetCursor;
    fittingRequest: CARTA.IFittingRequest[];
    fittingResponse: CARTA.IFittingResponse[];
    precisionDigits: number;
};

let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    filelist: { directory: testSubdirectory },
    fileOpen: {
        directory: testSubdirectory,
        file: "M17_SWex-channel0-addOneGaussian.image",
        hdu: "0",
        fileId: 0,
        renderMode: CARTA.RenderMode.RASTER,
    },
    addTilesReq: {
        fileId: 0,
        compressionQuality: 11,
        compressionType: CARTA.CompressionType.ZFP,
        tiles: [0],
    },    
    setCursor: {
        fileId: 0,
        point: { x: 1, y: 1 },
    },
    fittingRequest: [
        {
            fileId: 0,
            fixedParams: [],
            fovInfo: null,
            regionId: -1, 
            initialValues: [{amp: 10, center: {x: 320, y: 400}, fwhm: {x: 100, y: 50}, pa: 135}]
        },
        {
            fileId: 0,
            fixedParams: [],
            fovInfo: {
                controlPoints: [{x:319.5, y:399.5}, {x: 216.70644391408112, y: 199.99999999999997}],
                regionType: 3,
                rotation: 0,
            },
            regionId: 0, 
            initialValues: [{amp: 10, center: {x: 320, y: 400}, fwhm: {x: 100, y: 50}, pa: 135}]
        }
    ],
    fittingResponse: [
        {
            resultValues: [
                {
                    center: {x: 319.4995814506346, y: 399.4997816490029}, 
                    amp: 9.999559472737332,
                    fwhm: {x: 170.63727122575295, y: 41.48182201673784},
                    pa: 142.16266600131718
                }
            ],
            resultErrors: [
                {
                    center: {x: 0.0004006969240219716, y: 0.0005001794973076322},
                    amp: 0.00003971187313364324,
                    fwhm: {x: 0.0008773295469374465, y: 0.00021417449809861666},
                    pa: 0.00020655506565535857
                }
            ],
            success: true,
            log: 'Gaussian fitting with 1 component'
        },
        {
            resultValues: [
                {
                    center: {x: 319.498940837943, y: 399.4988615251924}, 
                    amp: 9.999454722592997,
                    fwhm: {x: 170.6382683676851, y: 41.48206117869241},
                    pa: 142.16251357416306
                }
            ],
            resultErrors: [
                {
                    center: {x: 0.00010950493723812066, y: 0.0001246435132691238},
                    amp: 0.000020566430029630594,
                    fwhm: {x: 0.0004562033522657872, y: 0.00010502008093686605},
                    pa: 0.00010562266856995906
                }
            ],
            success: true,
            log: 'Gaussian fitting with 1 component'
        }
    ],
    precisionDigits: 2,
};

describe("IMAGE_FITTING_CASA test: Testing Image Fitting (with and without fov) with casa file.", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.register);
    }, connectTimeout);

    test(`Connection open? | `, () => {
        expect(Connection.connection.readyState).toBe(WebSocket.OPEN);
    });

    describe(`Go to "${assertItem.filelist.directory}" folder`, () => {
        beforeAll(async () => {
            await Connection.send(CARTA.CloseFile, { fileId: -1 });
        }, connectTimeout);

        describe(`(Step 0) Initialization: open the image`, () => {
            test(`OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async () => {
                await Connection.send(CARTA.CloseFile, { fileId: 0 });
                await Connection.openFile(assertItem.fileOpen);
            }, openFileTimeout);

            let ack: AckStream;
            test(`return RASTER_TILE_DATA(Stream) and check total length `, async () => {
                await Connection.send(CARTA.AddRequiredTiles, assertItem.addTilesReq);
                await Connection.send(CARTA.SetCursor, assertItem.setCursor);

                ack = await Connection.streamUntil((type, data) => type == CARTA.RasterTileSync ? data.endSync : false);
                expect(ack.RasterTileData.length).toBe(assertItem.addTilesReq.tiles.length);
            }, openFileTimeout);

        });

        describe(`(Case 1) Image fitting without FoV:`, ()=>{
            test(`Send Image fitting request and match the result`, async()=>{
                await Connection.send(CARTA.FittingRequest, assertItem.fittingRequest[0]);
                let response = await Connection.receive(CARTA.FittingResponse);
                
                expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.x, assertItem.precisionDigits);
                expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.y, assertItem.precisionDigits);
                expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].amp, assertItem.precisionDigits);
                expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].pa, assertItem.precisionDigits);
                expect(response.success).toEqual(assertItem.fittingResponse[0].success);
                expect(response.resultErrors[0].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].center.x, assertItem.precisionDigits);
                expect(response.resultErrors[0].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].center.y, assertItem.precisionDigits);
                expect(response.resultErrors[0].amp).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].amp, assertItem.precisionDigits);
                expect(response.resultErrors[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].fwhm.x, assertItem.precisionDigits);
                expect(response.resultErrors[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].fwhm.y, assertItem.precisionDigits);
                expect(response.resultErrors[0].pa).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].pa, assertItem.precisionDigits);
                expect(response.log).toContain(assertItem.fittingResponse[0].log);
            },imageFittingTimeout)
        })

        describe(`(Case 2) Image fitting with FoV:`, ()=>{
            test(`Send Image fitting request and match the result`, async()=>{
                await Connection.send(CARTA.FittingRequest, assertItem.fittingRequest[1]);
                let response = await Connection.receive(CARTA.FittingResponse);
                
                expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].center.x, assertItem.precisionDigits);
                expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].center.y, assertItem.precisionDigits);
                expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].amp, assertItem.precisionDigits);
                expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].fwhm.x, assertItem.precisionDigits);
                expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].fwhm.y, assertItem.precisionDigits);
                expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].pa, assertItem.precisionDigits);
                expect(response.success).toEqual(assertItem.fittingResponse[1].success);
                expect(response.resultErrors[0].center.x).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].center.x, assertItem.precisionDigits);
                expect(response.resultErrors[0].center.y).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].center.y, assertItem.precisionDigits);
                expect(response.resultErrors[0].amp).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].amp, assertItem.precisionDigits);
                expect(response.resultErrors[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].fwhm.x, assertItem.precisionDigits);
                expect(response.resultErrors[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].fwhm.y, assertItem.precisionDigits);
                expect(response.resultErrors[0].pa).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].pa, assertItem.precisionDigits);
                expect(response.log).toContain(assertItem.fittingResponse[1].log);
            },imageFittingTimeout)
        })
    });

    test(`close file`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    afterAll(() => Connection.close());

});