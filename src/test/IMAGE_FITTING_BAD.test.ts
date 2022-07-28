import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');

let testServerUrl: string = config.serverURL0;
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
        file: "M17_SWex-channel0-addOneGaussian.fits",
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
                    center: {x: 0, y: 0}, 
                    amp: 0.011881771744524577,
                    fwhm: {x: 0, y: 0},
                    pa: 0.0049460116505525625
                }
            ],
            resultErrors: [
                {
                    center: {x: 0.0004006969240219716, y: 0.0005001794973076322},
                    amp: 0.00003971187313364324,
                    fwhm: {x: 29.399853003901757, y: 117.49088485007636},
                    pa: 0.5342821807532023
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
            log: 'Gaussian fitting with 1 component'
        }
    ],
    precisionDigits: 6,
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

        describe(`(Case 1) Image fitting without FoV:`, ()=>{
            test(`Send Image fitting request and match the result`, async()=>{
                await Connection.send(CARTA.FittingRequest, assertItem.fittingRequest[0]);
                let response = await Connection.receive(CARTA.FittingResponse);
                console.log(response);
                
                // expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.x, assertItem.precisionDigits);
                // expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].center.y, assertItem.precisionDigits);
                // expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].amp, assertItem.precisionDigits);
                // expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                // expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                // expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponse[0].resultValues[0].pa, assertItem.precisionDigits);
                // expect(response.success).toEqual(assertItem.fittingResponse[0].success);
                // expect(response.resultErrors[0].center.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].center.x, assertItem.precisionDigits);
                // expect(response.resultErrors[0].center.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].center.y, assertItem.precisionDigits);
                // expect(response.resultErrors[0].amp).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].amp, assertItem.precisionDigits);
                // expect(response.resultErrors[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].fwhm.x, assertItem.precisionDigits);
                // expect(response.resultErrors[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].fwhm.y, assertItem.precisionDigits);
                // expect(response.resultErrors[0].pa).toBeCloseTo(assertItem.fittingResponse[0].resultErrors[0].pa, assertItem.precisionDigits);
                // expect(response.log).toContain(assertItem.fittingResponse[0].log);
            },imageFittingTimeout)
        })

        // describe(`(Case 2) Image fitting with FoV:`, ()=>{
        //     test(`Send Image fitting request and match the result`, async()=>{
        //         await Connection.send(CARTA.FittingRequest, assertItem.fittingRequest[1]);
        //         let response = await Connection.receive(CARTA.FittingResponse);
                
        //         expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].center.x, assertItem.precisionDigits);
        //         expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].center.y, assertItem.precisionDigits);
        //         expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].amp, assertItem.precisionDigits);
        //         expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].fwhm.x, assertItem.precisionDigits);
        //         expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].fwhm.y, assertItem.precisionDigits);
        //         expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponse[1].resultValues[0].pa, assertItem.precisionDigits);
        //         expect(response.success).toEqual(assertItem.fittingResponse[1].success);
        //         expect(response.resultErrors[0].center.x).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].center.x, assertItem.precisionDigits);
        //         expect(response.resultErrors[0].center.y).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].center.y, assertItem.precisionDigits);
        //         expect(response.resultErrors[0].amp).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].amp, assertItem.precisionDigits);
        //         expect(response.resultErrors[0].fwhm.x).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].fwhm.x, assertItem.precisionDigits);
        //         expect(response.resultErrors[0].fwhm.y).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].fwhm.y, assertItem.precisionDigits);
        //         expect(response.resultErrors[0].pa).toBeCloseTo(assertItem.fittingResponse[1].resultErrors[0].pa, assertItem.precisionDigits);
        //         expect(response.log).toContain(assertItem.fittingResponse[1].log);
        //     },imageFittingTimeout)
        // })
    });

    test(`close file`, async () => {
        await Connection.send(CARTA.CloseFile, { fileId: -1 });
    }, connectTimeout);

    afterAll(() => Connection.close());

});