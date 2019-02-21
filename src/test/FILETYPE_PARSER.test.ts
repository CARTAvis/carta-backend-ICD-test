/// Manual
import config from "./config.json";
let testServerUrl = config.serverURL;
let testSubdirectoryName = config.path.QA;
let expectRootPath = config.path.root;
let connectionTimeout = config.timeout.connection;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

describe("FILETYPE_PARSER tests", () => {   
    // Establish a websocket connection in the transfer form of binary: arraybuffer 
    let Connection: WebSocket;

    beforeEach( done => {
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
            } else {
                console.log(`Can not open a connection. @${new Date()}`);
            }
            done();
        };
    }, connectionTimeout);

    test(`connect to CARTA "${testServerUrl}" & ...`, 
    done => {
        // While receive a message in the form of arraybuffer
        Connection.onmessage = (event: MessageEvent) => {
            const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
            if (eventName === "REGISTER_VIEWER_ACK") {
                // Assertion
                expect(event.data.byteLength).toBeGreaterThan(0);
                const eventData = new Uint8Array(event.data, 36);
                expect(CARTA.RegisterViewerAck.decode(eventData).success).toBe(true);
                
                done();
            }
        };
    }, connectionTimeout);

    test(`send EventName: "FILE_LIST_REQUEST" to CARTA "${testServerUrl}" to access ${testSubdirectoryName}.`, 
    done => {

        // Preapare the message on a eventData
        let message = CARTA.FileListRequest.create({directory: testSubdirectoryName});
        let payload = CARTA.FileListRequest.encode(message).finish();
        let eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

        eventDataTx.set(Utility.stringToUint8Array("FILE_LIST_REQUEST", 32));
        eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
        eventDataTx.set(payload, 36);

        Connection.send(eventDataTx);

        // While receive a message in the form of arraybuffer
        Connection.onmessage = (event: MessageEvent) => {
            let eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
            if (eventName === "FILE_LIST_RESPONSE") {
                expect(event.data.byteLength).toBeGreaterThan(0);
                let eventData = new Uint8Array(event.data, 36);
                expect(CARTA.FileListResponse.decode(eventData).success).toBe(true);

            //    console.log(CARTA.FileListResponse.decode(eventData));
                console.log(`The root folder on backend is "${CARTA.FileListResponse.decode(eventData).parent}" @${new Date()}`);
                
                done();
            }
        };

    }, connectionTimeout);

    describe(`send EventName: "FILE_LIST_REQUEST" to CARTA ${testServerUrl}`, 
    () => {
        beforeEach( done => {
            Connection.onmessage = (event: MessageEvent) => {
                const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                if (eventName === "REGISTER_VIEWER_ACK") {
                    // Assertion
                    expect(event.data.byteLength).toBeGreaterThan(0);
                    const eventData = new Uint8Array(event.data, 36);
                    expect(CARTA.RegisterViewerAck.decode(eventData).success).toBe(true);
                    // Preapare the message on a eventData
                    const message = CARTA.FileListRequest.create({directory: testSubdirectoryName});
                    let payload = CARTA.FileListRequest.encode(message).finish();
                    const eventDataTx = new Uint8Array(32 + 4 + payload.byteLength);

                    eventDataTx.set(Utility.stringToUint8Array("FILE_LIST_REQUEST", 32));
                    eventDataTx.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
                    eventDataTx.set(payload, 36);

                    Connection.send(eventDataTx);

                    done();
                }
            };    
        }, connectionTimeout);        
        
        test(`assert the received EventName is "FILE_LIST_RESPONSE" within ${connectionTimeout} ms.`, 
        done => {
            // While receive a message from Websocket server
            Connection.onmessage = (event: MessageEvent) => {
                const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                expect(event.data.byteLength).toBeGreaterThan(40);
                expect(eventName).toBe("FILE_LIST_RESPONSE");

                done();
            };
        }, connectionTimeout);
    
        test(`assert the "FILE_LIST_RESPONSE.success" is true.`, 
        done => {
            // While receive a message from Websocket server
            Connection.onmessage = (event: MessageEvent) => {
                const eventData = new Uint8Array(event.data, 36);
                expect(CARTA.FileListResponse.decode(eventData).success).toBe(true);
                
                done();
            };
        }, connectionTimeout);  

        test(`assert the "FILE_LIST_RESPONSE.parent" is "${expectRootPath}".`, 
        done => {
            // While receive a message from Websocket server
            Connection.onmessage = (event: MessageEvent) => {
                const eventData = new Uint8Array(event.data, 36);
                expect(CARTA.FileListResponse.decode(eventData).parent).toBe(expectRootPath);

                done();
            };
    
        }, connectionTimeout);

        test(`assert the "FILE_LIST_RESPONSE.directory" is the path "${testSubdirectoryName}".`, 
        done => {
            // While receive a message from Websocket server
            Connection.onmessage = (event: MessageEvent) => {
                const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                if (eventName === "FILE_LIST_RESPONSE") {
                    const eventData = new Uint8Array(event.data, 36);

                    let parsedMessage;
                    parsedMessage = CARTA.FileListResponse.decode(eventData);

                    expect(parsedMessage.directory).toBe(testSubdirectoryName);
                }
                done();
            };
    
        }, connectionTimeout);

        describe(`test the file is existent`, () => {
            [
             ["SDC335.579-0.292.spw0.line.image", CARTA.FileType.CASA, 1864975311, [""]],
             ["S255_IR_sci.spw25.cube.I.pbcor.fits", CARTA.FileType.FITS, 7048405440, ["0"]],
             ["spire500_ext.fits", CARTA.FileType.FITS, 17591040, ["0", "1", "2", "3", "4", "5", "6", "7", ]],
             ["G34mm1_lsb_all.uv.part1.line.natwt.sml", CARTA.FileType.MIRIAD, 34521240, [""]],
             ["orion_12co_hera.hdf5", CARTA.FileType.HDF5, 118888712, ["0"]],
            ].map(
                function([file, type, size, hdu]:
                         [string, CARTA.FileType, number, string[]]) {
    
                    test(`assert the file "${file}" exists, image type is ${CARTA.FileType[type]}, size = ${size}, HDU = [${hdu}].`, 
                    done => {
                        // While receive a message from Websocket server
                        Connection.onmessage = (event: MessageEvent) => {
                            const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                            if (eventName === "FILE_LIST_RESPONSE") {
                                const eventData = new Uint8Array(event.data, 36);
    
                                let parsedMessage;
                                parsedMessage = CARTA.FileListResponse.decode(eventData);
    
                                let fileInfo = parsedMessage.files.find(f => f.name === file);
                                expect(fileInfo).toBeDefined();
                                expect(fileInfo.type).toBe(type);
                                expect(fileInfo.size.toNumber()).toBe(size);
                                expect(fileInfo.HDUList).toEqual(hdu);
                            }
                            done();
                        };
                    }, connectionTimeout);

                }
            );
        });
        
        describe(`test the file is non-existent`, () => {
            [["empty2.miriad"], ["empty2.fits"], ["empty2.image"], ["empty2.hdf5"],
             ["empty.txt"], ["empty.miriad"], ["empty.fits"], ["empty.hdf5"],
             ["empty.image"],
            ].map(
                function([file]: [string]) {
                    test(`assert the file "${file}" does not exist.`, 
                    done => {
                        // While receive a message from Websocket server
                        Connection.onmessage = (event: MessageEvent) => {
                            const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                            if (eventName === "FILE_LIST_RESPONSE") {
                                const eventData = new Uint8Array(event.data, 36);
    
                                let parsedMessage;
                                parsedMessage = CARTA.FileListResponse.decode(eventData);
    
                                let fileInfo = parsedMessage.files.find(f => f.name === file);
                                expect(fileInfo).toBeUndefined();
                            }
                            done();
                        } ;
                    }, connectionTimeout);
                }
            );
        });        
        
        describe(`test the folder is existent inside "${testSubdirectoryName}"`, () => {
            [["empty_folder"], ["empty.miriad"], ["empty.fits"], 
             ["empty.image"], ["empty.hdf5"],
            ].map(
                ([folder]) => {
                    test(`assert the folder "${folder}" exists.`, 
                    done => {
                        // While receive a message from Websocket server
                        Connection.onmessage = (event: MessageEvent) => {
                            const eventName = Utility.getEventName(new Uint8Array(event.data, 0, 32));
                            if (eventName === "FILE_LIST_RESPONSE") {
                                const eventData = new Uint8Array(event.data, 36);
    
                                let parsedMessage;
                                parsedMessage = CARTA.FileListResponse.decode(eventData);
    
                                let folderInfo = parsedMessage.subdirectories.find(f => f === folder);
                                expect(folderInfo).toBeDefined();
                            }
                            done();
                        };
                    }, connectionTimeout);
                }
            );
        });

    });

    afterEach( done => {
        Connection.close();
        done();
    });
});
