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
        file: "ThreeComponent-inclined-2d-gaussian.fits",
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
            initialValues: [
                {amp: 1, center: {x: 164, y: 280}, fwhm: {x: 100, y: 5}, pa: 270}, 
                {amp: 1, center: {x: 220, y: 270}, fwhm: {x: 30, y: 100}, pa: 45}, 
            ]
        },
        {
            fileId: 0,
            fixedParams: [],
            fovInfo: null,
            regionId: -1, 
            initialValues: [{amp: 10, center: {x: 1000, y: 280}, fwhm: {x: 100, y: 5}, pa: 270}]
        }
    ],
    fittingResponse: [
        {
            resultValues: [
                {
                    center: {x: 135.44304395891785, y: 279.2872847693339}, 
                    amp: 0.3679796147238359,
                    fwhm: {x: 0.10606045985196957, y: 0.28676758030525856},
                    pa: 280.48905602819553
                }, 
                {
                    center: {x: 324.3493469406151, y: 324.34873891574335}, 
                    amp: 9.99701377626984,
                    fwhm: {x: 29.399853003901757, y: 117.47343456730091},
                    pa: 0.5291923527559826
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 0.14270290674700617, y: 0.03926940295174565},
                    amp: 0.011881771744524577,
                    fwhm: {x: 0.045959932685532584, y: 0.18286860946141664},
                    pa: 0.0049460116505525625
                }
            ],
            success: true,
            log: 'Gaussian fitting with 2 component',
            message: 'exceeded max number of iterations'
        },
        {
            resultValues: [],
            resultErrors: [],
            success: true,
            message: 'fit did not converge'
        }
    ],
    precisionDigits: 2,
};

describe("IMAGE_FITTING_BAD test: Testing Image Fitting with fits file but with bad initial guess (2 components), then exceeds the maximum iteration number of 200.", () => {

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

        describe(`(Case 1) Image fitting: exceeded max number of iterations`, ()=>{
            test(`Send Image fitting request and match the result`, async()=>{
                await Connection.send(CARTA.FittingRequest, assertItem.fittingRequest[0]);
                let response = await Connection.receive(CARTA.FittingResponse);
                
                expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.x, assertItem.precisionDigits);
                expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.y, assertItem.precisionDigits);
                expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].amp, assertItem.precisionDigits);
                expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].pa, assertItem.precisionDigits);
                expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].center.x, assertItem.precisionDigits);
                expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].center.y, assertItem.precisionDigits);
                expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].amp, assertItem.precisionDigits);
                expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponse[0].resultValues[1].pa, assertItem.precisionDigits);
                expect(response.success).toEqual(assertItem.fittingResponse[0].success);

                expect(response.resultErrors[0].center.x).toEqual(0);
                expect(response.resultErrors[0].center.y).toEqual(0);
                expect(response.resultErrors[0].fwhm.x).toEqual(0);
                expect(response.resultErrors[0].fwhm.y).toEqual(0);
                expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].center.x, assertItem.precisionDigits);
                expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].center.y, assertItem.precisionDigits);
                expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].amp, assertItem.precisionDigits);
                expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                expect(response.log).toContain(assertItem.fittingResponse[0].log);
                expect(response.message).toContain(assertItem.fittingResponse[0].message);
            },imageFittingTimeout)
        })

        describe(`(Case 2) Image fitting with FoV:`, ()=>{
            test(`Send Image fitting request and match the result`, async()=>{
                await Connection.send(CARTA.FittingRequest, assertItem.fittingRequest[1]);
                let response = await Connection.receive(CARTA.FittingResponse);

                expect(response.message).toEqual(assertItem.fittingResponse[1].message)
            },imageFittingTimeout)
        })
    });

    test(`close file`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    afterAll(() => Connection.close());

});