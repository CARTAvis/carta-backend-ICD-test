import * as child_process from "child_process";

import config from "./config.json";
const fs = require("fs");

let commandPath: string = "/usr/local/bin/pagecache-management.sh";
let backendPath: string = "/home/hengtai/carta-backend/build/carta_backend";
let basePath: string = "/almalustre/carta/images";

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
                `perflog=true`,
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