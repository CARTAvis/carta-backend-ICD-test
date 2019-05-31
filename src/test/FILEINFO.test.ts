import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let expectBasePath = config.path.base;
let testSubdirectoryName = config.path.QA;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;
interface ImageAssertItem {
    fileName: string;
    hdu: string;
    HDUList: string[];
    fileSize: number;
    fileType: CARTA.FileType;
    shape: number[];
    NAXIS: number;
    computerEntries: CARTA.IHeaderEntry[];
    headerEntries: CARTA.IHeaderEntry[];
}
let imageAssertItems: ImageAssertItem[] = [
    {
        fileName: "M17_SWex.fits", 
        hdu: "0", HDUList: ["0"], 
        fileSize: 51393600, 
        fileType: CARTA.FileType.FITS, 
        shape: [640, 800, 25, 1], NAXIS: 4, 
        computerEntries: [ 
            { name: "Name", value: "M17_SWex.fits" },
            { name: "Shape", value: "[640, 800, 25, 1]" },
            {
                name: "Number of channels",
                value: "25",
                entryType: 2,
                numericValue: 25 },
            {
                name: "Number of Stokes",
                value: "1",
                entryType: 2,
                numericValue: 1 },
            { name: "Coordinate type", value: "RA---SIN, DEC--SIN" },
            { name: "Image reference pixels", value: "[321, 401] " },
            {
                name: "Image reference coordinates",
                value: "[275.0875 deg, -16.2028 deg]" },
            {
                name: "Image ref coords (coord type)",
                value: "[18:20:21.0000, -016.12.10.0000]" },
            { name: "Celestial frame", value: "ICRS" },
            { name: "Spectral frame", value: "LSRK" },
            { name: "Pixel unit", value: "Jy/beam" },
            { name: "Pixel increment", value: "-0.40\", 0.40\"" },
            { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } 
        ],
        headerEntries: [ 
            { name: "NAXIS", value: "4", entryType: 2, numericValue: 4 },
            { name: "NAXIS1", value: "640", entryType: 2, numericValue: 640 },
            { name: "NAXIS2", value: "800", entryType: 2, numericValue: 800 },
            { name: "NAXIS3", value: "25", entryType: 2, numericValue: 25 },
            { name: "NAXIS4", value: "1", entryType: 2, numericValue: 1 },
            { name: "EXTEND" },
            { name: "BSCALE", value: "1", entryType: 1, numericValue: 1 },
            { name: "BZERO", value: "0", entryType: 1 },
            {
                name: "BMAJ",
                value: "0.000572514",
                entryType: 1,
                numericValue: 0.0005725136068132 },
            {
                name: "BMIN",
                value: "0.000414239",
                entryType: 1,
                numericValue: 0.00041423857212070003 },
            {
                name: "BPA",
                value: "-74.6267",
                entryType: 1,
                numericValue: -74.62673187256 },
            { name: "BTYPE", value: "Intensity" },
            { name: "OBJECT", value: "M17SW" },
            { name: "BUNIT", value: "Jy/beam" },
            { name: "RADESYS", value: "ICRS" },
            { name: "LONPOLE", value: "180", entryType: 1, numericValue: 180 },
            {
                name: "LATPOLE",
                value: "-16.2028",
                entryType: 1,
                numericValue: -16.20277777779 },
            { name: "CTYPE1", value: "RA---SIN" },
            {
                name: "CRVAL1",
                value: "275.088",
                entryType: 1,
                numericValue: 275.0875000001 },
            {
                name: "CDELT1",
                value: "-0.000111111",
                entryType: 1,
                numericValue: -0.0001111111111111 },
            { name: "CRPIX1", value: "321", entryType: 1, numericValue: 321 },
            { name: "CUNIT1", value: "deg" },
            { name: "CTYPE2", value: "DEC--SIN" },
            {
                name: "CRVAL2",
                value: "-16.2028",
                entryType: 1,
                numericValue: -16.20277777779 },
            {
                name: "CDELT2",
                value: "0.000111111",
                entryType: 1,
                numericValue: 0.0001111111111111 },
            { name: "CRPIX2", value: "401", entryType: 1, numericValue: 401 },
            { name: "CUNIT2", value: "deg" },
            { name: "CTYPE3", value: "FREQ" },
            {
                name: "CRVAL3",
                value: "8.67514e+10",
                entryType: 1,
                numericValue: 86751396188.4 },
            {
                name: "CDELT3",
                value: "-244238",
                entryType: 1,
                numericValue: -244237.7011414 },
            { name: "CRPIX3", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT3", value: "Hz" },
            { name: "CTYPE4", value: "STOKES" },
            { name: "CRVAL4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CDELT4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CRPIX4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT4" },
            { name: "PV2_1", value: "0", entryType: 1 },
            { name: "PV2_2", value: "0", entryType: 1 },
            {
                name: "RESTFRQ",
                value: "8.67543e+10",
                entryType: 1,
                numericValue: 86754290000 },
            { name: "SPECSYS", value: "LSRK" },
            {
                name: "ALTRVAL",
                value: "10000",
                entryType: 1,
                numericValue: 9999.999914138 },
            { name: "ALTRPIX", value: "1", entryType: 1, numericValue: 1 },
            { name: "VELREF", value: "257", entryType: 2, numericValue: 257 },
            { name: "TELESCOP", value: "ALMA" },
            { name: "OBSERVER", value: "sishii" },
            { name: "DATE-OBS", value: "2016-04-03T13:02:58.800000" },
            { name: "TIMESYS", value: "UTC" },
            {
                name: "OBSRA",
                value: "275.088",
                entryType: 1,
                numericValue: 275.0875000001 },
            {
                name: "OBSDEC",
                value: "-16.2028",
                entryType: 1,
                numericValue: -16.20277777779 },
            {
                name: "OBSGEO-X",
                value: "2.22514e+06",
                entryType: 1,
                numericValue: 2225142.180269 },
            {
                name: "OBSGEO-Y",
                value: "-5.44031e+06",
                entryType: 1,
                numericValue: -5440307.370349 },
            {
                name: "OBSGEO-Z",
                value: "-2.48103e+06",
                entryType: 1,
                numericValue: -2481029.851874 },
            { name: "DATE", value: "2016-09-07T22:08:24.390000" },
            { name: "ORIGIN", value: "CASA 4.5.2-REL (r36115)" } ],  
    },
    {
        fileName: "M17_SWex.image", 
        hdu: "", HDUList: [""], 
        fileSize: 53009869, 
        fileType: CARTA.FileType.CASA, 
        shape: [640, 800, 25, 1], NAXIS: 4, 
        computerEntries: [ 
            { name: "Name", value: "M17_SWex.image" },
            { name: "Shape", value: "[640, 800, 25, 1]" },
            {
                name: "Number of channels",
                value: "25",
                entryType: 2,
                numericValue: 25 },
            {
                name: "Number of Stokes",
                value: "1",
                entryType: 2,
                numericValue: 1 },
            { name: "Coordinate type", value: "RA---SIN, DEC--SIN" },
            { name: "Image reference pixels", value: "[321, 401]" },
            {
                name: "Image reference coordinates",
                value: "[275.088 deg, -16.203 deg]" },
            {
                name: "Image ref coords (coord type)",
                value: "[18:20:21.0000 -016.12.10.0000]" },
            { name: "Celestial frame", value: "ICRS, 2000" },
            { name: "Spectral frame", value: "LSRK" },
            { name: "Pixel unit", value: "Jy/beam" },
            { name: "Pixel increment", value: "-0.40\", 0.40\"" },
            { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } ],
        headerEntries: [ 
            { name: "NAXIS", value: "4", entryType: 2, numericValue: 4 },
            { name: "NAXIS1", value: "640", entryType: 2, numericValue: 640 },
            { name: "NAXIS2", value: "800", entryType: 2, numericValue: 800 },
            { name: "NAXIS3", value: "25", entryType: 2, numericValue: 25 },
            { name: "NAXIS4", value: "1", entryType: 2, numericValue: 1 },
            {
                name: "BMAJ",
                value: "0.000572514",
                entryType: 1,
                numericValue: 0.0005725136068132 },
            {
                name: "BMIN",
                value: "0.000414239",
                entryType: 1,
                numericValue: 0.0004142385721207 },
            {
                name: "BPA",
                value: "-74.6267",
                entryType: 1,
                numericValue: -74.6267318725586 },
            { name: "BTYPE", value: "Intensity" },
            { name: "OBJECT", value: "M17SW" },
            { name: "BUNIT", value: "Jy/beam" },
            { name: "CTYPE1", value: "RA---SIN" },
            {
                name: "CRVAL1",
                value: "275.088",
                entryType: 1,
                numericValue: 275.0875000001 },
            {
                name: "CDELT1",
                value: "-0.000111111",
                entryType: 1,
                numericValue: -0.00011111111111110002 },
            { name: "CRPIX1", value: "321", entryType: 1, numericValue: 321 },
            { name: "CUNIT1", value: "deg" },
            { name: "CTYPE2", value: "DEC--SIN" },
            {
                name: "CRVAL2",
                value: "-16.2028",
                entryType: 1,
                numericValue: -16.20277777779 },
            {
                name: "CDELT2",
                value: "0.000111111",
                entryType: 1,
                numericValue: 0.00011111111111110002 },
            { name: "CRPIX2", value: "401", entryType: 1, numericValue: 401 },
            { name: "CUNIT2", value: "deg" },
            { name: "CTYPE3", value: "Frequency" },
            {
                name: "CRVAL3",
                value: "8.67514e+10",
                entryType: 1,
                numericValue: 86751396188.4 },
            {
                name: "CDELT3",
                value: "-244238",
                entryType: 1,
                numericValue: -244237.7011414 },
            { name: "CRPIX3", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT3", value: "Hz" },
            { name: "CTYPE4", value: "Stokes" },
            { name: "CRVAL4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CDELT4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CRPIX4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT4" },
            {
                name: "RESTFRQ",
                value: "8.67543e+10 Hz\n",
                entryType: 1,
                numericValue: 86754290000 },
            { name: "SPECSYS", value: "LSRK" },
            { name: "RADESYS", value: "ICRS" },
            { name: "EQUINOX", value: "2000" },
            { name: "TELESCOP", value: "ALMA" },
            { name: "OBSERVER", value: "sishii" },
            { name: "DATE", value: "2016/04/03/13:02:59" } 
        ], 
    },
    {
        fileName: "M17_SWex.hdf5", 
        hdu: "0", HDUList: ["0"], 
        fileSize: 112823720, 
        fileType: CARTA.FileType.HDF5, 
        shape: [640, 800, 25, 1], NAXIS: 4, 
        computerEntries: [ 
            { name: "Name", value: "M17_SWex.hdf5" },
            { name: "Shape", value: "[640, 800, 25, 1]" },
            {
                name: "Number of channels",
                value: "25",
                entryType: 2,
                numericValue: 25 },
            {
                name: "Number of Stokes",
                value: "1",
                entryType: 2,
                numericValue: 1 },
            { name: "Coordinate type", value: "RA---SIN, DEC--SIN" },
            {
                name: "Image reference pixels",
                value: "[3.210000000000E+02, 4.010000000000E+02] " },
            {
                name: "Image reference coordinates",
                value: "[275.0875 deg, -16.2028 deg]" },
            {
                name: "Image ref coords (coord type)",
                value: "[18:20:21.0000, -016.12.10.0000]" },
            { name: "Celestial frame", value: "ICRS" },
            { name: "Spectral frame", value: "LSRK" },
            { name: "Pixel unit", value: "Jy/beam" },
            { name: "Pixel increment", value: "-0.40\", 0.40\"" },
            { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } ],
        headerEntries: [ 
            { name: "SCHEMA_VERSION", value: "0.1" },
            { name: "HDF5_CONVERTER", value: "hdf_convert" },
            { name: "HDF5_CONVERTER_VERSION", value: "0.1.2" },
            { name: "SIMPLE", value: "T" },
            { name: "BITPIX", value: "-32" },
            { name: "NAXIS", value: "4" },
            { name: "NAXIS1", value: "640" },
            { name: "NAXIS2", value: "800" },
            { name: "NAXIS3", value: "25" },
            { name: "NAXIS4", value: "1" },
            { name: "EXTEND", value: "T" },
            { name: "BSCALE", value: "1.000000000000E+00" },
            { name: "BZERO", value: "0.000000000000E+00" },
            { name: "BMAJ", value: "5.725136068132E-04" },
            { name: "BMIN", value: "4.142385721207E-04" },
            { name: "BPA", value: "-7.462673187256E+01" },
            { name: "BTYPE", value: "Intensity" },
            { name: "OBJECT", value: "M17SW" },
            { name: "BUNIT", value: "Jy/beam" },
            { name: "RADESYS", value: "ICRS" },
            { name: "LONPOLE", value: "1.800000000000E+02" },
            { name: "LATPOLE", value: "-1.620277777779E+01" },
            { name: "PC01_01", value: "1.000000000000E+00" },
            { name: "PC02_01", value: "0.000000000000E+00" },
            { name: "PC03_01", value: "0.000000000000E+00" },
            { name: "PC04_01", value: "0.000000000000E+00" },
            { name: "PC01_02", value: "0.000000000000E+00" },
            { name: "PC02_02", value: "1.000000000000E+00" },
            { name: "PC03_02", value: "0.000000000000E+00" },
            { name: "PC04_02", value: "0.000000000000E+00" },
            { name: "PC01_03", value: "0.000000000000E+00" },
            { name: "PC02_03", value: "0.000000000000E+00" },
            { name: "PC03_03", value: "1.000000000000E+00" },
            { name: "PC04_03", value: "0.000000000000E+00" },
            { name: "PC01_04", value: "0.000000000000E+00" },
            { name: "PC02_04", value: "0.000000000000E+00" },
            { name: "PC03_04", value: "0.000000000000E+00" },
            { name: "PC04_04", value: "1.000000000000E+00" },
            { name: "CTYPE1", value: "RA---SIN" },
            { name: "CRVAL1", value: "2.750875000001E+02" },
            { name: "CDELT1", value: "-1.111111111111E-04" },
            { name: "CRPIX1", value: "3.210000000000E+02" },
            { name: "CUNIT1", value: "deg" },
            { name: "CTYPE2", value: "DEC--SIN" },
            { name: "CRVAL2", value: "-1.620277777779E+01" },
            { name: "CDELT2", value: "1.111111111111E-04" },
            { name: "CRPIX2", value: "4.010000000000E+02" },
            { name: "CUNIT2", value: "deg" },
            { name: "CTYPE3", value: "FREQ" },
            { name: "CRVAL3", value: "8.675139618840E+10" },
            { name: "CDELT3", value: "-2.442377011414E+05" },
            { name: "CRPIX3", value: "1.000000000000E+00" },
            { name: "CUNIT3", value: "Hz" },
            { name: "CTYPE4", value: "STOKES" },
            { name: "CRVAL4", value: "1.000000000000E+00" },
            { name: "CDELT4", value: "1.000000000000E+00" },
            { name: "CRPIX4", value: "1.000000000000E+00" },
            { name: "CUNIT4" },
            { name: "PV2_1", value: "0.000000000000E+00" },
            { name: "PV2_2", value: "0.000000000000E+00" },
            { name: "RESTFRQ", value: "8.675429000000E+10" },
            { name: "SPECSYS", value: "LSRK" },
            { name: "ALTRVAL", value: "9.999999914138E+03" },
            { name: "ALTRPIX", value: "1.000000000000E+00" },
            { name: "VELREF", value: "257" },
            { name: "TELESCOP", value: "ALMA" },
            { name: "OBSERVER", value: "sishii" },
            { name: "DATE-OBS", value: "2016-04-03T13:02:58.800000" },
            { name: "TIMESYS", value: "UTC" },
            { name: "OBSRA", value: "2.750875000001E+02" },
            { name: "OBSDEC", value: "-1.620277777779E+01" },
            { name: "OBSGEO-X", value: "2.225142180269E+06" },
            { name: "OBSGEO-Y", value: "-5.440307370349E+06" },
            { name: "OBSGEO-Z", value: "-2.481029851874E+06" },
            { name: "DATE", value: "2016-09-07T22:08:24.390000" },
            { name: "ORIGIN", value: "CASA 4.5.2-REL (r36115)" } ], 
    },
    {
        fileName: "M17_SWex.miriad", 
        hdu: "", HDUList: [""], 
        fileSize: 52993642, 
        fileType: CARTA.FileType.MIRIAD, 
        shape: [640, 800, 25, 1], NAXIS: 4, 
        computerEntries: [ 
            { name: "Name", value: "M17_SWex.miriad" },
            { name: "Shape", value: "[640, 800, 25, 1]" },
            {
                name: "Number of channels",
                value: "25",
                entryType: 2,
                numericValue: 25 },
            {
                name: "Number of Stokes",
                value: "1",
                entryType: 2,
                numericValue: 1 },
            { name: "Coordinate type", value: "RA---SIN, DEC--SIN" },
            { name: "Image reference pixels", value: "[321, 401]" },
            {
                name: "Image reference coordinates",
                value: "[275.088 deg, -16.203 deg]" },
            {
                name: "Image ref coords (coord type)",
                value: "[18:20:21.0000 -016.12.10.0000]" },
            { name: "Celestial frame", value: "FK5, J2000" },
            { name: "Spectral frame", value: "BARYCENT" },
            { name: "Pixel unit", value: "Jy/beam" },
            { name: "Pixel increment", value: "-0.40\", 0.40\"" },
            { name: "Restoring beam", value: "2.06\" X 1.49\", -74.6267 deg" } ],
        headerEntries: [ 
            { name: "NAXIS", value: "4", entryType: 2, numericValue: 4 },
            { name: "NAXIS1", value: "640", entryType: 2, numericValue: 640 },
            { name: "NAXIS2", value: "800", entryType: 2, numericValue: 800 },
            { name: "NAXIS3", value: "25", entryType: 2, numericValue: 25 },
            { name: "NAXIS4", value: "1", entryType: 2, numericValue: 1 },
            {
                name: "BMAJ",
                value: "0.000572514",
                entryType: 1,
                numericValue: 0.0005725135932445429 },
            {
                name: "BMIN",
                value: "0.000414239",
                entryType: 1,
                numericValue: 0.00041423858135383447 },
            {
                name: "BPA",
                value: "-74.6267",
                entryType: 1,
                numericValue: -74.6267318725586 },
            { name: "BTYPE", value: "Intensity" },
            { name: "OBJECT" },
            { name: "BUNIT", value: "Jy/beam" },
            { name: "CTYPE1", value: "RA---SIN" },
            {
                name: "CRVAL1",
                value: "275.088",
                entryType: 1,
                numericValue: 275.08750000009996 },
            {
                name: "CDELT1",
                value: "-0.000111111",
                entryType: 1,
                numericValue: -0.00011111111111110002 },
            { name: "CRPIX1", value: "321", entryType: 1, numericValue: 321 },
            { name: "CUNIT1", value: "deg" },
            { name: "CTYPE2", value: "DEC--SIN" },
            {
                name: "CRVAL2",
                value: "-16.2028",
                entryType: 1,
                numericValue: -16.202777777790004 },
            {
                name: "CDELT2",
                value: "0.000111111",
                entryType: 1,
                numericValue: 0.00011111111111110002 },
            { name: "CRPIX2", value: "401", entryType: 1, numericValue: 401 },
            { name: "CUNIT2", value: "deg" },
            { name: "CTYPE3", value: "Frequency" },
            {
                name: "CRVAL3",
                value: "8.67514e+10",
                entryType: 1,
                numericValue: 86751396188.40004 },
            {
                name: "CDELT3",
                value: "-244238",
                entryType: 1,
                numericValue: -244237.7011414 },
            { name: "CRPIX3", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT3", value: "Hz" },
            { name: "CTYPE4", value: "Stokes" },
            { name: "CRVAL4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CDELT4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CRPIX4", value: "1", entryType: 1, numericValue: 1 },
            { name: "CUNIT4" },
            {
                name: "RESTFRQ",
                value: "8.67543e+10 Hz\n",
                entryType: 1,
                numericValue: 86754290000.00003 },
            { name: "SPECSYS", value: "BARYCENT" },
            { name: "RADESYS", value: "FK5" },
            { name: "EQUINOX", value: "J2000" },
            { name: "TELESCOP", value: "ALMA" },
            { name: "OBSERVER", value: "UNKNOWN" },
            { name: "DATE", value: "2016/04/03/13:02:59" } ], 
    },
    {
        fileName: "spire500_ext.fits", 
        hdu: "0", HDUList: ["0", "1", "2", "3", "4", "5", "6", "7"], 
        fileSize: 17591040, 
        fileType: CARTA.FileType.FITS, 
        shape: [830, 870, 1, 1], NAXIS: 2, 
        computerEntries: [ 
            { name: "Name", value: "spire500_ext.fits" },
            { name: "Shape", value: "[830, 870]" },
            { name: "Coordinate type", value: "RA---TAN, DEC--TAN" },
            { name: "Image reference pixels", value: "[861, 976] " },
            {
                name: "Image reference coordinates",
                value: "[107.3046 , -10.6107 ]" },
            {
                name: "Image ref coords (coord type)",
                value: "[107.305 , -10.6107 ]" },
            { name: "Celestial frame", value: "ICRS, 2000" },
            { name: "Pixel increment", value: "-0.002 , 0.002 " } ],
        headerEntries: [ 
            { name: "NAXIS1", value: "830", entryType: 2, numericValue: 830 },
            { name: "NAXIS2", value: "870", entryType: 2, numericValue: 870 },
            { name: "NAXIS", value: "2", entryType: 2, numericValue: 2 },
            { name: "EXTEND" },
            { name: "TIMESYS", value: "UTC" },
            { name: "LONGSTRN", value: "OGIP 1.0" },
            { name: "HCSS____", value: "5", entryType: 2, numericValue: 5 },
            {
                name: "CLASS___",
                value: "herschel.ia.dataset.image.SimpleImage" },
            { name: "INFO____", value: "PLW map" },
            { name: "TYPE", value: "PXMP" },
            { name: "CREATOR", value: "SPG v12.1.0" },
            { name: "DATE", value: "2014-10-01T09:49:31.166000" },
            { name: "DESC", value: "PLW map" },
            { name: "INSTRUME", value: "SPIRE" },
            { name: "MODELNAM", value: "FLIGHT" },
            { name: "DATE-OBS", value: "2011-05-09T14:45:25.000000" },
            { name: "DATE_OBS", value: "2011-05-09T14:45:25.000000" },
            { name: "DATE-END", value: "2011-05-09T20:15:07.000000" },
            { name: "FORMATV", value: "1.0" },
            { name: "FIRSTSAM", value: "0", entryType: 2 },
            {
                name: "LASTSAM",
                value: "6198167",
                entryType: 2,
                numericValue: 6198167 },
            { name: "META_0", value: "2", entryType: 2, numericValue: 2 },
            { name: "CRPIX1", value: "861", entryType: 1, numericValue: 861 },
            { name: "CRPIX2", value: "976", entryType: 1, numericValue: 976 },
            {
                name: "CDELT1",
                value: "-0.00166667",
                entryType: 1,
                numericValue: -0.001666666666667 },
            {
                name: "CDELT2",
                value: "0.00166667",
                entryType: 1,
                numericValue: 0.001666666666667 },
            { name: "CTYPE1", value: "RA---TAN" },
            { name: "CTYPE2", value: "DEC--TAN" },
            {
                name: "EQUINOX",
                value: "2000",
                entryType: 1,
                numericValue: 2000 },
            { name: "CROTA2", value: "0", entryType: 1 },
            {
                name: "CRVAL1",
                value: "107.305",
                entryType: 1,
                numericValue: 107.30461727023817 },
            {
                name: "CRVAL2",
                value: "-10.6107",
                entryType: 1,
                numericValue: -10.610720896516849 },
            {
                name: "META_1",
                value: "1931",
                entryType: 2,
                numericValue: 1931 },
            {
                name: "META_2",
                value: "2020",
                entryType: 2,
                numericValue: 2020 },
            { name: "AOT", value: "Parallel Mode" },
            { name: "AUTHOR", value: "Unknown" },
            { name: "CUSMODE", value: "SpirePacsParallel" },
            {
                name: "DEC",
                value: "-10.6273",
                entryType: 1,
                numericValue: -10.62728522261914 },
            { name: "INSTMODE", value: "PARALLEL" },
            { name: "MISSIONC", value: "MC_H72ASTR_P60ASTR_S61ASTR_AO" },
            { name: "NAIFID", value: "Unknown" },
            { name: "OBJECT", value: "Field 224_0" },
            { name: "OBSERVER", value: "smolinar" },
            { name: "OBS_MODE", value: "Parallel Mode" },
            {
                name: "ODNUMBER",
                value: "725",
                entryType: 2,
                numericValue: 725 },
            { name: "ORIGIN", value: "Herschel Science Centre" },
            { name: "POINTMOD", value: "Line_scan" },
            { name: "PROPOSAL", value: "OT1_smolinar_5" },
            {
                name: "RA",
                value: "107.05",
                entryType: 1,
                numericValue: 107.05025594155902 },
            { name: "RADESYS", value: "ICRS" },
            { name: "TELESCOP", value: "Herschel Space Observatory" },
            { name: "PMRA", value: "0", entryType: 1 },
            { name: "PMDEC", value: "0", entryType: 1 },
            { name: "CALVERS", value: "spire_cal_12_3" },
            { name: "DETECTOR", value: "PLW" },
            { name: "META_3", value: "MJy/sr" },
            { name: "RINVSAMP", value: "0", entryType: 1 },
            { name: "RINVCOOR", value: "0", entryType: 1 },
            {
                name: "NTODSAMP",
                value: "6198168",
                entryType: 2,
                numericValue: 6198168 },
            {
                name: "WAVELNTH",
                value: "500",
                entryType: 1,
                numericValue: 500 },
            { name: "LEVEL", value: "25" },
            { name: "META_4", value: "DX9_map_545_smooth_8arcmin.fits" },
            { name: "META_5", value: "DX9_map_857_smooth_8arcmin.fits" },
            { name: "META_6", value: "3" },
            {
                name: "META_7",
                value: "17.2024",
                entryType: 1,
                numericValue: 17.202426657566612 },
            {
                name: "META_8",
                value: "0.454854",
                entryType: 1,
                numericValue: 0.4548535903699888 },
            { name: "PROCMODE", value: "BULK_REPROCESSING&" },
            { name: "ECALVERS", value: "spire_cal_12_3&" },
            {
                name: "OBSID001",
                value: "1342220650",
                entryType: 2,
                numericValue: 1342220650 },
            {
                name: "OBSID002",
                value: "1342220651",
                entryType: 2,
                numericValue: 1342220651 },
            {
                name: "FILENAME",
                value: "hspireplw725_25pxmp_0708_m1037_1342220650_1342220651" },
            { name: "DSETS___", value: "4", entryType: 2, numericValue: 4 },
            { name: "DS_0", value: "1", entryType: 2, numericValue: 1 },
            { name: "DS_1", value: "2", entryType: 2, numericValue: 2 },
            { name: "DS_2", value: "6", entryType: 2, numericValue: 6 },
            { name: "DS_3", value: "7", entryType: 2, numericValue: 7 } ], 
    },

];

describe("FILEINFO test: Testing if info of an image file is correctly delivered by the backend", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "",
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectoryName}" folder`, 
    () => {
        beforeAll( async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: testSubdirectoryName,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        resolve();
                    }
                );                
            });
        }, listFileTimeout);
        
        imageAssertItems.map( function(item: ImageAssertItem) {

            describe(`query the info of file : ${item.fileName}`, () => {
                let FileInfoResponseTemp: CARTA.FileInfoResponse;
                test(`FILE_INFO_RESPONSE should arrives within ${openFileTimeout} ms".`, async () => {
                    await Utility.setEvent(Connection, CARTA.FileInfoRequest, 
                        {
                            directory: testSubdirectoryName, 
                            file: item.fileName, 
                            hdu: item.hdu,
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.FileInfoResponse, 
                            (FileInfoResponse: CARTA.FileInfoResponse) => {
                                FileInfoResponseTemp = FileInfoResponse;
                                resolve();
                            }
                        );                
                    });                                                 
                }, openFileTimeout);

                test("FILE_INFO_RESPONSE.success = true", () => {
                    expect(FileInfoResponseTemp.success).toBe(true);
                });

                test(`FILE_INFO_RESPONSE.file_info.HDU_List = [${item.HDUList}]`, () => {
                    expect(FileInfoResponseTemp.fileInfo.HDUList).toEqual(item.HDUList);
                });

                test(`FILE_INFO_RESPONSE.file_info.name = "${item.fileName}"`, () => {
                    expect(FileInfoResponseTemp.fileInfo.name).toBe(item.fileName);
                });

                test(`FILE_INFO_RESPONSE.file_info.size = ${item.fileSize}`, () => {
                    expect(FileInfoResponseTemp.fileInfo.size.toString()).toEqual(item.fileSize.toString());
                });

                test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType[item.fileType]}`, () => {
                    expect(FileInfoResponseTemp.fileInfo.type).toBe(item.fileType);
                });

                test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${item.NAXIS}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.dimensions).toEqual(item.NAXIS);
                });

                test(`FILE_INFO_RESPONSE.file_info_extended.width = ${item.shape[0]}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.width).toEqual(item.shape[0]);
                });

                test(`FILE_INFO_RESPONSE.file_info_extended.height = ${item.shape[1]}`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.height).toEqual(item.shape[1]);
                });

                if (item.NAXIS > 2) {
                    test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${item.shape[2]}`, () => {
                        expect(FileInfoResponseTemp.fileInfoExtended.depth).toEqual(item.shape[2]);
                    });
                }

                if (item.NAXIS > 3) {
                    test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${item.shape[3]}`, () => {
                        expect(FileInfoResponseTemp.fileInfoExtended.stokes).toEqual(item.shape[3]);
                    });
                }

                test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = [""]`, () => {
                    expect(FileInfoResponseTemp.fileInfoExtended.stokesVals).toEqual([""]);
                });

                test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                    // console.log(FileInfoResponseTemp.fileInfoExtended.computedEntries);
                    expect(FileInfoResponseTemp.fileInfoExtended.computedEntries).toEqual(item.computerEntries);
                });
                
                test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                    // console.log(FileInfoResponseTemp.fileInfoExtended.headerEntries);
                    expect(FileInfoResponseTemp.fileInfoExtended.headerEntries).toEqual(item.headerEntries);
                });

            }); // describe
        }); // map

    });

    afterAll( () => {
        Connection.close();
    });
});

describe("FILEINFO_EXCEPTIONS test: Testing error handle of file info generation", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        Connection.onopen = OnOpen;
        async function OnOpen (this: WebSocket, ev: Event) {
            await Utility.setEvent(this, CARTA.RegisterViewer, 
                {
                    sessionId: 0, 
                    apiKey: "",
                }
            );
            await new Promise( resolve => { 
                Utility.getEvent(this, CARTA.RegisterViewerAck, 
                    RegisterViewerAck => {
                        expect(RegisterViewerAck.success).toBe(true);
                        resolve();           
                    }
                );
            });
            done();
        }
    }, connectTimeout);

    describe(`Go to "${testSubdirectoryName}" folder`, 
    () => {
        beforeAll( async () => {
            await Utility.setEvent(Connection, CARTA.FileListRequest, 
                {
                    directory: testSubdirectoryName,
                }
            );
            await new Promise( resolve => {
                Utility.getEvent(Connection, CARTA.FileListResponse, 
                    FileListResponseBase => {
                        expect(FileListResponseBase.success).toBe(true);
                        resolve();
                    }
                );                
            });
        }, listFileTimeout);
        
        [
            ["no_such_file.image"],
            ["broken_header.miriad"],
        ].map( function([fileName]: [string]) {

            describe(`query the info of file : ${fileName}`, () => {
                let FileInfoResponseTemp: CARTA.FileInfoResponse;
                test(`FILE_INFO_RESPONSE should arrives within ${openFileTimeout} ms".`, async () => {
                    await Utility.setEvent(Connection, CARTA.FileInfoRequest, 
                        {
                            directory: testSubdirectoryName, 
                            file: fileName, 
                            hdu: "",
                        }
                    );
                    await new Promise( resolve => {
                        Utility.getEvent(Connection, CARTA.FileInfoResponse, 
                            (FileInfoResponse: CARTA.FileInfoResponse) => {
                                FileInfoResponseTemp = FileInfoResponse;
                                resolve();
                            }
                        );                
                    });                                                 
                }, openFileTimeout);

                test("FILE_INFO_RESPONSE.success = false", () => {
                    expect(FileInfoResponseTemp.success).toBe(false);
                });

                test("FILE_INFO_RESPONSE.message is not None", () => {
                    expect(FileInfoResponseTemp.message).toBeDefined();
                    expect(FileInfoResponseTemp.message).not.toBe("");
                    console.log(`Error message from reading "${fileName}": ${FileInfoResponseTemp.message}`);
                });
            }); // describe

        }); // map
    });

    afterAll( () => {
        Connection.close();
    });
});
