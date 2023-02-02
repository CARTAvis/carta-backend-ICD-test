# CARTA Backend ICD test
```diff
- This repository will be replaced by CARTAvis/ICD-RxJS (2023 Feb 02).
```

**This repository will only maintain the protobuf instead of ICD tests**

The CARTA ICD tests please visit [ICD-RxJS](https://github.com/CARTAvis/ICD-RxJS.git)

A couple of integration tests run by the protobuff interface and websocket offer a white-box testing on CARTA backend.

## Prerequisites
The build process relies heavily on `npm` and `nodejs`, so make sure they are installed and accesible. The protocol buffer definitions reside in a git submodule that must be initialised as follows:
```
cd protobuf
git submodule init
git submodule update
git checkout master  [git pull origin <the other branch or SHA>]
```
Prerequisite `npm` packages can be installed using `$ npm install`.

## Build process
* **Building static protocol buffer code** is done using the `$ build_proto.sh` script in the `protobuf` folder, which builds the static JavaScript code, as well as the TypeScript definitions, and symlinks to the `node_modules/carta-protobuf` directory.

## Run it
* For the local computer test, set
`"serverURL": "ws://127.0.0.1:3002"` 
in the `src/test/config.json`, where `3002` is the port number from the backend setting in this example.
* For the server test, set
`"serverURL": "wss://carta.asiaa.sinica.edu.tw/socketdev"` 
in the `src/test/config.json`.
### Test one at a time
To avoid side effect, likely concurrent issue or IO traffic, it is better to run one test at one time. There is always a simple test from the beginning of the connection to backend, the address of which can be modified at `src/test/config.json`.
* A first test could run by 
`$ npm test src/test/ACCESS_WEBSOCKET.test.ts` or 
`$ npm test src/test/ACCESS_CARTA_DEFAULT.test.ts`. 
As if it was failed, we might check up the parameters at `config.json` to fit the environment.
* The test `$ npm test src/test/FILEINFO.test.ts` can help us verify the supported file formats. In case this test is failed, we may increase the timeout limitation, likely `timeout.readfile` or `timeout.openfile` at `config.json`.

### Test a kind
One can execute some similar tests once, such as 
* `$ npm test -p ACCESS` to start a serial of access tests.
* `$ npm test -p REGION` to run them all about REGION testing.

### Test them all
We do not recomment to do it because the Jest has no guarantee of process in order. The current release of backend still has some issues while running all tests concurrently.
* It is easy to run all tests by `$ npm test`.
* `$ npm test src/test` to run the tests inside folder concurrently.

## Log message
If the backend responds unexpectedly or crashes, `Event Type` messages can be logged by setting `log.event` to `True` in the `src/test/config.json` configuration file. This may help debugging. 

## Image download
To download the images for the test, please visit:
[https://carta.asiaa.sinica.edu.tw/images/](https://carta.asiaa.sinica.edu.tw/images/)
The webpage list all the needed images for each stage of the ICD test. All the images for each stage are packed into **.tgz** file and can be downloaded by simply clicking on the **Download all files** hyper link. You can also download these files through wget command by clicking on the **wget** button to copy the command and then paste it to your terminal for download.
