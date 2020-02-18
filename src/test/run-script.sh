#!/bin/bash

#References:
#https://github.com/facebook/jest/issues/6259
#https://github.com/facebook/create-react-app/issues/784

# npm test test-get-filelist.test.ts

now="$(date +'%Ss%Mm%Hh-%d-%m-%Y')"
# echo $now
# npm test test-get-filelist-local.test.ts --no-color 2>output-$now.txt

## To make sure wakeUp
npm test GET_FILELIST.test.ts -- --watchAll=false --no-color 2>temp-$now.txt
ExtractLine=$(grep "Tests:" temp-$now.txt)
while [[ $ExtractLine == *"failed"* ]]
do 
rm -rf temp-$now.txt
npm test GET_FILELIST.test.ts -- --watchAll=false --no-color 2>temp-$now.txt
ExtractLine=$(grep "Tests:" temp-$now.txt)
echo $ExtractLine
done
## END: To make sure WakeUp

# npm test test-get-filelist.test.ts -- --watchAll=false --no-color 2>output0-$now.txt

## For real run jest-test 
npm test PERF_LOAD_IMAGE.test.ts -- --watchAll=false --no-color 2>output-PERF_LOAD_IMAGE-$now.txt
npm test PERF_RASTER_TILE_DATA.test.ts -- --watchAll=false --no-color 2>output-PERF_RASTER_TILE_DATA-$now.txt
npm test PERF_CONTOUR_DATA.test.ts -- --watchAll=false --no-color 2>output-PERF_CONTOUR_DATA-$now.txt
npm test PERF_CUBE_HISTOGRAM.test.ts -- --watchAll=false --no-color 2>output-PERF_CUBE_HISTOGRAM-$now.txt
npm test PERF_REGION_SPECTRAL_PROFILE.test.ts -- --watchAll=false --no-color 2>output-PERF_REGION_SPECTRAL_PROFILE-$now.txt
npm test PERF_ANIMATION_PLAYBACK.test.ts -- --watchAll=false --no-color 2>output-PERF_ANIMATION_PLAYBACK-$now.txt
## END For real run jest-test 


exit