import {CARTA} from "carta-protobuf";
import config from "./config.json";

/// CARTA ICD definition
const IcdVersion = 10;
export const EventType = {
    EmptyEvent: 0,
    RegisterViewer: 1,
    FileListRequest: 2,
    FileInfoRequest: 3,
    OpenFile: 4,
    SetImageView: 5,
    SetImageChannels: 6,
    SetCursor: 7,
    SetSpatialRequirements: 8,
    SetHistogramRequirements: 9,
    SetStatsRequirements: 10,
    SetRegion: 11,
    RemoveRegion: 12,
    CloseFile: 13,
    SetSpectralRequirements: 14,
    StartAnimation: 15,
    StartAnimationAck: 16,
    StopAnimation: 17,
    RegisterViewerAck: 18,
    FileListResponse: 19,
    FileInfoResponse: 20,
    OpenFileAck: 21,
    SetRegionAck: 22,
    RegionHistogramData: 23,
    RasterImageData: 24,
    SpatialProfileData: 25,
    SpectralProfileData: 26,
    RegionStatsData: 27,
    ErrorData: 28,
    AnimationFlowControl: 29,
    AddRequiredTiles: 30,
    RemoveRequireTiles: 31,
    RasterTileData: 32,
    RegionListRequest: 33,
    RegionListResponse: 34,
    RegionFileInfoRequest: 35,
    RegionFileInfoResponse: 36,
    ImportRegion: 37,
    ImportRegionAck: 38,
    ExportRegion: 39,
    ExportRegionAck: 40,
    SetUserPreferences: 41,
    SetUserPreferencesAck: 42,
    SetUserLayout: 43,
    SetUserLayoutAck: 44,
    SetContourParameters: 45,
    ContourImageData: 46,
    ResumeSession: 47,
    ResumeSessionAck: 48,
};
export class Client {
    static eventCount = {value: 0};
    connection: WebSocket;
    // Construct a websocket connection to url
    constructor(url: string) {
        this.connection = new WebSocket(url);
        this.connection.binaryType = "arraybuffer";
    } 
    open() {
        return new Promise( (resolve, reject) => {
            this.connection.onopen = onOpen;
            function onOpen (this: WebSocket, ev: Event) {
                resolve();
            }
        });
    }
    close() {
        this.connection.close();
        return new Promise( (resolve, reject) => {
            this.connection.onclose = onClose;
            function onClose (this: WebSocket, ev: Event) {
                resolve();
            }
        });
    }
    /// Send websocket message async
    /// Parameters: connection(Websocket ref), cartaType(CARTA.type), eventMessage(the sending message)
    /// return a Promise<any> for await
    send(cartaType: any, eventMessage: any,) {
        return new Promise( resolve => {
            let message = cartaType.create(eventMessage);
            let payload = cartaType.encode(message).finish();
            let eventData = new Uint8Array(8 + payload.byteLength);
            const eventHeader16 = new Uint16Array(eventData.buffer, 0, 2);
            const eventHeader32 = new Uint32Array(eventData.buffer, 4, 1);
            eventHeader16[0] = EventType[cartaType.name];
            eventHeader16[1] = IcdVersion;
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
    receive(cartaType: any, timeout?: number) {
        return new Promise( (resolve, reject) => {
            this.connection.onmessage = async (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);
    
                const eventType = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${Object.keys(EventType).find( f => EventType[f] === eventType)} @ ${eventId}`);
                }
    
                if (eventIcdVersion !== IcdVersion && config.log.warning) {
                    console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${IcdVersion}. Errors may occur`);
                }
    
                if (EventType[cartaType.name] === eventType) {
                    if(timeout){
                        reject();
                    }
                    let data;
                    switch (cartaType) {
                        case CARTA.SpatialProfileData:
                            data = CARTA.SpatialProfileData.decode(eventData);
                            data.profiles = data.profiles.map( p => processSpatialProfile(p));
                            break;
                        case CARTA.SpectralProfileData:
                            data = CARTA.SpectralProfileData.decode(eventData);
                            data.profiles = data.profiles.map( p => processSpectralProfile(p));
                            break;
                        default:
                            data = cartaType.decode(eventData);
                            break;
                    }
                    resolve(data);
                }
            };
            if(timeout){
                let Timer = setTimeout(() => {
                    clearTimeout(Timer);
                    resolve();
                }, timeout); 
            }
        });
    }
    /// Mock a receiving of websocket message in any type async
    /// timeout: promise will return nothing until time out if timeout > 0
    /// return a Promise<null> for await
    receiveMock(timeout?: number) {
        return new Promise( (resolve, reject) => {
            this.connection.onmessage = async (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);    
                const eventType = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
                if (config.log.event) {
                    console.log(`<= ${Object.keys(EventType).find( f => EventType[f] === eventType)} @ ${eventId}`);
                }
                resolve();
            };
            if(timeout){
                let Timer = setTimeout(() => {
                    clearTimeout(Timer);
                    resolve();
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
            RasterTileData: [],
            RasterImageData: [],
            SpatialProfileData: [],
            RegionStatsData: [],
            RegionHistogramData: [],
            SpectralProfileData: [],
        };

        return new Promise( resolve => {
            this.connection.onmessage = (messageEvent: MessageEvent) => {
                const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
                const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
                const eventData = new Uint8Array(messageEvent.data, 8);
    
                const eventType = eventHeader16[0];
                const eventIcdVersion = eventHeader16[1];
                const eventId = eventHeader32[0];
    
                if (eventIcdVersion !== IcdVersion && config.log.warning) {
                    console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${IcdVersion}. Errors may occur`);
                }
                let _profileData;
                switch (eventType) {
                    case EventType["RasterTileData"]:
                        ack.RasterTileData.push(CARTA.RasterTileData.decode(eventData));
                        break;
                    case EventType["RasterImageData"]:
                        ack.RasterImageData.push(CARTA.RasterImageData.decode(eventData));
                        break;
                    case EventType["RegionStatsData"]:
                        ack.RegionStatsData.push(CARTA.RegionStatsData.decode(eventData));
                        break;
                    case EventType["RegionHistogramData"]:
                        ack.RegionHistogramData.push(CARTA.RegionHistogramData.decode(eventData));
                        break;
                    case EventType["SpatialProfileData"]:
                        _profileData = CARTA.SpatialProfileData.decode(eventData);
                        _profileData.profiles = _profileData.profiles.map( p => processSpatialProfile(p));
                        ack.SpatialProfileData.push(_profileData);
                        break;
                    case EventType["SpectralProfileData"]:
                        _profileData = CARTA.SpectralProfileData.decode(eventData);
                        _profileData.profiles = _profileData.profiles.map( p => processSpectralProfile(p));
                        ack.SpectralProfileData.push(_profileData);
                        break;
                    default:
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
    RasterTileData: CARTA.RasterTileData[];
    RasterImageData: CARTA.RasterImageData[];
    SpatialProfileData: CARTA.SpatialProfile[];
    RegionStatsData: CARTA.RegionStatsData[];
    RegionHistogramData: CARTA.RegionHistogramData[];
    SpectralProfileData: CARTA.SpectralProfileData[];
}
interface ProcessedSpatialProfile extends CARTA.ISpatialProfile {values: Float32Array;}
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
interface ProcessedSpectralProfile extends CARTA.ISpectralProfile {values: Float32Array | Float64Array;}
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