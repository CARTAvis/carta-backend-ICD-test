import { CARTA } from "carta-protobuf";
import { Client, AckStream } from "./CLIENT";
import config from "./config.json";
const WebSocket = require('isomorphic-ws');
import { execSync } from "child_process";

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
    fittingResponseMacOS110601: CARTA.IFittingResponse[];
    fittingResponseMacOS12: CARTA.IFittingResponse[];
    fittingResponseLinux: CARTA.IFittingResponse[];
    fittingResponseUbuntu2204: CARTA.IFittingResponse[];
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
                    center: {x: 137.4108664786717, y: 278.30044158477193}, 
                    amp: 0.2970113045359871,
                    fwhm: {x: -0.1892426922028161, y: 0.2257496773140682},
                    pa: 270.38937779546336
                }, 
                {
                    center: {x: 324.3493469406151, y: 324.34873891574335}, 
                    amp: 9.99701377626984,
                    fwhm: {x: 29.399853003901757, y: 117.49088485007636},
                    pa: 0.5342821807532023
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
    fittingResponseMacOS110601:  [
        {
            resultValues: [
                {
                    center: {x: 101.25754777255497, y: 289.50143388893946}, 
                    amp: 0.20980810056293095,
                    fwhm: {x: 4.831878951840909, y: -0.13027624912739558},
                    pa: 270.12676256733675
                }, 
                {
                    center: {x: 324.34784293804995, y: 324.3488176351443}, 
                    amp: 9.995468914523238,
                    fwhm: {x: 29.399978883356663, y: 117.51285901668908},
                    pa: 0.5307253505485405
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 0.1423816628460514, y: 0.03918068073755874},
                    amp: 0.0116739400572081767,
                    fwhm: {x: 0.04547626539798418, y: 0.1796625783242974},
                    pa: 0.005286464774864215
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
    fittingResponseMacOS12: [
        {
            resultValues: [
                {
                    center: {x: 129.52934425744016, y: 285.4183410816301}, 
                    amp: 0.4657574006276674,
                    fwhm: {x: -1.0178734138400989, y: 0.0643954893477044},
                    pa: 356.65196671978725
                }, 
                {
                    center: {x: 324.3426307770264, y: 324.34813278164734}, 
                    amp: 9.995057596365545,
                    fwhm: {x: 29.40129200278109, y: 117.49460686897025},
                    pa: 0.5241778093682095
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
    fittingResponseLinux: [
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
    fittingResponseUbuntu2204: [
        {
            resultValues: [
                {
                    center: {x: 141.19569242428403, y: 274.468080399765}, 
                    amp: 0.0073312614530695805,
                    fwhm: {x: 1.8888434341244704, y: 0.003414731271306315},
                    pa: 289.1517791897806
                }, 
                {
                    center: {x: 324.34387675503626, y: 324.3494127204754}, 
                    amp: 9.995719972488988,
                    fwhm: {x: 29.395209261545435, y: 117.53236329753543},
                    pa: 0.5369662783821492
                }
            ],
            resultErrors: [
                {
                    center: {},
                    fwhm: {},
                },
                {
                    center: {x: 0.14270290674700617, y: 0.03926940295174565},
                    amp: 0.011794239703922002,
                    fwhm: {x: 0.045959932685532584, y: 0.18286860946141664},
                    pa: 0.004197561925501329
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

let platformOS: String;
let MacOSNumber: any;
let MacOSNumberResponse: any;
let ubuntuNumber: any;
let isUbunutu2204: boolean;
let isRedHat9: boolean;
describe("IMAGE_FITTING_BAD test: Testing Image Fitting with fits file but with bad initial guess (2 components), then exceeds the maximum iteration number of 200.", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        let registerViewerAck = await Connection.registerViewer(assertItem.register);
        platformOS = registerViewerAck.platformStrings.platform;
        if (platformOS === "macOS") {
            MacOSNumberResponse = String(execSync('sw_vers -productVersion',{encoding: 'utf-8'}));
            MacOSNumber = Number(MacOSNumberResponse.slice(0,2));
            if (MacOSNumberResponse.toString().includes('11.6.1')) {
                MacOSNumber = '11.6.1';
            }
        }
        if (platformOS === "Linux"){
            let Response = String(execSync('lsb_release -a',{encoding: 'utf-8'}));
            isUbunutu2204 = Response.includes("22.04");
            isRedHat9 = Response.includes("Red Hat") || Response.includes("9.0");
        }
        
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

                if (MacOSNumber === "11.6.1" && platformOS === 'macOS') {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseMacOS110601[0].success);

                    expect(response.resultErrors[0].center.x).toEqual(0);
                    expect(response.resultErrors[0].center.y).toEqual(0);
                    expect(response.resultErrors[0].fwhm.x).toEqual(0);
                    expect(response.resultErrors[0].fwhm.y).toEqual(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS110601[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseMacOS110601[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseMacOS110601[0].message);
                } else if (MacOSNumber === 12 && platformOS === 'macOS') {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseMacOS12[0].success);

                    expect(response.resultErrors[0].center.x).toEqual(0);
                    expect(response.resultErrors[0].center.y).toEqual(0);
                    expect(response.resultErrors[0].fwhm.x).toEqual(0);
                    expect(response.resultErrors[0].fwhm.y).toEqual(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseMacOS12[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseMacOS12[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseMacOS12[0].message);
                } else if (platformOS === 'Linux' && isUbunutu2204 === false) {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseLinux[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseLinux[0].success);

                    expect(response.resultErrors[0].center.x).toEqual(0);
                    expect(response.resultErrors[0].center.y).toEqual(0);
                    expect(response.resultErrors[0].fwhm.x).toEqual(0);
                    expect(response.resultErrors[0].fwhm.y).toEqual(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseLinux[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseLinux[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseLinux[0].message);
                } else if (platformOS === 'Linux' && isUbunutu2204 === true) {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseUbuntu2204[0].success);

                    expect(response.resultErrors[0].center.x).toEqual(0);
                    expect(response.resultErrors[0].center.y).toEqual(0);
                    expect(response.resultErrors[0].fwhm.x).toEqual(0);
                    expect(response.resultErrors[0].fwhm.y).toEqual(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseUbuntu2204[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseUbuntu2204[0].message);
                } else if (platformOS === 'Linux' && isRedHat9 === true) {
                    expect(response.resultValues[0].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].amp, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[0].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[0].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[0].pa, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].center.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].center.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].amp, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultValues[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultValues[1].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultValues[1].pa, assertItem.precisionDigits);
                    expect(response.success).toEqual(assertItem.fittingResponseUbuntu2204[0].success);

                    expect(response.resultErrors[0].center.x).toEqual(0);
                    expect(response.resultErrors[0].center.y).toEqual(0);
                    expect(response.resultErrors[0].fwhm.x).toEqual(0);
                    expect(response.resultErrors[0].fwhm.y).toEqual(0);
                    expect(response.resultErrors[1].center.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].center.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].center.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].center.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].amp).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].amp, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.x).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].fwhm.x, assertItem.precisionDigits);
                    expect(response.resultErrors[1].fwhm.y).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].fwhm.y, assertItem.precisionDigits);
                    expect(response.resultErrors[1].pa).toBeCloseTo(assertItem.fittingResponseUbuntu2204[0].resultErrors[1].pa, assertItem.precisionDigits);
                
                    expect(response.log).toContain(assertItem.fittingResponseUbuntu2204[0].log);
                    expect(response.message).toContain(assertItem.fittingResponseUbuntu2204[0].message);
                } else {
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
                }
            },imageFittingTimeout)
        })

        describe(`(Case 2) Image fitting: fit did not converge`, ()=>{
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