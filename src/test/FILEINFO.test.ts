import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let WebSocket = require("ws");
let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let expectRootPath = "";
let testSubdirectoryName = "set_QA";
let connectionTimeout = 10000;

describe("FILEINFO tests", () => {   
    let Connection: WebSocket;

    beforeEach( done => {
        // Establish a websocket connection in the binary form: arraybuffer 
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        // While open a Websocket
        Connection.onopen = () => {
            // Checkout if Websocket server is ready
            if (Connection.readyState === WebSocket.OPEN) {
                // Preapare the message on a eventData
                const message = CARTA.RegisterViewer.create({sessionId: "", apiKey: "1234"});
                let payload = CARTA.RegisterViewer.encode(message).finish();
                let eventData = new Uint8Array(32 + 4 + payload.byteLength);

                eventData.set(Utility.stringToUint8Array("REGISTER_VIEWER", 32));
                eventData.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                eventData.set(payload, 36);

                Connection.send(eventData);
                // While receive a message
                Connection.onmessage = (event: MessageEvent) => {
                    const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                    if (eventName === "REGISTER_VIEWER_ACK") {
                        // Assertion
                        expect(event.data.byteLength).toBeGreaterThan(0);
                        eventData = new Uint8Array(event.data, 36);
                        expect(CARTA.RegisterViewerAck.decode(eventData).success).toBe(true);
                        
                        done();
                    }
                };
            } else {
                console.log(`Can not open a connection.`);
            }
            done();
        };
    }, connectionTimeout);
    
    describe(`access directory`, () => {
        [[expectRootPath], [testSubdirectoryName]
        ].map(
            ([dir]) => {
                test(`assert the directory "${dir}" opens.`, 
                done => {
                    // Preapare the message on a eventData
                    let message = CARTA.FileListRequest.create({directory: dir});
                    let payload = CARTA.FileListRequest.encode(message).finish();
                    let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);
            
                    eventDataTx.set(Utility.stringToUint8Array("FILE_LIST_REQUEST", 32));
                    eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                    eventDataTx.set(payload, 36);
            
                    Connection.send(eventDataTx);
            
                    // While receive a message
                    Connection.onmessage = (event: MessageEvent) => {
                        let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                        if (eventName === "FILE_LIST_RESPONSE") {
                            expect(event.data.byteLength).toBeGreaterThan(0);
                            let eventData = new Uint8Array(event.data, 36);
                            expect(CARTA.FileListResponse.decode(eventData).success).toBe(true);
            
                            done();
                        }
                    };
                }, connectionTimeout);
            }
        );
    });

    describe(`access the folder ${testSubdirectoryName} and ...`, 
    () => {
        beforeEach( 
            done => {
                // Preapare the message on a eventData
                const message = CARTA.FileListRequest.create({directory: testSubdirectoryName});
                let payload = CARTA.FileListRequest.encode(message).finish();
                const eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                eventDataTx.set(Utility.stringToUint8Array("FILE_LIST_REQUEST", 32));
                eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                eventDataTx.set(payload, 36);

                Connection.send(eventDataTx);

                Connection.onmessage = (eventList: MessageEvent) => {
                    let eventName = Utility.getEventName(new Uint8Array(eventList.data, 0, 32));
                    if (eventName === "FILE_LIST_RESPONSE") {
                        // Assertion
                        let eventData = new Uint8Array(eventList.data, 36);
                        expect(CARTA.FileListResponse.decode(eventData).success).toBe(true);
                        
                        done();
                    }
                };

            }, connectionTimeout);           
        
        describe(`test an existent file`, () => {
            [
             ["S255_IR_sci.spw25.cube.I.pbcor.fits",    "0",    7048405440,     CARTA.FileType.FITS,    [1920, 1920, 478, 1],   4],
             ["SDC335.579-0.292.spw0.line.image",        "",    1864975311,     CARTA.FileType.CASA,    [336, 350, 3840, 1],    4],
             ["G34mm1_lsb_all.uv.part1.line.natwt.sml",  "",      34521240,   CARTA.FileType.MIRIAD,    [129, 129, 512, 1],     4],
             ["orion_12co_hera.hdf5",                   "0",     118888712,     CARTA.FileType.HDF5,    [688, 575, 35],         3],
             ["spire500_ext.fits",                      "1",      17591040,     CARTA.FileType.FITS,    [830, 870],             2],
            ].map(
                function([fileName, hdu,    fileSize,   fileType,       shape,      NAXIS]: 
                         [string,   string, number,     CARTA.FileType, number[],   number]) {
                    test(`assert the ${CARTA.FileType[fileType]} file "${fileName}".`, 
                    done => {    
                        // Preapare the message on a eventData
                        const message = CARTA.FileInfoRequest.create({
                                        directory: testSubdirectoryName, file: fileName, hdu});
                        let payload = CARTA.FileInfoRequest.encode(message).finish();
                        const eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                        eventDataTx.set(Utility.stringToUint8Array("FILE_INFO_REQUEST", 32));
                        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                        eventDataTx.set(payload, 36);

                        Connection.send(eventDataTx);

                        Connection.onmessage = (eventInfo: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(eventInfo.data, 0, 32));
                            if (eventName === "FILE_INFO_RESPONSE") {
                                let eventData = new Uint8Array(eventInfo.data, 36);
                                let fileInfoMessage = CARTA.FileInfoResponse.decode(eventData);
                                // console.log(fileInfoMessage.fileInfo.HDUList);
                                
                                expect(fileInfoMessage.success).toBe(true);
                                expect(fileInfoMessage.fileInfo.HDUList.find( f => f === hdu)).toEqual(hdu);
                                expect(fileInfoMessage.fileInfo.name).toBe(fileName);
                                expect(fileInfoMessage.fileInfo.size.toString()).toEqual(fileSize.toString());
                                expect(fileInfoMessage.fileInfo.type).toBe(fileType);

                                expect(fileInfoMessage.fileInfoExtended.dimensions).toEqual(NAXIS);
                                expect(fileInfoMessage.fileInfoExtended.width).toEqual(shape[0]);
                                expect(fileInfoMessage.fileInfoExtended.height).toEqual(shape[1]);
                                if (NAXIS > 2) {
                                    expect(fileInfoMessage.fileInfoExtended.depth).toEqual(shape[2]);
                                }
                                if (NAXIS > 3) {
                                    expect(fileInfoMessage.fileInfoExtended.stokes).toEqual(shape[3]);
                                }
                                expect(fileInfoMessage.fileInfoExtended.stokesVals[0]).toEqual("");
                                
                                const fileInfoExtComputedShape = 
                                    fileInfoMessage.fileInfoExtended.computedEntries.find( f => f.name === "Shape").value;
                                expect(
                                    fileInfoExtComputedShape.replace("[", "").replace("]", "").split(",").map(Number)
                                    ).toEqual(shape);

                                const fileInfoExtHeaderNAXIS = 
                                    fileInfoMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS").value;
                                expect(parseInt(fileInfoExtHeaderNAXIS)).toEqual(NAXIS);
                                const fileInfoExtHeaderNAXIS1 = 
                                    fileInfoMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS1").value;
                                expect(parseInt(fileInfoExtHeaderNAXIS1)).toEqual(shape[0]);
                                const fileInfoExtHeaderNAXIS2 = 
                                    fileInfoMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS2").value;
                                expect(parseInt(fileInfoExtHeaderNAXIS2)).toEqual(shape[1]);
                                if (NAXIS > 2) {
                                    const fileInfoExtHeaderNAXIS3 = 
                                        fileInfoMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS3").value;
                                    expect(parseInt(fileInfoExtHeaderNAXIS3)).toEqual(shape[2]);
                                }
                                if (NAXIS > 3) {
                                const fileInfoExtHeaderNAXIS4 = 
                                    fileInfoMessage.fileInfoExtended.headerEntries.find( f => f.name === "NAXIS4").value;
                                expect(parseInt(fileInfoExtHeaderNAXIS4)).toEqual(shape[3]);
                                }

                                done();
                            } // if
                        }; // onmessage
                                                 
                    } // done
                    , connectionTimeout); // test
                } // function([ ])
            ); // map
        }); // describe

    });

    afterEach( done => {
        Connection.close();
        done();
    });
});

