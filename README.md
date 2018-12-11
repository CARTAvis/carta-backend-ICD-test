# CARTA Backend ICD test

## Prerequisites
The build process relies heavily on `npm` and `nodejs`, so make sure they are installed and accesible. The protocol buffer definitions reside in a git submodule that must be initialised as follows:
```
cd protobuf
git submodule init
git submodule update
git checkout master
```
Prerequisite `npm` packages can be installed using `npm install`.
## Build process:
* **Building static protocol buffer code** is done using the `build_proto.sh` script in the `protobuf` folder, which builds the static JavaScript code, as well as the TypeScript definitions, and symlinks to the `node_modules/carta-protobuf` directory.


Running test by `npm test`.
