import * as child_process from "child_process";

import { CARTA } from "carta-protobuf";

import * as Utility from "../UtilityFunction";

import config from "./config.json";
// const procfs = require("procfs-stats");
const nodeusage = require("usage");
const fs = require("fs");

let commandPath: string = "/usr/local/bin/pagecache-management.sh";
let backendPath: string = "/home/hengtai/carta-backend/build/carta_backend";
let basePath: string = "/almalustre/carta/images";
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
        logFile: string,
        port: number = config.port,
        threadNumber: number = config.thread.main,
        ompThreadNumber: number = config.thread.openmp,
        timeout?: number,
) {
    return new Promise(resolve => {
        let cartaBackend = child_process.execFile(
            commandPath,
            [
                backendPath,
                `root=base`,
                `base=${basePath}`,
                `port=${port}`,
                `threads=${threadNumber}`,
                `omp_threads=${ompThreadNumber}`,
                `verbose=true`,
            ],
            {
                timeout,
                maxBuffer: 128 * 1024 * 1024,
            },
        );
        // cartaBackend.unref(); 
        cartaBackend.on("error", error => {
            if (config.log.error) {
                console.log("Error: " + error);
            }
        });
        cartaBackend.stdout.on("data", data => {
            if (config.log.verbose) {
                console.log(data.toString());
            }
            fs.appendFile(logFile, data, err => {
                if (err) {
                    console.log("Write log file error: " + err);
                }
            });
        });
        resolve(cartaBackend);
    });
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