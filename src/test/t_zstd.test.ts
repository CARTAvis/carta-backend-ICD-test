
const ZstdCodec = require('zstd-codec').ZstdCodec;
const testData: Uint8Array = new Uint8Array([40, 181, 47, 253, 32, 104, 245, 1, 0, 196, 2, 39, 38, 255, 1, 0, 0, 255, 0, 255, 3, 1, 3, 0, 0, 1, 1, 3, 1, 0, 3, 255, 1, 255, 0, 1, 253, 255, 253, 0, 255, 255, 255, 255, 255, 253, 255, 253, 255, 255, 255, 1, 0, 0, 0, 6, 32, 16, 218, 225, 112, 50, 225, 25, 13, 141, 137, 77, 38, 38, 23]);
const rawData: Uint8Array = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 9, 8, 7, 6, 5, 4, 3, 2, 1]);

describe("zstd lib test: ", () => {

    let zstdSimple: any;
    test(`zstd is ready`, done => {
        ZstdCodec.run(zstd => {
            zstdSimple = new zstd.Simple();
            done();
        });
    }, 3000);

    let compressedData: Uint8Array;
    test(`should compress raw data`, done => {
        compressedData = zstdSimple.compress(rawData);
        console.log(compressedData);
        done();
    });

    test(`should decompress the compressed data`, done => {
        let res = zstdSimple.decompress(compressedData);
        console.log(res);
        done();
    });

    test(`should decompress the test data`, done => {
        let res = zstdSimple.decompress(testData);
        console.log(new Float32Array(res.slice().buffer));
        done();
    });
});