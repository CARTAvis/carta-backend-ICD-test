import * as child_process from "child_process";

import { CARTA } from "carta-protobuf";

import * as Utility from "../UtilityFunction";
// const procfs = require("procfs-stats");
// const nodeusage = require("usage");
// const fs = require("fs");

/// Log result
export interface Report {
    file: string;
    timeEpoch: TimeEpoch[];
}
export interface TimeEpoch {
    time: number;
    thread: number;
    CPUusage: number;
    RAM: number;
    fileName: string;
    Disk: number;
}
export async function
    Outcome(
        timeEpoch: { time: number, thread: number, CPUusage: number, RAM: number }[],
) {
    console.log(`Backend testing outcome:\n${timeEpoch
        .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(5)}% & RAM = ${e.RAM}kB as thread# = ${e.thread}`).join(` \n`)}`);
}
export async function
    OutcomeWithFile(
        timeEpoch: { time: number, thread: number, CPUusage: number, RAM: number, fileName: string }[],
) {
    console.log(`Backend testing outcome:\n${timeEpoch
        .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(5)}% & RAM = ${e.RAM}kB as file: ${e.fileName}`).join(` \n`)}`);
}
export async function
    OutcomeWithDiskIO(
        timeEpoch: { time: number, thread: number, CPUusage: number, RAM: number, fileName: string, Disk: number }[],
) {
    console.log(`Backend testing outcome:\n${timeEpoch
        .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(5)}% & RAM = ${e.RAM / 1024}kB & Disk read = ${(e.Disk / 1024).toFixed(0)}kB as file: ${e.fileName}`).join(` \n`)}`);
}
export async function
    Report(
        report: Report,
) {
    console.log(`Backend testing outcome on ${report.file}:\n${report.timeEpoch
        .map(e => `${e.time.toPrecision(5)}ms with CPU usage = ${e.CPUusage.toPrecision(5)}% & RAM = ${e.RAM}kB as thread# = ${e.thread}`).join(` \n`)}`);
}
/// Record label to file
export async function
    WriteLebelTo(
        reportFileName: string,
) {
    fs.appendFileSync(reportFileName,
        `ImageFile\t#ThreadSet\tTimeElapsed\tCPU\tRAM\tDisk\t#ThreadReal\n`
    );
}
/// Record result to file
export async function
    WriteReportTo(
        reportFileName: string,
        pid: number,
        imageFile: string,
        threadNumberSet: number,
        timeElapsed: number[],
        cpuCount: { user: number, total: number } = { user: 0, total: 0 },
) {
    let diskR: number = 0;
    let usedThreadNumber: number = 0;
    if (procfs.works) {
        let ps = procfs(pid);
        await new Promise(resolve => {
            ps.io((err, io) => {
                diskR = io.read_bytes;
                resolve();
            });
        });
        await new Promise(resolve => {
            ps.threads((err, task) => {
                usedThreadNumber = task.length;
                resolve();
            });
        });
    }
    let cpuUsage = cpuCount.total ? (100 * cpuCount.user / cpuCount.total).toFixed(4) : 0;
    await new Promise(resolve => {
        nodeusage.lookup(
            pid,
            (err, info) => {
                fs.appendFileSync(reportFileName,
                    `${imageFile.split("/")[1].slice(7)}\t` +
                    `${threadNumberSet.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}\t` +
                    `${(timeElapsed.reduce((a, b) => a + b) / timeElapsed.length).toFixed(4)}\t` +
                    `${cpuUsage ? cpuUsage : info.cpu.toFixed(4)}\t` +
                    `${info.memory}\t` +
                    `${diskR}\t` +
                    `${usedThreadNumber.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}\t` +
                    "\n"
                );
                resolve();
            }
        );
    });
}
/// Create a new carta_backend service
export async function
    CartaBackend(
        baseDirectory: string,
        port: number,
        threadNumber: number,
        ompThreadNumber: number,
        timeout: number,
        backendDirectory?: string,
        outputFile?: string,
        logMessage?: boolean,
    ) {
    let cartaBackend = await child_process.execFile(
        `/usr/local/bin/pagecache-management.sh /home/hengtai/carta-backend/build/carta_backend`,
        [
            `root=base`, `base=${baseDirectory}`,
            `port=${port}`, `threads=${threadNumber}`,
            `verbose=true`, `omp_threads=${ompThreadNumber}`,
            outputFile ? `> ${outputFile}` : "",
        ],
        {
            // cwd: backendDirectory, 
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
/// Create a psrecord monitor
export async function
    Psrecord(
        pid: number,
        saveDirectory: string,
        fileName: string,
        threadNumber: number,
        timeout: number,
) {
    let psrecord = await child_process.exec(
        `psrecord` + ` ${pid}` +
        ` --log ${fileName.split("/")[1].slice(7)}-${threadNumber.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}.txt` +
        ` --plot ${fileName.split("/")[1].slice(7)}-${threadNumber.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}.png` +
        ` --interval 0.005`,
        {
            cwd: saveDirectory,
            timeout
        }
    );
    return psrecord;
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
        await new Promise(time => setTimeout(time, reconnectWait));
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
    await Utility.setEvent(Connection, CARTA.RegisterViewer,
        {
            sessionId: 0,
            apiKey: "1234"
        }
    );
    await new Promise(resolve => {
        Utility.getEvent(Connection, CARTA.RegisterViewerAck,
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
    await Utility.setEvent(Connection, CARTA.OpenFile,
        {
            directory,
            file,
            hdu: "0",
            fileId: 0,
            renderMode: CARTA.RenderMode.RASTER,
        }
    );
    let timer = await performance.now();
    await new Promise(resolve => {
        Utility.getEvent(Connection, CARTA.OpenFileAck,
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
    await Utility.setEvent(Connection, CARTA.SetImageView,
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
    await new Promise(resolve => {
        Utility.getEvent(Connection, CARTA.RasterImageData,
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
/// Send CARTA.SetImageView & CARTA.SetSpatialRequirements then get CARTA.RasterImageData
export async function
    SetSpatialRequirements(
        Connection: WebSocket,
        OpenFileAck: CARTA.OpenFileAck,
        CallbackFunc: (timer: number) => Promise<void> = undefined,
) {
    let RasterImageDataTemp: CARTA.RasterImageData;
    await Utility.setEvent(Connection, CARTA.SetImageView,
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
    await Utility.setEvent(Connection, CARTA.SetSpatialRequirements,
        {
            fileId: 0,
            regionId: 0,
            spatialProfiles: ["x", "y"],
        }
    );
    let timer = await performance.now();
    await new Promise(resolve => {
        Utility.getEvent(Connection, CARTA.RasterImageData,
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
/// Send CARTA.SetCursor then get CARTA.SpatialProfileData
export async function
    CursorSpatialProfileData(
        Connection: WebSocket,
        RasterImageData: CARTA.RasterImageData,
        CallbackFunc: (timer: number) => Promise<void> = undefined,
) {
    let SpatialProfileDataTemp: CARTA.SpatialProfileData;
    await Utility.setEvent(Connection, CARTA.SetCursor,
        {
            fileId: 0,
            point: {
                x: Math.floor(Math.random() * RasterImageData.imageBounds.xMax),
                y: Math.floor(Math.random() * RasterImageData.imageBounds.yMax)
            },
        }
    );
    let timer = await performance.now();
    await new Promise(resolve => {
        Utility.getEvent(Connection, CARTA.SpatialProfileData,
            async (SpatialProfileData: CARTA.SpatialProfileData) => {
                expect(SpatialProfileData.profiles.length).not.toEqual(0);
                SpatialProfileDataTemp = SpatialProfileData;
                if (CallbackFunc) {
                    await CallbackFunc(timer);
                }
                resolve();
            }
        );
    });
    return SpatialProfileDataTemp;
}
/// Send CARTA.SetImageView & CARTA.SetSpectralRequirements then get CARTA.RasterImageData
export async function
    SetSpectralRequirements(
        Connection: WebSocket,
        OpenFileAck: CARTA.OpenFileAck,
        CallbackFunc: (timer: number) => Promise<void> = undefined,
) {
    let RasterImageDataTemp: CARTA.RasterImageData;
    await Utility.setEvent(Connection, CARTA.SetImageView,
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
    await Utility.setEvent(Connection, CARTA.SetSpectralRequirements,
        {
            fileId: 0,
            regionId: 0,
            spectralProfiles: [{ coordinate: "z", statsTypes: [CARTA.StatsType.None] }],
        }
    );
    let timer = await performance.now();
    await new Promise(resolve => {
        Utility.getEvent(Connection, CARTA.RasterImageData,
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
/// Send CARTA.SetCursor then get CARTA.SpectralProfileData
export async function
    CursorSpectralProfileData(
        Connection: WebSocket,
        RasterImageData: CARTA.RasterImageData,
        CallbackFunc: (timer: number) => Promise<void> = undefined,
) {
    let SpectralProfileDataTemp: CARTA.SpectralProfileData;
    await Utility.setEvent(Connection, CARTA.SetCursor,
        {
            fileId: 0,
            point: {
                x: Math.floor(Math.random() * RasterImageData.imageBounds.xMax),
                y: Math.floor(Math.random() * RasterImageData.imageBounds.yMax)
            },
        }
    );
    let timer = await performance.now();
    await new Promise(resolve => {
        Utility.getEvent(Connection, CARTA.SpectralProfileData,
            async (SpectralProfileData: CARTA.SpectralProfileData) => {
                expect(SpectralProfileData.profiles.length).not.toEqual(0);
                SpectralProfileDataTemp = SpectralProfileData;
                if (CallbackFunc) {
                    await CallbackFunc(timer);
                }
                resolve();
            }
        );
    });
    return SpectralProfileDataTemp;
}