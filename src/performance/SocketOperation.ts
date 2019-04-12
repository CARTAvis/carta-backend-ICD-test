import * as child_process from "child_process";
import {CARTA} from "carta-protobuf";
import * as Utility from "../UtilityFunction";
let nodeusage = require("usage");

/// Log result
export async function
Outcome(
    timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number}[],
) {
    console.log(`Backend testing outcome:\n${timeEpoch
        .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(5)}% & RAM = ${e.RAM}kB as thread# = ${e.thread}`).join(` \n`)}`);
}
export async function
OutcomeWithFile(
    timeEpoch: {time: number, thread: number, CPUusage: number, RAM: number, fileName: string}[],
) {
    console.log(`Backend testing outcome:\n${timeEpoch
        .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(5)}% & RAM = ${e.RAM}kB as file: ${e.fileName}`).join(` \n`)}`);
}
/// Create a new carta_backend service
export async function 
CartaBackend(
    baseDirectory: string, 
    port: number, 
    threadNumber: number, 
    backendDirectory: string, 
    timeout: number,
    logMessage: boolean
) {
    let cartaBackend = await child_process.execFile(
        `./carta_backend`, [`root=base`, `base=${baseDirectory}`, `port=${port}`, `threads=${threadNumber}`],
        {
            cwd: backendDirectory, 
            timeout
        }
    );
    cartaBackend.on("error", error => {
        console.error(`error: \n ${error}`);
    });
    cartaBackend.stdout.on("data", data => {
        if (logMessage) {
            console.log(data);
        }
    });
    return cartaBackend;
}
/// Create a new client connection
export async function
SocketClient(
    serverURL: string,
    port: number,
    reconnectWait: number,
) {
    let Connection = await new WebSocket(`${serverURL}:${port}`);
    
    while (Connection.readyState !== WebSocket.OPEN) {
        await Connection.close();
        Connection = await new WebSocket(`${serverURL}:${port}`);
        await new Promise( time => setTimeout(time, reconnectWait));
    }
    Connection.binaryType = "arraybuffer";
        
    return Connection;
}
/// Send CARTA.RegisterViewer then get CARTA.RegisterViewerAck
export async function 
RegisterViewer(
    Connection: WebSocket,
    CallbackFunc: () => Promise<void> = undefined,
) {
    let RegisterViewerAckTemp: CARTA.RegisterViewerAck;
    await Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
        {
            sessionId: "", 
            apiKey: "1234"
        }
    );
    await new Promise( resolve => { 
        Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
            async RegisterViewerAck => {
                expect(RegisterViewerAck.success).toBe(true);
                if (CallbackFunc) {
                    await CallbackFunc();
                }
                resolve();           
            }
        );
    });
    return RegisterViewerAckTemp;
}
/// Send CARTA.OpenFile then get CARTA.OpenFileAck
export async function 
OpenFile(
    Connection: WebSocket,
    directory: string,
    file: string,
    CallbackFunc: (timer: number) => Promise<void> = undefined,
) {
    let OpenFileAckTemp: CARTA.OpenFileAck;
    await Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
        {
            directory, 
            file,
            hdu: "0", 
            fileId: 0, 
            renderMode: CARTA.RenderMode.RASTER,
        }
    );
    let timer = await performance.now();
    await new Promise( resolve => {
        Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
            async (OpenFileAck: CARTA.OpenFileAck) => {
                if (!OpenFileAck.success) {
                    console.error(OpenFileAck.fileInfo.name + " : " + OpenFileAck.message);
                }
                expect(OpenFileAck.success).toBe(true);
                OpenFileAckTemp = OpenFileAck;
                if (CallbackFunc) {
                    await CallbackFunc(timer);
                }
                resolve();
            }
        );
    });
    return OpenFileAckTemp;
}
/// Send CARTA.SetImageView then get CARTA.RasterImageData
export async function 
SetImageView(
    Connection: WebSocket,
    OpenFileAck: CARTA.OpenFileAck,
    CallbackFunc: (timer: number) => Promise<void> = undefined,
) {
    let RasterImageDataTemp: CARTA.RasterImageData;
    await Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView, 
        {
            fileId: 0, 
            imageBounds: {
                xMin: 0, xMax: OpenFileAck.fileInfoExtended.width, 
                yMin: 0, yMax: OpenFileAck.fileInfoExtended.height
            }, 
            mip: 16, 
            compressionType: CARTA.CompressionType.ZFP,
            compressionQuality: 11, 
            numSubsets: 4,
        }
    );
    let timer = await performance.now();
    await new Promise( resolve => {
        Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
            async (RasterImageData: CARTA.RasterImageData) => {
                expect(RasterImageData.fileId).toEqual(0);
                RasterImageDataTemp = RasterImageData;
                if (CallbackFunc) {
                    await CallbackFunc(timer);
                }
                resolve();
            }
        );
    });
    return RasterImageDataTemp;
}