
async function NullRun(N) {
    return new Promise((resolve, reject) => {
        let x = 0.3;
        let c = 2.0;
        for (let i = 0; i < N; i++) {
            x = 1 - c * x * x;
        }
        resolve(x);
    });
}
let nodeusage = require("usage");
function updateUsage(t, timeout, step, done) {
    setTimeout(() => {
        nodeusage.lookup(
            process.pid,
            (err, info) => {
                console.log(info);
                if (t < timeout) {
                    updateUsage(t + step, timeout, step, done);
                } else {
                    setTimeout(() => {
                        nodeusage.clearHistory(process.pid); //clear history for the given pid
                    }, step);
                    done();
                }
            }
        );
    }, step);
}
async function Usage(pid) {
    return new Promise((resolve, reject) => {
        nodeusage.lookup(
            pid, { keepHistory: true },
            (err, info) => {
                resolve(info);
            }
        );
    });
}
async function Wait(time) {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            resolve();
        }, time);
    });
}
async function CleanHistory(pid, time) {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            nodeusage.clearHistory(pid); //clear history for the given pid
            resolve();
        }, time);
    });
}
describe(`node-usage test`, () => {
    test(`should read CPU usage`,
        async () => {
            await Wait(10);
            await NullRun(100000);
            let info: any = await Usage(process.pid);
            expect(info.cpu).toBeGreaterThan(0);
        });

    test(`should read RAM usage`,
        async () => {
            await Wait(10);
            await NullRun(100000);
            let info: any = await Usage(process.pid);
            expect(info.memory).toBeGreaterThan(0);
        });
    test(`should monitor CPU usage`,
        async () => {
            let data = [];
            const end = 200;
            const step = 20;
            // nodeusage.clearHistory(process.pid);
            for (let t = 0; t < end; t += step) {
                await Wait(step);
                await NullRun(10000*t);
                data.push(await Usage(process.pid));
            }
            let cpuUsage = [], ramUsage = [];
            data.forEach(d => {
                cpuUsage.push(" " + d.cpu + "%");
                ramUsage.push(" " + d.memory / 1024 / 1024 + "MB");
            });
            console.log("CPU node-usage: " + cpuUsage);
            console.log("RAM node-usage: " + ramUsage);
        });
});

const pidusage = require('pidusage');

describe(`pidusage test`, () => {
    test(`should read CPU usage`,
        async () => {
            await Wait(10);
            await NullRun(100000);
            let info: any = await pidusage(process.pid);
            expect(info.cpu).toBeGreaterThan(0);
        });

    test(`should read RAM usage`,
        async () => {
            await Wait(10);
            await NullRun(100000);
            let info: any = await pidusage(process.pid);
            expect(info.memory).toBeGreaterThan(0);
        });
    test(`should monitor CPU usage`,
        async () => {
            let data = [];
            const end = 200;
            const step = 20;
            for (let t = 0; t < end; t += step) {
                await Wait(step);
                await NullRun(10000*t);
                data.push(await pidusage(process.pid, { usePs: false }));
            }
            let cpuUsage = [], ramUsage = [];
            data.forEach(d => {
                cpuUsage.push(" " + d.cpu + "%");
                ramUsage.push(" " + d.memory / 1024 / 1024 + "MB");
            });
            console.log("CPU pidusage: " + cpuUsage);
            console.log("RAM pidusage: " + ramUsage);
        });
});