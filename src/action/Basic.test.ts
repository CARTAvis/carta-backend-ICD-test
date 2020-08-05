
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
                        nodeusage.clearHistory(process.pid); //clean history for all pids
                    }, step);
                    done();
                }
            }
        );
    }, step);
}
describe(`node-usage test`, () => {
    test(`should read CPU usage`,
        done => {
            nodeusage.lookup(
                process.pid,
                (err, info) => {
                    expect(info.cpu).toBeGreaterThan(0);
                    updateUsage(0, 400, 100, done);
                }
            );
        });

    test(`should read RAM usage`,
        done => {
            nodeusage.lookup(
                process.pid,
                (err, info) => {
                    expect(info.memory).toBeGreaterThan(0);
                    done();
                }
            );
        });
});
