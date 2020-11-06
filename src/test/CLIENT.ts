import { CARTA } from "carta-protobuf";

import config from "./config.json";
const { performance } = require('perf_hooks');
var W3CWebSocket = require('websocket').w3cwebsocket;
export class Client {
    IcdVersion: number = 17;
    CartaType = new Map<number, any>([
        [0, CARTA.ErrorData],
        [1, CARTA.RegisterViewer],
        [2, CARTA.FileListRequest],
        [3, CARTA.FileInfoRequest],
        [4, CARTA.OpenFile],
        [6, CARTA.SetImageChannels],
        [7, CARTA.SetCursor],
        [8, CARTA.SetSpatialRequirements],
        [9, CARTA.SetHistogramRequirements],
        [10, CARTA.SetStatsRequirements],
        [11, CARTA.SetRegion],
        [12, CARTA.RemoveRegion],
        [13, CARTA.CloseFile],
        [14, CARTA.SetSpectralRequirements],
        [15, CARTA.StartAnimation],
        [16, CARTA.StartAnimationAck],
        [17, CARTA.StopAnimation],
        [18, CARTA.RegisterViewerAck],
        [19, CARTA.FileListResponse],
        [20, CARTA.FileInfoResponse],
        [21, CARTA.OpenFileAck],
        [22, CARTA.SetRegionAck],
        [23, CARTA.RegionHistogramData],
        [25, CARTA.SpatialProfileData],
        [26, CARTA.SpectralProfileData],
        [27, CARTA.RegionStatsData],
        [28, CARTA.ErrorData],
        [29, CARTA.AnimationFlowControl],
        [30, CARTA.AddRequiredTiles],
        [31, CARTA.RemoveRequiredTiles],
        [32, CARTA.RasterTileData],
        [33, CARTA.RegionListRequest],
        [34, CARTA.RegionListResponse],
        [35, CARTA.RegionFileInfoRequest],
        [36, CARTA.RegionFileInfoResponse],
        [37, CARTA.ImportRegion],
        [38, CARTA.ImportRegionAck],
        [39, CARTA.ExportRegion],
        [40, CARTA.ExportRegionAck],
        [41, CARTA.SetUserPreferences],
        [42, CARTA.SetUserPreferencesAck],
        [43, CARTA.SetUserLayout],
        [44, CARTA.SetUserLayoutAck],
        [45, CARTA.SetContourParameters],
        [46, CARTA.ContourImageData],
        [47, CARTA.ResumeSession],
        [48, CARTA.ResumeSessionAck],
        [49, CARTA.RasterTileSync],
        [50, CARTA.CatalogListRequest],
        [51, CARTA.CatalogListResponse],
        [52, CARTA.CatalogFileInfoRequest],
        [53, CARTA.CatalogFileInfoResponse],
        [54, CARTA.OpenCatalogFile],
        [55, CARTA.OpenCatalogFileAck],
        [56, CARTA.CloseCatalogFile],
        [57, CARTA.CatalogFilterRequest],
        [58, CARTA.CatalogFilterResponse],
        [59, CARTA.ScriptingRequest],
        [60, CARTA.ScriptingResponse],
        [61, CARTA.MomentRequest],
        [62, CARTA.MomentResponse],
        [63, CARTA.MomentProgress],
        [64, CARTA.StopMomentCalc],
        [65, CARTA.SaveFile],
        [66, CARTA.SaveFileAck],
        [67, CARTA.SpectralLineRequest],
        [68, CARTA.SpectralLineResponse],
    ]);
    CartaTypeValue(type: any): number {
        let ret: number = 0;
        for (let [key, value] of this.CartaType.entries()) {
            if (value === type)
                ret = key;
        }
        return ret;
    }
    static eventCount = { value: 0 };
    connection: W3CWebSocket;
    // Construct a websocket connection to url
    constructor(url: string) {
        this.connection = new W3CWebSocket(url);
        this.connection.binaryType = "arraybuffer";
    }
    open(timeout?: number) {
        return new Promise<void>((resolve, reject) => {
            this.connection.onopen = onOpen;
            function onOpen(this, ev: Event) {
                resolve();
            }
            if (timeout) {
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, timeout);
            }
        });
    }
    close(timeout?: number) {
        this.connection.close();
        return new Promise<void>((resolve, reject) => {
            this.connection.onclose = onClose;
            function onClose(this, ev: Event) {
                resolve();
            }
            if (timeout) {
                let failTimer = setTimeout(() => {
                    clearTimeout(failTimer);
                    reject();
                }, timeout);
            }
        });
    }
    /// Send websocket message async
    /// Parameters: connection(Websocket ref), cartaType(CARTA.type), eventMessage(the sending message)
    /// return a Promise<any> for await
    send(cartaType: any, eventMessage: any,) {
        return new Promise<void>(resolve => {
            let message = cartaType.create(eventMessage);
            let payload = cartaType.encode(message).finish();
            let eventData = new Uint8Array(8 + payload.byteLength);
            const eventHeader16 = new Uint16Array(eventData.buffer, 0, 2);
            const eventHeader32 = new Uint32Array(eventData.buffer, 4, 1);
            eventHeader16[0] = this.CartaTypeValue(cartaType);
            eventHeader16[1] = this.IcdVersion;
            eventHeader32[0] = Client.eventCount.value++; // eventCounter;
            if (config.log.event) {
                console.log(`${cartaType.name} => #${eventHeader32[0]} @ ${performance.now()}`);
            }

            eventData.set(payload, 8);
            this.connection.send(eventData);

            resolve();
        });
    }
    /// Receive websocket message async
    /// Parameters: connection(Websocket ref), cartaType(CARTA.type)
    /// timeout: promise will return nothing until time out if timeout > 0
    /// return a Promise<cartaType> for await
    receive(cartaType: any, timeout?: number, isReceive?: boolean) {
        return new Promise<any>((resolve, reject) => {
            this.connection.onmessage = async (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);

                const eventNumber = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} #${eventId} @ ${performance.now()}`);
                }

                if (eventIcdVersion !== this.IcdVersion && config.log.warning) {
                    console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${this.IcdVersion}. Errors may occur`);
                }

                if (this.CartaType.get(eventNumber) === cartaType) {
                    if (timeout && !isReceive) {
                        reject();
                    }
                    let data;
                    switch (cartaType) {
                        case CARTA.SpatialProfileData:
                            data = CARTA.SpatialProfileData.decode(eventData);
                            data.profiles = data.profiles.map(p => processSpatialProfile(p));
                            break;
                        case CARTA.SpectralProfileData:
                            data = CARTA.SpectralProfileData.decode(eventData);
                            data.profiles = data.profiles.map(p => processSpectralProfile(p));
                            break;
                        default:
                            data = cartaType.decode(eventData);
                            break;
                    }
                    resolve(data);
                }
            };
            if (timeout) {
                let Timer = setTimeout(() => {
                    clearTimeout(Timer);
                    if (isReceive) {
                        reject();
                    } else {
                        resolve();
                    }
                }, timeout);
            }
        });
    }
    /// A receiving websocket message in any type async
    /// timeout: promise will return CARTA data until time out if timeout > 0
    /// return a Promise<any> for await
    receiveAny(timeout?: number, isReceive?: boolean) {
        return new Promise<any>((resolve, reject) => {
            this.connection.onmessage = async (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);
                const eventNumber = eventHeader16[0];
                // const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} #${eventId} @ ${performance.now()}`);
                }

                let data;
                let type = this.CartaType.get(eventNumber);
                switch (type) {
                    case CARTA.EntryType:
                        data = CARTA.ErrorData.decode(eventData);
                        console.warn(data.message);
                        break;
                    case CARTA.SpatialProfileData:
                        data = CARTA.SpatialProfileData.decode(eventData);
                        data.profiles = data.profiles.map(p => processSpatialProfile(p));
                        break;
                    case CARTA.SpectralProfileData:
                        data = CARTA.SpectralProfileData.decode(eventData);
                        data.profiles = data.profiles.map(p => processSpectralProfile(p));
                        break;
                    default:
                        data = type.decode(eventData);
                        break;
                }
                resolve(data);
            };
            if (timeout) {
                let Timer = setTimeout(() => {
                    clearTimeout(Timer);
                    if (isReceive) {
                        reject();
                    } else {
                        resolve();
                    }
                }, timeout);
            }
        });
    }
    /// A receiving websocket message in any type async
    /// timeout: promise will return CARTA data until time out if timeout > 0
    /// return type only and there is no process of decoding
    receiveAnyType(timeout?: number) {
        return new Promise<string>((resolve, reject) => {
            this.connection.onmessage = async (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                // const eventData = new Uint8Array(messageEvent.data, 8);
                const eventNumber = eventHeader16[0];
                // const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} #${eventId} @ ${performance.now()}`);
                }
                resolve(this.CartaType.get(eventNumber));
            };
            if (timeout) {
                let Timer = setTimeout(() => {
                    clearTimeout(Timer);
                    reject();
                }, timeout);
            }
        });
    }
    /// A receiving websocket message in any unknown type async
    /// timeout: promise will return CARTA data until time out if timeout > 0
    /// return nothing so there is no process of decoding
    receiveAnyNull(timeout?: number) {
        return new Promise<null>((resolve, reject) => {
            this.connection.onmessage = async () => {
                resolve();
            };
            if (timeout) {
                let Timer = setTimeout(() => {
                    clearTimeout(Timer);
                    reject();
                }, timeout);
            }
        });
    }
    /// Receive CARTA stream async
    /// Until the number: totalCount of mesaages have received or
    /// timeout: promise will not return CARTA data until time out if timeout > 0
    stream(count?: number, timeout?: number) {
        if (count <= 0) {
            return Promise.resolve();
        }

        let _count: number = 0;
        let ack: AckStream = {
            Responce: [],
            RasterTileData: [],
            RasterTileSync: [],
            SpatialProfileData: [],
            RegionStatsData: [],
            RegionHistogramData: [],
            SpectralProfileData: [],
            ContourImageData: [],
            CatalogFilterResponse: [],
            ScriptingResponse: [],
            MomentResponse: [],
            MomentProgress: [],
        };

        return new Promise<AckStream>(resolve => {
            this.connection.onmessage = (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);

                const eventNumber = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} #${eventId} @ ${performance.now()}`);
                }

                if (eventIcdVersion !== this.IcdVersion && config.log.warning) {
                    console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${this.IcdVersion}. Errors may occur`);
                }
                let eventType = this.CartaType.get(eventNumber);
                let data = eventType.decode(eventData);
                switch (eventType) {
                    default:
                        ack.Responce.push(data);
                        break;
                    case CARTA.EntryType:
                        ack.Responce.push(data);
                        console.warn(data);
                        break;
                    case CARTA.RasterTileData:
                        ack.RasterTileData.push(data);
                        break;
                    case CARTA.RasterTileSync:
                        ack.RasterTileSync.push(data);
                        break;
                    case CARTA.RegionStatsData:
                        ack.RegionStatsData.push(data);
                        break;
                    case CARTA.RegionHistogramData:
                        ack.RegionHistogramData.push(data);
                        break;
                    case CARTA.SpatialProfileData:
                        data.profiles = data.profiles.map(p => processSpatialProfile(p));
                        ack.SpatialProfileData.push(data);
                        break;
                    case CARTA.SpectralProfileData:
                        data.profiles = data.profiles.map(p => processSpectralProfile(p));
                        ack.SpectralProfileData.push(data);
                        break;
                    case CARTA.ContourImageData:
                        ack.ContourImageData.push(data);
                        break;
                    case CARTA.CatalogFilterResponse:
                        ack.CatalogFilterResponse.push(data);
                        break;
                    case CARTA.ScriptingResponse:
                        ack.ScriptingResponse.push(data);
                        break;
                    case CARTA.MomentProgress:
                        ack.MomentProgress.push(data);
                        break;
                    case CARTA.MomentResponse:
                        ack.MomentResponse.push(data);
                        break;
                }

                _count++;
                if (_count === count) {
                    resolve(ack);
                }
                if (timeout) {
                    let Timer = setTimeout(() => {
                        clearTimeout(Timer);
                        resolve(ack);
                    }, timeout);
                }
            };
        });
    }
    /// Receive all CARTA stream in a series
    /// Until the number: totalCount of mesaages have received or
    /// timeout: promise will not return CARTA data until time out if timeout > 0
    streamAny(count?: number, timeout?: number) {
        if (count <= 0) {
            return Promise.resolve();
        }

        let ack: any[] = [];

        return new Promise<any>(resolve => {
            this.connection.onmessage = (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);

                const eventNumber = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} #${eventId} @ ${performance.now()}`);
                }

                if (eventIcdVersion !== this.IcdVersion && config.log.warning) {
                    console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${this.IcdVersion}. Errors may occur`);
                }
                let eventType = this.CartaType.get(eventNumber);
                let data = eventType.decode(eventData);
                ack.push(data);

                if (ack.length >= count) {
                    resolve(ack);
                }
                if (timeout) {
                    let Timer = setTimeout(() => {
                        clearTimeout(Timer);
                        resolve(ack);
                    }, timeout);
                }
            };
        });
    }
    /// Receive CARTA stream async
    /// Until isWait == false
    streamUntil(isWait?: (type, data?, ack?) => boolean) {

        let ack: AckStream = {
            Responce: [],
            RasterTileData: [],
            RasterTileSync: [],
            SpatialProfileData: [],
            RegionStatsData: [],
            RegionHistogramData: [],
            SpectralProfileData: [],
            ContourImageData: [],
            CatalogFilterResponse: [],
            ScriptingResponse: [],
            MomentResponse: [],
            MomentProgress: [],
        };

        return new Promise<AckStream>((resolve, reject) => {
            this.connection.onmessage = (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);

                const eventNumber = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} #${eventId} @ ${performance.now()}`);
                }

                if (eventIcdVersion !== this.IcdVersion && config.log.warning) {
                    console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${this.IcdVersion}. Errors may occur`);
                }
                let eventType = this.CartaType.get(eventNumber);
                let data = eventType.decode(eventData);
                switch (eventType) {
                    default:
                        ack.Responce.push(data);
                        break;
                    case CARTA.EntryType:
                        ack.Responce.push(data);
                        console.warn(data);
                        break;
                    case CARTA.RasterTileData:
                        ack.RasterTileData.push(data);
                        break;
                    case CARTA.RasterTileSync:
                        ack.RasterTileSync.push(data);
                        break;
                    case CARTA.RegionStatsData:
                        ack.RegionStatsData.push(data);
                        break;
                    case CARTA.RegionHistogramData:
                        ack.RegionHistogramData.push(data);
                        break;
                    case CARTA.SpatialProfileData:
                        data.profiles = data.profiles.map(p => processSpatialProfile(p));
                        ack.SpatialProfileData.push(data);
                        break;
                    case CARTA.SpectralProfileData:
                        data.profiles = data.profiles.map(p => processSpectralProfile(p));
                        ack.SpectralProfileData.push(data);
                        break;
                    case CARTA.ContourImageData:
                        ack.ContourImageData.push(data);
                        break;
                    case CARTA.CatalogFilterResponse:
                        ack.CatalogFilterResponse.push(data);
                        break;
                    case CARTA.ScriptingResponse:
                        ack.ScriptingResponse.push(data);
                        break;
                    case CARTA.MomentProgress:
                        ack.MomentProgress.push(data);
                        break;
                    case CARTA.MomentResponse:
                        ack.MomentResponse.push(data);
                        break;
                }
                if (!isWait(eventType, data, ack)) {
                    resolve(ack);
                }
            };
        });
    }
    /// Receive all type of CARTA stream in a series
    /// Until isWait == false
    streamAnyUntil(isWait?: (type: any, data: any, ack: any[]) => boolean) {
        let ack: any = [];
        return new Promise<AckStream>((resolve, reject) => {
            this.connection.onmessage = (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);

                const eventNumber = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} #${eventId} @ ${performance.now()}`);
                }

                if (eventIcdVersion !== this.IcdVersion && config.log.warning) {
                    console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${this.IcdVersion}. Errors may occur`);
                }
                let eventType = this.CartaType.get(eventNumber);
                let data = eventType.decode(eventData);
                ack.push(data);

                if (!isWait(eventType, data, ack)) {
                    resolve(ack);
                }
            };
        });
    }
    /// Receive CARTA stream async
    /// Until the number: totalCount of mesaages have received or
    /// timeout: promise will not return CARTA data until time out if timeout > 0
    /// return a series of message types what we got
    streamType(count?: number, timeout?: number) {
        if (count <= 0) {
            return Promise.resolve();
        }

        let _count: number = 0;
        let ackMessage: string[] = [];

        return new Promise<string[]>(resolve => {
            this.connection.onmessage = (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                // const eventData = new Uint8Array(messageEvent.data, 8);

                const eventNumber = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} #${eventId} @ ${performance.now()}`);
                }

                if (eventIcdVersion !== this.IcdVersion && config.log.warning) {
                    console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${this.IcdVersion}. Errors may occur`);
                }
                ackMessage.push(this.CartaType.get(eventNumber));

                _count++;
                if (_count === count) {
                    resolve(ackMessage);
                }
                if (timeout) {
                    let Timer = setTimeout(() => {
                        clearTimeout(Timer);
                        resolve(ackMessage);
                    }, timeout);
                }
            };
        });
    }
    /// Receive CARTA stream unknown async
    /// Until the number: totalCount of mesaages have received or
    /// timeout: promise will not return CARTA data until time out if timeout > 0
    streamNull(count?: number, timeout?: number) {
        if (count <= 0) {
            return Promise.resolve();
        }

        let _count: number = 0;

        return new Promise<null>(resolve => {
            this.connection.onmessage = (messageEvent: MessageEvent) => {
                _count++;
                if (_count === count) {
                    resolve();
                }
                if (timeout) {
                    let Timer = setTimeout(() => {
                        clearTimeout(Timer);
                        resolve();
                    }, timeout);
                }
            };
        });
    }
};

export interface AckStream {
    Responce: any[],
    RasterTileData: CARTA.RasterTileData[];
    RasterTileSync: CARTA.RasterTileSync[];
    SpatialProfileData: CARTA.SpatialProfile[];
    RegionStatsData: CARTA.RegionStatsData[];
    RegionHistogramData: CARTA.RegionHistogramData[];
    SpectralProfileData: CARTA.SpectralProfileData[];
    ContourImageData: CARTA.ContourImageData[];
    CatalogFilterResponse: CARTA.CatalogFilterResponse[];
    ScriptingResponse: CARTA.ScriptingResponse[];
    MomentResponse: CARTA.MomentResponse[];
    MomentProgress: CARTA.MomentProgress[];
}
interface ProcessedSpatialProfile extends CARTA.ISpatialProfile { values: Float32Array; }
function processSpatialProfile(profile: CARTA.ISpatialProfile): ProcessedSpatialProfile {
    if (profile.rawValuesFp32 && profile.rawValuesFp32.length && profile.rawValuesFp32.length % 4 === 0) {
        return {
            coordinate: profile.coordinate,
            start: profile.start,
            end: profile.end,
            values: new Float32Array(profile.rawValuesFp32.slice().buffer)
        };
    }
    return {
        coordinate: profile.coordinate,
        start: profile.start,
        end: profile.end,
        values: null
    };
}
interface ProcessedSpectralProfile extends CARTA.ISpectralProfile { values: Float32Array | Float64Array; }
function processSpectralProfile(profile: CARTA.ISpectralProfile): ProcessedSpectralProfile {
    if (profile.rawValuesFp64 && profile.rawValuesFp64.length && profile.rawValuesFp64.length % 8 === 0) {
        return {
            coordinate: profile.coordinate,
            statsType: profile.statsType,
            values: new Float64Array(profile.rawValuesFp64.slice().buffer)
        };
    } else if (profile.rawValuesFp32 && profile.rawValuesFp32.length && profile.rawValuesFp32.length % 4 === 0) {
        return {
            coordinate: profile.coordinate,
            statsType: profile.statsType,
            values: new Float32Array(profile.rawValuesFp32.slice().buffer)
        };
    }
    return {
        coordinate: profile.coordinate,
        statsType: profile.statsType,
        values: null
    };
}
interface ProcessedContourSet {
    level: number;
    indexOffsets: Int32Array;
    coordinates: Float32Array;
}
function ProcessContourSet(contourSet: CARTA.IContourSet, zstdSimple): ProcessedContourSet {
    const isCompressed = contourSet.decimationFactor >= 1;

    let floatCoordinates: Float32Array;
    if (isCompressed) {
        // Decode raw coordinates from Zstd-compressed binary to a float array
        floatCoordinates = unshuffle(new Uint8Array(zstdSimple.decompress(contourSet.rawCoordinates).slice().buffer), contourSet.decimationFactor);
    } else {
        const u8Copy = contourSet.rawCoordinates.slice();
        floatCoordinates = new Float32Array(u8Copy.buffer);
    }
    // generate indices
    const indexOffsets = new Int32Array(contourSet.rawStartIndices.buffer.slice(contourSet.rawStartIndices.byteOffset, contourSet.rawStartIndices.byteOffset + contourSet.rawStartIndices.byteLength));

    return {
        level: contourSet.level,
        indexOffsets,
        coordinates: floatCoordinates.map((f: number) => f = f - 0.5),
    };
}
interface ProcessedContourData {
    fileId: number;
    imageBounds?: CARTA.IImageBounds;
    channel: number;
    stokes: number;
    progress: number;
    contourSets: ProcessedContourSet[];
}
export function ProcessContourData(contourData: CARTA.IContourImageData, zstdSimple): ProcessedContourData {
    return {
        fileId: contourData.fileId,
        channel: contourData.channel,
        stokes: contourData.stokes,
        imageBounds: contourData.imageBounds,
        progress: contourData.progress,
        contourSets: contourData.contourSets ? contourData.contourSets.map(contourSet => ProcessContourSet(contourSet, zstdSimple)) : null
    };
}
function unshuffle(raw: Uint8Array, decimationFactor: number): Float32Array {
    const numIntegers: number = raw.length / 4;
    const blockedLength: number = 4 * Math.floor(numIntegers / 4);
    const scale: number = 1.0 / decimationFactor;
    let buffer: number[] = new Array(16);
    let rawInt32: Int32Array = new Int32Array(new Uint8Array(raw).buffer);
    let data: number[] = new Array(numIntegers);
    let v: number = 0;
    for (; v < blockedLength; v += 4) {
        const i = 4 * v;

        buffer[0] = raw[i];
        buffer[1] = raw[i + 4];
        buffer[2] = raw[i + 8];
        buffer[3] = raw[i + 12];
        buffer[4] = raw[i + 1];
        buffer[5] = raw[i + 5];
        buffer[6] = raw[i + 9];
        buffer[7] = raw[i + 13];
        buffer[8] = raw[i + 2];
        buffer[9] = raw[i + 6];
        buffer[10] = raw[i + 10];
        buffer[11] = raw[i + 14];
        buffer[12] = raw[i + 3];
        buffer[13] = raw[i + 7];
        buffer[14] = raw[i + 11];
        buffer[15] = raw[i + 15];

        let bufferInt32 = new Int32Array(new Uint8Array(buffer).buffer);
        data[v] = bufferInt32[0] * scale;
        data[v + 1] = bufferInt32[1] * scale;
        data[v + 2] = bufferInt32[2] * scale;
        data[v + 3] = bufferInt32[3] * scale;

    }
    for (; v < numIntegers; v++) {
        data[v] = rawInt32[v] * scale;
    }
    let lastX: number = 0;
    let lastY: number = 0;

    for (let i = 0; i < numIntegers - 1; i += 2) {
        let deltaX: number = data[i];
        let deltaY: number = data[i + 1];
        lastX += deltaX;
        lastY += deltaY;
        data[i] = lastX;
        data[i + 1] = lastY;
    }
    return new Float32Array(data);
}