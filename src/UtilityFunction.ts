/// Toollet functions

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
/// Wait
export function sleep(miliseconds: number) {
    return new Promise( timeout => {
        setTimeout(() => timeout(true), miliseconds);
    });    
}
/// Send websocket message
export function setEvent(
    connection: WebSocket, eventName: string, 
    eventType: any, eventMessage: any) {

    let message = eventType.create(eventMessage);
    let payload = eventType.encode(message).finish();
    let eventData = new Uint8Array(32 + 4 + payload.byteLength);

    eventData.set(stringToUint8Array(eventName, 32));
    eventData.set(new Uint8Array(new Uint32Array([1]).buffer), 32);
    eventData.set(payload, 36);

    connection.send(eventData);
} 
/// Get websocket message
export function getEvent(
    connection: WebSocket, eventName: string, 
    eventType: any, toDo: (DataMessage: any) => void) {
        
    connection.onmessage = (messageEvent: MessageEvent) => {
        if (eventName === getEventName(new Uint8Array(messageEvent.data, 0, 32))) {
            let eventData = new Uint8Array(messageEvent.data, 36);
            let DataMessage = eventType.decode(eventData);
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