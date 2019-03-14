# CARTA Backend ICD test
A couple of integration tests run by the protobuff interface of ICD to verify the functionality on backend.

## Prerequisites
The build process relies heavily on `npm` and `nodejs`, so make sure they are installed and accesible. The protocol buffer definitions reside in a git submodule that must be initialised as follows:
```
cd protobuf
git submodule init
git submodule update
git checkout master
```
Prerequisite `npm` packages can be installed using `$ npm install`.

## Build process
* **Building static protocol buffer code** is done using the `$ build_proto.sh` script in the `protobuf` folder, which builds the static JavaScript code, as well as the TypeScript definitions, and symlinks to the `node_modules/carta-protobuf` directory.

## Run it
### Test one at a time
To avoid side effect, likely concurrent issue or IO traffic, it is better to run one test at one time. There is always a simple test from the beginning of the connection to backend, the address of which can be modified at `/test/config.json`.
* A first test could be run by `$ npm test src/test/ACCESS_CARTA_DEFAULT.test.ts`. As if it was failed, we might check up the parameters at `config.json` to fit the environment.
* The test `$ npm test src/test/FILEINFO.test.ts` can help us verify the supported file formats. In case this test is failed, we may increase the timeout limitation, likely `timeout.readfile` or `timeout.openfile` at `config.json`.

### Test a kind
One can execute some similar tests once, such as 
* `$ npm test -p ACCESS` to start a serial of access tests.
* `$ npm test -p ImageOpen_CPU` to run them concurrently.

### Test them all
We do not recomment to do it because the Jest has no guarantee of process in order. The current release of backend still has some issues while running all tests concurrently.
* It is easy to run all test by `$ npm test`.

## Log message
It is fine to only log a test by `$ npm test src/test/ACCESS_CARTA_DEFAULT.test.ts >> message.txt` as well. Log message is a supplement of testing process, for example `registered session ID is 51551146021 @Tue Feb 26 2019 09:53:41 GMT+0800 (Taipei Standard Time)` tells about the current running ID.
