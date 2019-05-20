/// Toollet functions
import {CARTA} from "carta-protobuf";
/// Toollet functions
const IcdVersion = 3;
export const EventType = {
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
/// Get websocket message
export function getEvent(
    connection: WebSocket, 
    cartaType: any, toDo: (DataMessage: any) => void) {
        
    connection.onmessage = (messageEvent: MessageEvent) => {
        const eventHeader16 = new Uint16Array(messageEvent.data, 0, 2);
        const eventHeader32 = new Uint32Array(messageEvent.data, 4, 1);
        const eventData = new Uint8Array(messageEvent.data, 8);

        const eventType = eventHeader16[0];
        const eventIcdVersion = eventHeader16[1];
        const eventId = eventHeader32[0];

        // if (eventIcdVersion !== IcdVersion) {
        //     console.warn(`Server event has ICD version ${eventIcdVersion}, which differs from frontend version ${IcdVersion}. Errors may occur`);
        // }
        if (EventType[cartaType.name] === eventType) {
            let DataMessage = cartaType.decode(eventData);
            toDo(DataMessage);
        }
    };
}
/// Roll array item
export function arrayNext (arr: any, state: {index: number}) {
    arr.next = () => { 
        if (++state.index >= arr.length) {
            state.index = 0;
        } 
        return arr[state.index];
    };
    arr.current = () =>  arr[state.index];
    return arr;
}
/// Loop array item to generate
export function* arrayGeneratorLoop (array: any[]) {
    let index: number = -1;
    while (index < array.length) {
        if (index === array.length - 1) {
            index = 0;
        } else {
            index++;
        }
        yield array[index];
    }
}
