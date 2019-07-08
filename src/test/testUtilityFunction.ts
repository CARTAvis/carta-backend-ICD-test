import {CARTA} from "carta-protobuf";
/// CARTA ICD definition
const IcdVersion = 4;
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
    AddRequireTiles: 30,
    RemoveRequireTiles: 31,
    RasterTileData: 32,
};
/// Transfer functionality from String to Uint8Array
export function stringToUint8Array(str: string, padLength: number): Uint8Array {
    const bytes = new Uint8Array(padLength);
    for (let i = 0; i < Math.min(str.length, padLength); i++) {
        const charCode = str.charCodeAt(i);
        bytes[i] = (charCode <= 0xFF ? charCode : 0);
    }
    return bytes;
}
/// Transfer functionality from Uint8Array to String
export function getEventName(byteArray: Uint8Array): String {
    if (!byteArray || byteArray.length < 32) {
        return "";
    }
    const nullIndex = byteArray.indexOf(0);
    if (nullIndex >= 0) {
        byteArray = byteArray.slice(0, byteArray.indexOf(0));
    }
    return String.fromCharCode.apply(null, byteArray);
}
/// Send websocket message
/// Parameters: connection(Websocket ref), cartaType(CARTA.type), eventMessage(the sending message)
export function setEvent(
    connection: WebSocket, 
    cartaType: any, eventMessage: any) {

    let message = cartaType.create(eventMessage);
    let payload = cartaType.encode(message).finish();
    let eventData = new Uint8Array(8 + payload.byteLength);
    const eventHeader16 = new Uint16Array(eventData.buffer, 0, 2);
    const eventHeader32 = new Uint32Array(eventData.buffer, 4, 1);
    eventHeader16[0] = EventType[cartaType.name];
    eventHeader16[1] = IcdVersion;
    eventHeader32[0] = 0; // eventCounter;

    eventData.set(payload, 8);

    connection.send(eventData);
}
/// Send websocket message async
/// Parameters: connection(Websocket ref), cartaType(CARTA.type), eventMessage(the sending message)
/// return a Promise<any> for await
export function setEventAsync(
    connection: WebSocket, 
    cartaType: any, 
    eventMessage: any
) {
    return new Promise( resolve => {
        let message = cartaType.create(eventMessage);
        let payload = cartaType.encode(message).finish();
        let eventData = new Uint8Array(8 + payload.byteLength);
        const eventHeader16 = new Uint16Array(eventData.buffer, 0, 2);
        const eventHeader32 = new Uint32Array(eventData.buffer, 4, 1);
        eventHeader16[0] = EventType[cartaType.name];
        eventHeader16[1] = IcdVersion;
        eventHeader32[0] = 0; // eventCounter;

        eventData.set(payload, 8);

        connection.send(eventData);

        resolve();
    });
}
/// Get websocket message
/// Parameters: connection(Websocket ref), cartaType(CARTA.type)
/// Function toDo: Parameters: dataMessage(the responding message)
export function getEvent(
    connection: WebSocket, 
    cartaType: any, 
    toDo: (dataMessage: any) => void,
) {

    connection.onmessage = (messageEvent: MessageEvent) => {
        const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
        const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
        const eventData = new Uint8Array(messageEvent.data, 8);

        const eventType = eventHeader16[0];
        const eventIcdVersion = eventHeader16[1];
        const eventId = eventHeader32[0];

        if (eventIcdVersion !== IcdVersion) {
            console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${IcdVersion}. Errors may occur`);
        }

        if (EventType[cartaType.name] === eventType) {
            let dataMessage = cartaType.decode(eventData);
            toDo(dataMessage);
        }
    };
}
/// Get websocket message async
/// Parameters: connection(Websocket ref), cartaType(CARTA.type)
/// Function promiseToDo: As absent, do nothing but receive a message.
/// Parameters: dataMessage(the responding message), resolve as callback be finished, reject as callback be finished
/// return a Promise<any> for await
export function getEventAsync(
    connection: WebSocket, 
    cartaType: any, 
    timeout?: number,
) {
    return new Promise( (resolve, reject) => {
        connection.onmessage = async (messageEvent: MessageEvent) => {
            const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
            const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
            const eventData = new Uint8Array(messageEvent.data, 8);

            const eventType = eventHeader16[0];
            const eventIcdVersion = eventHeader16[1];
            const eventId = eventHeader32[0];

            if (eventIcdVersion !== IcdVersion) {
                console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${IcdVersion}. Errors may occur`);
            }

            if (EventType[cartaType.name] === eventType) {
                let dataMessage = cartaType.decode(eventData);
                resolve(dataMessage);
                if(timeout){
                    reject();
                }
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
/// Get CARTA stream
export function getStream(
    connection: WebSocket,
    totalCount: number,
    resolve: () => void,
    toDo?: {
        RasterTileData?: (DataMessage?: any) => void,
        RasterImageData?: (DataMessage?: any) => void,
        SpatialProfileData?: (DataMessage?: any) => void,
        RegionStatsData?: (DataMessage?: any) => void,
        RegionHistogramData?: (DataMessage?: any) => void,
        SpectralProfileData?: (DataMessage?: any) => void,
    },
) {
    if (totalCount <= 0) {
        resolve();
    }
    let _count: number = 0;
    connection.onmessage = (messageEvent: MessageEvent) => {
        const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
        const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
        const eventData = new Uint8Array(messageEvent.data, 8);

        const eventType = eventHeader16[0];
        const eventIcdVersion = eventHeader16[1];
        const eventId = eventHeader32[0];
        // console.log(eventType);

        if (eventIcdVersion !== IcdVersion) {
            console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${IcdVersion}. Errors may occur`);
        }
        if (toDo) {
            switch (eventType) {
                case EventType["RasterTileData"]:
                    if (typeof toDo.RasterTileData === "function") {
                        toDo.RasterTileData(CARTA.RasterTileData.decode(eventData));
                    }
                    break;
                case EventType["RasterImageData"]:
                    if (typeof toDo.RasterImageData === "function") {
                        toDo.RasterImageData(CARTA.RasterImageData.decode(eventData));
                    }
                    break;
                case EventType["SpatialProfileData"]:
                    if (typeof toDo.SpatialProfileData === "function") {
                        toDo.SpatialProfileData(CARTA.SpatialProfileData.decode(eventData));
                    }
                    break;
                case EventType["RegionStatsData"]:
                    if (typeof toDo.RegionStatsData === "function") {
                        toDo.RegionStatsData(CARTA.RegionStatsData.decode(eventData));
                    }
                    break;
                case EventType["RegionHistogramData"]:
                    if (typeof toDo.RegionHistogramData === "function") {
                        toDo.RegionHistogramData(CARTA.RegionHistogramData.decode(eventData));
                    }
                    break;
                case EventType["SpectralProfileData"]:
                    if (typeof toDo.SpectralProfileData === "function") {
                        toDo.SpectralProfileData(CARTA.SpectralProfileData.decode(eventData));
                    }
                    break;
                default:
                    break;
            }
        }
        _count++;
        if (_count === totalCount) {
            resolve();
        }
    };
}
/// Get CARTA stream async
/// Until the number: totalCount of mesaages have received
export function getStreamAsync(
    connection: WebSocket,
    count?: number,
) {
    if (count <= 0) {
        return Promise.resolve();
    }
    let _count: number = 0;
    let ack = {
        RasterTileData: CARTA.RasterTileData,
        RasterImageData: CARTA.RasterImageData,
        SpatialProfileData: CARTA.SpatialProfile,
        RegionStatsData: CARTA.RegionStatsData,
        RegionHistogramData: CARTA.RegionHistogramData,
        SpectralProfileData: CARTA.SpectralProfileData,
    };
    return new Promise( resolve => {
        connection.onmessage = (messageEvent: MessageEvent) => {
            const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
            const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
            const eventData = new Uint8Array(messageEvent.data, 8);

            const eventType = eventHeader16[0];
            const eventIcdVersion = eventHeader16[1];
            const eventId = eventHeader32[0];

            if (eventIcdVersion !== IcdVersion) {
                console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${IcdVersion}. Errors may occur`);
            }
            switch (eventType) {
                case EventType["RasterTileData"]:
                    ack.RasterTileData = CARTA.RasterTileData.decode(eventData);
                    break;
                case EventType["RasterImageData"]:
                    ack.RasterImageData = CARTA.RasterImageData.decode(eventData);
                    break;
                case EventType["SpatialProfileData"]:
                    ack.SpatialProfileData = CARTA.SpatialProfileData.decode(eventData);
                    break;
                case EventType["RegionStatsData"]:
                    ack.RegionStatsData = CARTA.RegionStatsData.decode(eventData);
                    break;
                case EventType["RegionHistogramData"]:
                    ack.RegionHistogramData = CARTA.RegionHistogramData.decode(eventData);
                    break;
                case EventType["SpectralProfileData"]:
                    ack.SpectralProfileData = CARTA.SpectralProfileData.decode(eventData);
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