describe("FILEINFO_EXCEPTIONS tests", () => {   
    let Connection: WebSocket;

    beforeEach( done => {
        // Establish a websocket connection in the binary form: arraybuffer 
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        // While open a Websocket
        Connection.onopen = () => {
            // Checkout if Websocket server is ready
            if (Connection.readyState === WebSocket.OPEN) {
                // Preapare the message on a eventData
                const message = CARTA.RegisterViewer.create({sessionId: "", apiKey: "1234"});
                let payload = CARTA.RegisterViewer.encode(message).finish();
                let eventData = new Uint8Array(32 + 4 + payload.byteLength);

                eventData.set(Utility.stringToUint8Array("REGISTER_VIEWER", 32));
                eventData.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                eventData.set(payload, 36);

                Connection.send(eventData);
                // While receive a message
                Connection.onmessage = (event: MessageEvent) => {
                    const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                    if (eventName === "REGISTER_VIEWER_ACK") {
                        // Assertion
                        expect(event.data.byteLength).toBeGreaterThan(0);
                        eventData = new Uint8Array(event.data, 36);
                        expect(CARTA.RegisterViewerAck.decode(eventData).success).toBe(true);
                        
                        done();
                    }
                };
            } else {
                console.log(`Can not open a connection.`);
            }
            done();
        };
    }, connectionTimeout);

    describe(`access the folder "${testSubdirectoryName}" and ...`, 
    () => {    
        beforeEach( 
            done => {
                // Preapare the message on a eventData
                const message = CARTA.FileListRequest.create({directory: testSubdirectoryName});
                let payload = CARTA.FileListRequest.encode(message).finish();
                const eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                eventDataTx.set(Utility.stringToUint8Array("FILE_LIST_REQUEST", 32));
                eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                eventDataTx.set(payload, 36);

                Connection.send(eventDataTx);

                done();
            }, connectionTimeout);           
        
        describe(`test an non-existent file`, () => {
            [["no_such_file.image"],
             ["broken_header.miriad"],
            ].map(
                function([fileName]: [string]) {
                    test(`assert the file "${fileName}" is non-existent.`, 
                    done => {
                        Connection.onmessage = (eventList: MessageEvent) => {
                            let eventName = Utility.getEventName(new Uint8Array(eventList.data, 0, 32));
                            if (eventName === "FILE_LIST_RESPONSE") {
                                // Assertion
                                let eventData = new Uint8Array(eventList.data, 36);
                                expect(CARTA.FileListResponse.decode(eventData).success).toBe(true);
    
                                // Preapare the message on a eventData
                                const message = CARTA.FileInfoRequest.create({
                                                directory: testSubdirectoryName, file: fileName, hdu: "0"});
                                let payload = CARTA.FileInfoRequest.encode(message).finish();
                                const eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);
    
                                eventDataTx.set(Utility.stringToUint8Array("FILE_INFO_REQUEST", 32));
                                eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                                eventDataTx.set(payload, 36);
    
                                Connection.send(eventDataTx);

                                Connection.onmessage = (eventInfo: MessageEvent) => {
                                    eventName = Utility.getEventName(new Uint8Array(eventInfo.data, 0, 32));
                                    if (eventName === "FILE_INFO_RESPONSE") {
                                        eventData = new Uint8Array(eventInfo.data, 36);
                                        let fileInfoMessage = CARTA.FileInfoResponse.decode(eventData);
                                        expect(fileInfoMessage.success).toBe(false);
                                        expect(fileInfoMessage.message).toBeDefined();

                                        //  console.log(CARTA.FileInfoResponse.decode(eventData));

                                        done();
                                    } // if
                                }; // onmessage
                            } // if
                        }; // onmessage                        
                    } // done
                    , connectionTimeout); // test
                } // function([ ])
            ); // map
        }); // describe

    });

    afterEach( done => {
        Connection.close();
        done();
    }, connectionTimeout);
});
