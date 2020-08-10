import { CARTA } from "carta-protobuf";

import config from "./config.json";
let nodeusage = require("usage");
const fs = require("fs");
const procfs = require("procfs-stats");
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
    connection: WebSocket;
    // Construct a websocket connection to url
    constructor(url: string) {
        this.connection = new WebSocket(url);
        this.connection.binaryType = "arraybuffer";
    }
    open(timeout?: number) {
        return new Promise<void>((resolve, reject) => {
            this.connection.onopen = onOpen;
            function onOpen(this: WebSocket, ev: Event) {
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
            function onClose(this: WebSocket, ev: Event) {
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
    send(cartaType: any, eventMessage: any, ) {
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
                console.log(`${cartaType.name} => @ ${eventHeader32[0]}`);
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
                    console.log(`<= ${this.CartaType.get(eventNumber).name} @ ${eventId}`);
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
    receiveAny(timeout?: number) {
        return new Promise<any>((resolve, reject) => {
            this.connection.onmessage = async (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);
                const eventNumber = eventHeader16[0];
                // const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} @ ${eventId}`);
                }

                let data;
                let type = this.CartaType.get(eventNumber);
                switch (type) {
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
                    reject();
                }, timeout);
            }
        });
    }
    /// Receive CARTA stream async
    /// Until the number: totalCount of mesaages have received
    stream(count?: number) {
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
        };

        return new Promise<AckStream>(resolve => {
            this.connection.onmessage = (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);

                const eventNumber = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];

                if (eventIcdVersion !== this.IcdVersion && config.log.warning) {
                    console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${this.IcdVersion}. Errors may occur`);
                }
                if (config.log.event) {
                    console.log(`<= ${this.CartaType.get(eventNumber).name} @ ${eventId}`);
                }

                let data;
                switch (this.CartaType.get(eventNumber)) {
                    default:
                        ack.Responce.push(this.CartaType.get(eventNumber).decode(eventData));
                        break;
                    case CARTA.RasterTileData:
                        ack.RasterTileData.push(CARTA.RasterTileData.decode(eventData));
                        break;
                    case CARTA.RasterTileSync:
                        ack.RasterTileSync.push(CARTA.RasterTileSync.decode(eventData));
                        break;
                    case CARTA.RegionStatsData:
                        ack.RegionStatsData.push(CARTA.RegionStatsData.decode(eventData));
                        break;
                    case CARTA.RegionHistogramData:
                        ack.RegionHistogramData.push(CARTA.RegionHistogramData.decode(eventData));
                        break;
                    case CARTA.SpatialProfileData:
                        data = CARTA.SpatialProfileData.decode(eventData);
                        data.profiles = data.profiles.map(p => processSpatialProfile(p));
                        ack.SpatialProfileData.push(data);
                        break;
                    case CARTA.SpectralProfileData:
                        data = CARTA.SpectralProfileData.decode(eventData);
                        data.profiles = data.profiles.map(p => processSpectralProfile(p));
                        ack.SpectralProfileData.push(data);
                        break;
                    case CARTA.ContourImageData:
                        ack.ContourImageData.push(CARTA.ContourImageData.decode(eventData));
                        break;
                    case CARTA.CatalogFilterResponse:
                        ack.CatalogFilterResponse.push(CARTA.CatalogFilterResponse.decode(eventData));
                        break;
                }

                _count++;
                if (_count === count) {
                    resolve(ack);
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
export function Usage(pid): Promise<any> {
    return new Promise((resolve, reject) => {
        nodeusage.lookup(
            pid, { keepHistory: true },
            (err, info) => {
                if (err) {
                    console.log("Pid usage error: " + err);
                    reject();
                }
                resolve(info);
            }
        );
    });
}
export function Wait(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
export function EmptyTxt(file) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, "", err => {
            if (err) {
                console.log("Empty log file error: " + err);
                reject();
            }
            resolve();
        });
    });
}
export function AppendTxt(file, txt) {
    return new Promise((resolve, reject) => {
        fs.appendFile(file, JSON.stringify(txt) + "\n", err => {
            if (err) {
                console.log("Write log file error: " + err);
                reject();
            }
            resolve();
        });
    });
}
export function DiskUsage(pid) {
    return new Promise((resolve, reject) => {
        if (procfs.works) {
            procfs(pid).io((err, io) => {
                resolve(io.read_bytes);
            });
        } else {
            reject();
        }
    });
}
export function ThreadNumber(pid) {
    return new Promise((resolve, reject) => {
        if (procfs.works) {
            procfs(pid).threads((err, task) => {
                resolve(task.length);
            });
        } else {
            reject();
        }
    });
}