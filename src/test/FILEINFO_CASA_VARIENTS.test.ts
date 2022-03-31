import { CARTA } from "carta-protobuf";

import { Client } from "./CLIENT";
import config from "./config.json";

let testServerUrl = config.serverURL;
let testSubdirectory = config.path.casa_varients;
let connectTimeout = config.timeout.connection;
let listFileTimeout = config.timeout.listFile;
let openFileTimeout = config.timeout.openFile;

interface AssertItem {
    registerViewer: CARTA.IRegisterViewer;
    fileInfoRequest: CARTA.IFileInfoRequest[];
    precisionDigit?: number;
    fileInfoResponse: CARTA.IFileInfoResponse[];
};

let assertItem: AssertItem = {
    registerViewer: {
        sessionId: 0,
        clientFeatureFlags: 5,
    },
    precisionDigit: 4,
    fileInfoRequest: [
        {
            file: "componentlist.image",
            hdu: "",
        },
        {
            file: "concatenated.image",
            hdu: "",
        },
        {
            file: "pVimage.image",
            hdu: "",
        },
        {
            file: "UVamp.image",
            hdu: "",
        },
        {
            file: "UVphase.image",
            hdu: "",
        },
    ],
    fileInfoResponse: 
    [
        {success: true,
        message: "",
        fileInfo: {
            name: "componentlist.image",
            type: CARTA.FileType.CASA,
            size: 1880126,
            HDUList: [""],
        },
        fileInfoExtended: 
            {
            '': {
                dimensions: 4,
                width: 512,
                height: 512,
                depth: 1,
                stokes: 1,
                stokesVals: [],
                computedEntries: [
                    { name: 'Name', value: 'componentlist.image' },
                    { name: 'Shape', value: '[512, 512, 1, 1]' },
                    {
                      name: 'Number of channels',
                      value: '1',
                      entryType: 2,
                      numericValue: 1
                    },
                    {
                      name: 'Number of polarizations',
                      value: '1',
                      entryType: 2,
                      numericValue: 1
                    },
                    { name: 'Coordinate type', value: 'Right Ascension, Declination' },
                    { name: 'Projection', value: 'SIN' },
                    { name: 'Image reference pixels', value: '[256, 257]' },
                    {
                      name: 'Image reference coords',
                      value: '[01:37:41.2994, +033.09.35.1330]'
                    },
                    {
                      name: 'Image ref coords (deg)',
                      value: '[24.4221 deg, 33.1598 deg]'
                    },
                    { name: 'Pixel increment', value: '-1", 1"' },
                    { name: 'Celestial frame', value: 'FK5, J2000' },
                    { name: 'Spectral frame', value: 'TOPO' },
                    { name: 'Velocity definition', value: 'RADIO' },
                    { name: 'Pixel unit', value: 'Jy/beam' },
                    {
                      name: 'Restoring beam',
                      value: '5.24988" X 5.24988", 0 deg'
                    }
                ],
                headerEntries: [
                    {
                        name: 'XTENSION',
                        value: 'IMAGE',
                        comment: 'IMAGE extension'
                    },
                    {
                        name: 'BITPIX',
                        value: '-32',
                        entryType: 2,
                        numericValue: -32,
                        comment: 'Floating point (32 bit)'
                    },
                    { name: 'NAXIS', value: '4', entryType: 2, numericValue: 4 },
                    { name: 'NAXIS1', value: '512', entryType: 2, numericValue: 512 },
                    { name: 'NAXIS2', value: '512', entryType: 2, numericValue: 512 },
                    { name: 'NAXIS3', value: '1', entryType: 2, numericValue: 1 },
                    { name: 'NAXIS4', value: '1', entryType: 2, numericValue: 1 },
                    { name: 'PCOUNT', value: '0', entryType: 2 },
                    {
                        name: 'GCOUNT',
                        value: '1',
                        entryType: 2,
                        numericValue: 1
                    },                
                    {
                        name: 'BSCALE',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1,
                        comment: 'PHYSICAL = PIXEL*BSCALE + BZERO'
                    },
                    { name: 'BZERO', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'BMAJ',
                        value: '1.458300000000E-03',
                        entryType: 1,
                        numericValue: 0.0014583
                    },
                    {
                        name: 'BMIN',
                        value: '1.458300000000E-03',
                        entryType: 1,
                        numericValue: 0.0014583
                    },
                    {
                        name: 'BPA',
                        value: '0.000000000000E+00',
                        entryType: 1,
                    },
                    { name: 'BTYPE', value: 'Intensity' },
                    { name: 'OBJECT', value: 'J0137+33' },
                    {
                        name: 'BUNIT',
                        value: 'Jy/beam',
                        comment: 'Brightness (pixel) unit'
                    },
                    {
                        name: 'EQUINOX',
                        value: '2000',
                        entryType: 1,
                        numericValue: 2000
                    },
                    { name: 'RADESYS', value: 'FK5' },
                    {
                        name: 'LONPOLE',
                        value: '1.800000000000E+02',
                        entryType: 1,
                        numericValue: 180
                    },
                    {
                        name: 'LATPOLE',
                        value: '3.315975916510E+01',
                        entryType: 1,
                        numericValue: 33.1597591651
                    },
                    {
                        name: 'PC1_1',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC2_1', value: '-0.000000000000E+00', entryType: 1 },
                    { name: 'PC3_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC4_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_2', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC2_2',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC3_2', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC4_2', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_3', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC2_3', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC3_3',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC4_3', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_4', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC2_4', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC3_4', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC4_4',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CTYPE1', value: 'RA---SIN' },
                    {
                        name: 'CRVAL1',
                        value: '2.442208096340E+01',
                        entryType: 1,
                        numericValue: 24.4220809634
                    },
                    {
                        name: 'CDELT1',
                        value: '-2.777777845000E-04',
                        entryType: 1,
                        numericValue: -0.0002777777845
                    },
                    {
                        name: 'CRPIX1',
                        value: '256',
                        entryType: 1,
                        numericValue: 256
                    },
                    { name: 'CUNIT1', value: 'deg' },
                    { name: 'CTYPE2', value: 'DEC--SIN' },
                    {
                        name: 'CRVAL2',
                        value: '3.315975916510E+01',
                        entryType: 1,
                        numericValue: 33.1597591651
                    },
                    {
                        name: 'CDELT2',
                        value: '2.777777845000E-04',
                        entryType: 1,
                        numericValue: 0.0002777777845
                    },
                    {
                        name: 'CRPIX2',
                        value: '257',
                        entryType: 1,
                        numericValue: 257
                    },
                    { name: 'CUNIT2', value: 'deg' },
                    { name: 'CTYPE3', value: 'FREQ' },
                    {
                        name: 'CRVAL3',
                        value: '3.275580393930E+08',
                        entryType: 1,
                        numericValue: 327558039.393
                    },
                    {
                        name: 'CDELT3',
                        value: '1.175000000000E+07',
                        entryType: 1,
                        numericValue: 11750000
                    },
                    { name: 'CRPIX3', value: '1.0', entryType: 1, numericValue: 1 },
                    { name: 'CUNIT3', value: 'Hz' },
                    { name: 'CTYPE4', value: 'STOKES' },
                    {
                        name: 'CRVAL4',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    {
                        name: 'CDELT4',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CRPIX4', value: '1.0', entryType: 1, numericValue: 1 },
                    { name: 'CUNIT4' },
                    { name: 'PV2_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PV2_2', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'TELESCOP', value: 'EVLA' },
                    { name: 'OBSERVER', value: 'Richard' },
                    {
                        name: 'DATE-OBS',
                        value: '2014-02-16T00:00:00.000000'
                    },
                    { name: 'TIMESYS', value: 'UTC' },
                    {
                        name: 'OBSRA',
                        value: '2.442208096340E+01',
                        entryType: 1,
                        numericValue: 24.422080963399996
                    },
                    {
                        name: 'OBSDEC',
                        value: '3.315975916510E+01',
                        entryType: 1,
                        numericValue: 33.1597591651
                    },
                    {
                        name: 'OBSGEO-X',
                        value: '-1.601156673287E+06',
                        entryType: 1,
                        numericValue: -1601156.673287362
                    },
                    {
                        name: 'OBSGEO-Y',
                        value: '-5.041988986066E+06',
                        entryType: 1,
                        numericValue: -5041988.986065895
                    },
                    {
                        name: 'OBSGEO-Z',
                        value: '3.554879236821E+06',
                        entryType: 1,
                        numericValue: 3554879.2368205097
                    },
                    { name: 'INSTRUME', value: 'EVLA' },
                    {
                        name: 'ALTRPIX',
                        value: '1',
                        entryType: 1,
                        numericValue: 1
                    }
                ],
                }
            }
        },
        {success: true,
        message: "",
        fileInfo: {
            name: "concatenated.image",
            type: CARTA.FileType.CASA,
            size: 1134908779,
            HDUList: [""],
        },
        fileInfoExtended: 
            {
            '': {
                dimensions: 4,
                width: 378,
                height: 378,
                depth: 1918,
                stokes: 1,
                stokesVals: [],
                computedEntries: [
                    { name: 'Name', value: 'concatenated.image' },
                    { name: 'Shape', value: '[378, 378, 1, 1918]' },
                    {
                      name: 'Number of channels',
                      value: '1918',
                      entryType: 2,
                      numericValue: 1918
                    },
                    {
                      name: 'Number of polarizations',
                      value: '1',
                      entryType: 2,
                      numericValue: 1
                    },
                    { name: 'Coordinate type', value: 'Right Ascension, Declination' },
                    { name: 'Projection', value: 'SIN' },
                    { name: 'Image reference pixels', value: '[190, 190]' },
                    {
                      name: 'Image reference coords',
                      value: '[17:20:53.4486, -035.46.57.8004]'
                    },
                    {
                      name: 'Image ref coords (deg)',
                      value: '[260.223 deg, -35.7827 deg]'
                    },
                    { name: 'Pixel increment', value: '-0.03", 0.03"' },
                    { name: 'Celestial frame', value: 'ICRS' },
                    { name: 'Spectral frame', value: 'LSRK' },
                    { name: 'Velocity definition', value: 'RADIO' },
                ],
                headerEntries: [
                    {
                        name: 'XTENSION',
                        value: 'IMAGE',
                        comment: 'IMAGE extension'
                    },
                    {
                        name: 'BITPIX',
                        value: '-32',
                        entryType: 2,
                        numericValue: -32,
                        comment: 'Floating point (32 bit)'
                    },
                    { name: 'NAXIS', value: '4', entryType: 2, numericValue: 4 },
                    { name: 'NAXIS1', value: '378', entryType: 2, numericValue: 378 },
                    { name: 'NAXIS2', value: '378', entryType: 2, numericValue: 378 },
                    { name: 'NAXIS3', value: '1', entryType: 2, numericValue: 1 },
                    { name: 'NAXIS4', value: '1918', entryType: 2, numericValue: 1918 },
                    { name: 'PCOUNT', value: '0', entryType: 2 },
                    {
                        name: 'GCOUNT',
                        value: '1',
                        entryType: 2,
                        numericValue: 1
                    },                
                    {
                        name: 'BSCALE',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1,
                        comment: 'PHYSICAL = PIXEL*BSCALE + BZERO'
                    },
                    { name: 'BZERO', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'BTYPE', value: 'Intensity' },
                    { name: 'OBJECT', value: 'NGC6334I' },
                    { name: 'BUNIT', comment: 'Brightness (pixel) unit' },
                    { name: 'RADESYS', value: 'ICRS' },
                    {
                        name: 'LONPOLE',
                        value: '1.800000000000E+02',
                        entryType: 1,
                        numericValue: 180
                    },
                    {
                        name: 'LATPOLE',
                        value: '-3.578272233084E+01',
                        entryType: 1,
                        numericValue: -35.78272233083669
                    },
                    {
                        name: 'PC1_1',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC2_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC3_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC4_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_2', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC2_2',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC3_2', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC4_2', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_3', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC2_3', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC3_3',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC4_3', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_4', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC2_4', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC3_4', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC4_4',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CTYPE1', value: 'RA---SIN' },
                    {
                        name: 'CRVAL1',
                        value: '2.602227026683E+02',
                        entryType: 1,
                        numericValue: 260.22270266829605
                    },
                    {
                        name: 'CDELT1',
                        value: '-8.333333314262E-06',
                        entryType: 1,
                        numericValue: -0.000008333333314261814
                    },
                    {
                        name: 'CRPIX1',
                        value: '190',
                        entryType: 1,
                        numericValue: 190
                    },
                    { name: 'CUNIT1', value: 'deg' },
                    { name: 'CTYPE2', value: 'DEC--SIN' },
                    {
                        name: 'CRVAL2',
                        value: '-3.578272233084E+01',
                        entryType: 1,
                        numericValue: -35.78272233083669
                    },
                    {
                        name: 'CDELT2',
                        value: '8.333333314262E-06',
                        entryType: 1,
                        numericValue: 0.000008333333314261814
                    },
                    {
                        name: 'CRPIX2',
                        value: '190',
                        entryType: 1,
                        numericValue: 190
                    },
                    { name: 'CUNIT2', value: 'deg' },
                    { name: 'CTYPE3', value: 'STOKES' },
                    {
                        name: 'CRVAL3',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    {
                        name: 'CDELT3',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CRPIX3', value: '1.0', entryType: 1, numericValue: 1 },
                    { name: 'CUNIT3' },
                    { name: 'CTYPE4', value: 'FREQ' },
                    {
                        name: 'CRVAL4',
                        value: '8.958311339630E+11',
                        entryType: 1,
                        numericValue: 895831133963
                    },
                    {
                        name: 'CDELT4',
                        value: '9.766515507812E+05',
                        entryType: 1,
                        numericValue: 976651.55078125
                    },
                    { name: 'CRPIX4', value: '1.0', entryType: 1, numericValue: 1 },
                    { name: 'CUNIT4', value: 'Hz' },
                    { name: 'PV2_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PV2_2', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'RESTFRQ',
                        value: '8.967400000000E+11',
                        entryType: 1,
                        numericValue: 896740000000,
                        comment: 'Rest Frequency (Hz)'
                    },
                    {
                        name: 'SPECSYS',
                        value: 'LSRK',
                        comment: 'Spectral reference frame'
                    },
                    {
                        name: 'ALTRVAL',
                        value: '3.038463581695E+05',
                        entryType: 1,
                        numericValue: 303846.35816953244,
                        comment: 'Alternate frequency reference value'
                    },
                    {
                        name: 'ALTRPIX',
                        value: '1',
                        entryType: 1,
                        numericValue: 1,
                        comment: 'Alternate frequency reference pixel'
                    },
                    {
                        name: 'VELREF',
                        value: '257',
                        entryType: 2,
                        numericValue: 257,
                        comment: '1 LSR, 2 HEL, 3 OBS, +256 Radio'
                    },
                    { name: 'TELESCOP', value: 'ALMA' },
                    { name: 'OBSERVER', value: 'bmcguire' },
                    {
                        name: 'DATE-OBS',
                        value: '2018-04-05T09:28:43.872000'
                    },
                    { name: 'TIMESYS', value: 'UTC' },
                    {
                        name: 'OBSRA',
                        value: '2.602227025067E+02',
                        entryType: 1,
                        numericValue: 260.2227025066983
                    },
                    {
                        name: 'OBSDEC',
                        value: '-3.578272233084E+01',
                        entryType: 1,
                        numericValue: -35.782722330836705
                    },
                    {
                        name: 'OBSGEO-X',
                        value: '2.225142180269E+06',
                        entryType: 1,
                        numericValue: 2225142.180268967
                    },
                    {
                        name: 'OBSGEO-Y',
                        value: '-5.440307370349E+06',
                        entryType: 1,
                        numericValue: -5440307.370348562
                    },
                    {
                        name: 'OBSGEO-Z',
                        value: '-2.481029851874E+06',
                        entryType: 1,
                        numericValue: -2481029.851873547
                    },
                    { name: 'INSTRUME', value: 'ALMA' },
                    {
                        name: 'DISTANCE',
                        value: '0.000000000000E+00',
                        entryType: 1
                      }
                ],
                }
            }
        },
        {success: true,
            message: "",
            fileInfo: {
                name: "pVimage.image",
                type: CARTA.FileType.CASA,
                size: 110455,
                HDUList: [""],
            },
            fileInfoExtended: 
                {
                '': {
                    dimensions: 3,
                    width: 160,
                    height: 52,
                    depth: 1,
                    stokes: 1,
                    stokesVals: [],
                    computedEntries: [
                        { name: 'Name', value: 'pVimage.image' },
                        { name: 'Shape', value: '[160, 1, 52]' },
                        {
                          name: 'Number of channels',
                          value: '52',
                          entryType: 2,
                          numericValue: 52
                        },
                        {
                          name: 'Number of polarizations',
                          value: '1',
                          entryType: 2,
                          numericValue: 1
                        },
                        { name: 'Coordinate type', value: 'Offset, Frequency' },
                        { name: 'Image reference pixels', value: '[80, 1]' },
                        {
                          name: 'Image reference coords',
                          value: '[0 arcsec, 3.63924e+10 Hz]'
                        },
                        {
                          name: 'Image ref coords (deg)',
                          value: '[0 deg, 3.63924e+10 Hz]'
                        },
                        { name: 'Pixel increment', value: '0.4", 125015 Hz' },
                        { name: 'Spectral frame', value: 'LSRK' },
                        { name: 'Velocity definition', value: 'RADIO' },
                        { name: 'Pixel unit', value: 'Jy/beam' },
                        {
                            name: 'Median area beam',
                            value: '2.92337" X 1.76931", -17.8188 deg'
                        }
                    ],
                    headerEntries: [
                        {
                            name: 'XTENSION',
                            value: 'IMAGE',
                            comment: 'IMAGE extension'
                        },
                        {
                            name: 'BITPIX',
                            value: '-32',
                            entryType: 2,
                            numericValue: -32,
                            comment: 'Floating point (32 bit)'
                        },
                        { name: 'NAXIS', value: '3', entryType: 2, numericValue: 3 },
                        { name: 'NAXIS1', value: '160', entryType: 2, numericValue: 160 },
                        { name: 'NAXIS2', value: '1', entryType: 2, numericValue: 1 },
                        { name: 'NAXIS3', value: '52', entryType: 2, numericValue: 52 },
                        { name: 'PCOUNT', value: '0', entryType: 2 },
                        {
                            name: 'GCOUNT',
                            value: '1',
                            entryType: 2,
                            numericValue: 1
                        },                
                        {
                            name: 'BSCALE',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1,
                            comment: 'PHYSICAL = PIXEL*BSCALE + BZERO'
                        },
                        { name: 'BZERO', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'BTYPE', value: 'Intensity' },
                        { name: 'OBJECT', value: 'IRC+10216' },
                        {
                            name: 'BUNIT',
                            value: 'Jy/beam',
                            comment: 'Brightness (pixel) unit'
                        },
                        {
                            name: 'PC1_1',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1
                        },
                        { name: 'PC2_1', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'PC3_1', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'PC1_2', value: '0.000000000000E+00', entryType: 1 },
                        {
                            name: 'PC2_2',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1
                        },
                        { name: 'PC3_2', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'PC1_3', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'PC2_3', value: '0.000000000000E+00', entryType: 1 },
                        {
                            name: 'PC3_3',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1
                        },
                        { name: 'CTYPE1', value: 'OFFSET' },
                        {
                            name: 'CRVAL1',
                            value: '0.000000000000E+00',
                            entryType: 1,
                        },
                        {
                            name: 'CDELT1',
                            value: '4.000000016060E-01',
                            entryType: 1,
                            numericValue: 0.40000000160599447
                        },
                        {
                            name: 'CRPIX1',
                            value: '80',
                            entryType: 1,
                            numericValue: 80
                        },
                        { name: 'CUNIT1', value: 'arcsec' },
                        { name: 'CTYPE2', value: 'STOKES' },
                        {
                            name: 'CRVAL2',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1
                        },
                        {
                            name: 'CDELT2',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1
                        },
                        {
                            name: 'CRPIX2',
                            value: '1',
                            entryType: 1,
                            numericValue: 1
                        },
                        { name: 'CUNIT2' },
                        { name: 'CTYPE3', value: 'FREQ' },
                        {
                            name: 'CRVAL3',
                            value: '3.639235438064E+10',
                            entryType: 1,
                            numericValue: 36392354380.64446
                        },
                        {
                            name: 'CDELT3',
                            value: '1.250145992279E+05',
                            entryType: 1,
                            numericValue: 125014.59922790527
                        },
                        { name: 'CRPIX3', value: '1.0', entryType: 1, numericValue: 1 },
                        { name: 'CUNIT3', value: 'Hz' },
                        {
                            name: 'RESTFRQ',
                            value: '3.639232000000E+10',
                            entryType: 1,
                            numericValue: 36392319999.99999,
                            comment: 'Rest Frequency (Hz)'
                        },
                        {
                            name: 'SPECSYS',
                            value: 'LSRK',
                            comment: 'Spectral reference frame'
                        },
                        {
                            name: 'ALTRVAL',
                            value: '-2.832206881268E+02',
                            entryType: 1,
                            numericValue: -283.22068812680686,
                            comment: 'Alternate frequency reference value'
                        },
                        {
                            name: 'ALTRPIX',
                            value: '1',
                            entryType: 1,
                            numericValue: 1,
                            comment: 'Alternate frequency reference pixel'
                        },
                        {
                            name: 'VELREF',
                            value: '257',
                            entryType: 2,
                            numericValue: 257,
                            comment: '1 LSR, 2 HEL, 3 OBS, +256 Radio'
                        },
                        { name: 'TELESCOP', value: 'EVLA' },
                        { name: 'OBSERVER', value: 'Mark J. Mark Claussen' },
                        {
                            name: 'DATE-OBS',
                            value: '2010-04-26T03:23:44.000000'
                        },
                        { name: 'TIMESYS', value: 'UTC' },
                        {
                            name: 'OBSRA',
                            value: '1.469890916667E+02',
                            entryType: 1,
                            numericValue: 146.98909166671865
                        },
                        {
                            name: 'OBSDEC',
                            value: '1.327796110878E+01',
                            entryType: 1,
                            numericValue: 13.277961108781836
                        },
                        {
                            name: 'OBSGEO-X',
                            value: '-1.601156673287E+06',
                            entryType: 1,
                            numericValue: -1601156.673287362
                        },
                        {
                            name: 'OBSGEO-Y',
                            value: '-5.041988986066E+06',
                            entryType: 1,
                            numericValue: -5041988.986065895
                        },
                        {
                            name: 'OBSGEO-Z',
                            value: '3.554879236821E+06',
                            entryType: 1,
                            numericValue: 3554879.2368205097
                        },
                        { name: 'INSTRUME', value: 'EVLA' },
                        {
                            name: 'DISTANCE',
                            value: '0.000000000000E+00',
                            entryType: 1
                        },
                        { name: 'USEWEIGH', value: 'F', entryType: 2 },
                        {
                            name: 'CASAMBM',
                            value: 'T',
                            entryType: 2,
                            numericValue: 1,
                            comment: 'CASA multiple BEAMS table present'
                        }
                    ],
                }
            }
        },
        {success: true,
        message: "",
        fileInfo: {
            name: "UVamp.image",
            type: CARTA.FileType.CASA,
            size: 1968708,
            HDUList: [""],
        },
        fileInfoExtended: 
            {
            '': {
                dimensions: 3,
                width: 300,
                height: 300,
                depth: 5,
                stokes: 1,
                stokesVals: [],
                computedEntries: [
                    { name: 'Name', value: 'UVamp.image' },
                    { name: 'Shape', value: '[300, 300, 5]' },
                    {
                      name: 'Number of channels',
                      value: '5',
                      entryType: 2,
                      numericValue: 5
                    },
                    { name: 'Coordinate type', value: 'UU, VV' },
                    { name: 'Image reference pixels', value: '[151, 151]' },
                    {
                      name: 'Image reference coords',
                      value: '[0 lambda, 0 lambda]'
                    },
                    { name: 'Pixel increment', value: '-1718.87 lambda, 1718.87 lambda' },
                    { name: 'Spectral frame', value: 'LSRK' },
                    { name: 'Velocity definition', value: 'RADIO' },
                    { name: 'Pixel unit', value: 'Jy/beam' },
                    {
                      name: 'Median area beam',
                      value: '2.92354" X 1.76939", -17.8188 deg'
                    }
                ],
                headerEntries: [
                    {
                        name: 'XTENSION',
                        value: 'IMAGE',
                        comment: 'IMAGE extension'
                    },
                    {
                        name: 'BITPIX',
                        value: '-32',
                        entryType: 2,
                        numericValue: -32,
                        comment: 'Floating point (32 bit)'
                    },
                    { name: 'NAXIS', value: '3', entryType: 2, numericValue: 3 },
                    { name: 'NAXIS1', value: '300', entryType: 2, numericValue: 300 },
                    { name: 'NAXIS2', value: '300', entryType: 2, numericValue: 300 },
                    { name: 'NAXIS3', value: '5', entryType: 2, numericValue: 5 },
                    { name: 'PCOUNT', value: '0', entryType: 2 },
                    {
                        name: 'GCOUNT',
                        value: '1',
                        entryType: 2,
                        numericValue: 1
                    },                
                    {
                        name: 'BSCALE',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1,
                        comment: 'PHYSICAL = PIXEL*BSCALE + BZERO'
                    },
                    { name: 'BZERO', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'BTYPE', value: 'Intensity' },
                    { name: 'OBJECT', value: 'IRC+10216' },
                    {
                        name: 'BUNIT',
                        value: 'Jy/beam',
                        comment: 'Brightness (pixel) unit'
                    },
                    {
                        name: 'PC1_1',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC2_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC3_1', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_2', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC2_2',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'PC3_2', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC1_3', value: '0.000000000000E+00', entryType: 1 },
                    { name: 'PC2_3', value: '0.000000000000E+00', entryType: 1 },
                    {
                        name: 'PC3_3',
                        value: '1.000000000000E+00',
                        entryType: 1,
                        numericValue: 1
                    },
                    { name: 'CTYPE1', value: 'UU' },
                    {
                        name: 'CRVAL1',
                        value: '0.000000000000E+00',
                        entryType: 1,
                    },
                    {
                        name: 'CDELT1',
                        value: '-1.718873385392E+03',
                        entryType: 1,
                        numericValue: -1718.8733853924696
                    },
                    {
                        name: 'CRPIX1',
                        value: '151',
                        entryType: 1,
                        numericValue: 151
                    },
                    { name: 'CUNIT1', value: 'lambda' },
                    { name: 'CTYPE2', value: 'VV' },
                    {
                        name: 'CRVAL2',
                        value: '0.000000000000E+00',
                        entryType: 1,
                    },
                    {
                        name: 'CDELT2',
                        value: '1.718873385392E+03',
                        entryType: 1,
                        numericValue: 1718.8733853924696
                    },
                    {
                        name: 'CRPIX2',
                        value: '151',
                        entryType: 1,
                        numericValue: 151
                    },
                    { name: 'CUNIT2', value: 'lambda' },
                    { name: 'CTYPE3', value: 'FREQ' },
                    {
                        name: 'CRVAL3',
                        value: '3.639235438064E+10',
                        entryType: 1,
                        numericValue: 36392354380.64446
                    },
                    {
                        name: 'CDELT3',
                        value: '1.250145992279E+05',
                        entryType: 1,
                        numericValue: 125014.59922790527
                    },
                    { name: 'CRPIX3', value: '-10', entryType: 1, numericValue: -10 },
                    { name: 'CUNIT3', value: 'Hz' },
                    {
                        name: 'RESTFRQ',
                        value: '3.639232000000E+10',
                        entryType: 1,
                        numericValue: 36392319999.99999,
                        comment: 'Rest Frequency (Hz)'
                    },
                    {
                        name: 'SPECSYS',
                        value: 'LSRK',
                        comment: 'Spectral reference frame'
                    },
                    {
                        name: 'ALTRVAL',
                        value: '-2.832206881268E+02',
                        entryType: 1,
                        numericValue: -283.22068812680686,
                        comment: 'Alternate frequency reference value'
                    },
                    {
                        name: 'ALTRPIX',
                        value: '-10',
                        entryType: 1,
                        numericValue: -10,
                        comment: 'Alternate frequency reference pixel'
                    },
                    {
                        name: 'VELREF',
                        value: '257',
                        entryType: 2,
                        numericValue: 257,
                        comment: '1 LSR, 2 HEL, 3 OBS, +256 Radio'
                    },
                    { name: 'TELESCOP', value: 'EVLA' },
                    { name: 'OBSERVER', value: 'Mark J. Mark Claussen' },
                    {
                        name: 'DATE-OBS',
                        value: '2010-04-26T03:23:44.000000'
                    },
                    { name: 'TIMESYS', value: 'UTC' },
                    {
                        name: 'OBSRA',
                        value: '1.469890916667E+02',
                        entryType: 1,
                        numericValue: 146.98909166671865
                    },
                    {
                        name: 'OBSDEC',
                        value: '1.327796110878E+01',
                        entryType: 1,
                        numericValue: 13.277961108781836
                    },
                    {
                        name: 'OBSGEO-X',
                        value: '-1.601156673287E+06',
                        entryType: 1,
                        numericValue: -1601156.673287362
                    },
                    {
                        name: 'OBSGEO-Y',
                        value: '-5.041988986066E+06',
                        entryType: 1,
                        numericValue: -5041988.986065895
                    },
                    {
                        name: 'OBSGEO-Z',
                        value: '3.554879236821E+06',
                        entryType: 1,
                        numericValue: 3554879.2368205097
                    },
                    { name: 'INSTRUME', value: 'EVLA' },
                    {
                        name: 'DISTANCE',
                        value: '0.000000000000E+00',
                        entryType: 1
                    },
                    { name: 'USEWEIGH', value: 'F', entryType: 2 },
                    {
                        name: 'CASAMBM',
                        value: 'T',
                        entryType: 2,
                        numericValue: 1,
                        comment: 'CASA multiple BEAMS table present'
                    }
                ],
                }
            }
        },
        {success: true,
            message: "",
            fileInfo: {
                name: "UVphase.image",
                type: CARTA.FileType.CASA,
                size: 1968704,
                HDUList: [""],
            },
            fileInfoExtended: 
                {
                '': {
                    dimensions: 3,
                    width: 300,
                    height: 300,
                    depth: 5,
                    stokes: 1,
                    stokesVals: [],
                    computedEntries: [
                        { name: 'Name', value: 'UVphase.image' },
                        { name: 'Shape', value: '[300, 300, 5]' },
                        {
                          name: 'Number of channels',
                          value: '5',
                          entryType: 2,
                          numericValue: 5
                        },
                        { name: 'Coordinate type', value: 'UU, VV' },
                        { name: 'Image reference pixels', value: '[151, 151]' },
                        {
                          name: 'Image reference coords',
                          value: '[0 lambda, 0 lambda]'
                        },
                        { name: 'Pixel increment', value: '-1718.87 lambda, 1718.87 lambda' },
                        { name: 'Spectral frame', value: 'LSRK' },
                        { name: 'Velocity definition', value: 'RADIO' },
                        { name: 'Pixel unit', value: 'deg' },
                        {
                          name: 'Median area beam',
                          value: '2.92354" X 1.76939", -17.8188 deg'
                        }
                    ],
                    headerEntries: [
                        {
                            name: 'XTENSION',
                            value: 'IMAGE',
                            comment: 'IMAGE extension'
                        },
                        {
                            name: 'BITPIX',
                            value: '-32',
                            entryType: 2,
                            numericValue: -32,
                            comment: 'Floating point (32 bit)'
                        },
                        { name: 'NAXIS', value: '3', entryType: 2, numericValue: 3 },
                        { name: 'NAXIS1', value: '300', entryType: 2, numericValue: 300 },
                        { name: 'NAXIS2', value: '300', entryType: 2, numericValue: 300 },
                        { name: 'NAXIS3', value: '5', entryType: 2, numericValue: 5 },
                        { name: 'PCOUNT', value: '0', entryType: 2 },
                        {
                            name: 'GCOUNT',
                            value: '1',
                            entryType: 2,
                            numericValue: 1
                        },                
                        {
                            name: 'BSCALE',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1,
                            comment: 'PHYSICAL = PIXEL*BSCALE + BZERO'
                        },
                        { name: 'BZERO', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'BTYPE', value: 'Intensity' },
                        { name: 'OBJECT', value: 'IRC+10216' },
                        {
                            name: 'BUNIT',
                            value: 'deg',
                            comment: 'Brightness (pixel) unit'
                        },
                        {
                            name: 'PC1_1',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1
                        },
                        { name: 'PC2_1', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'PC3_1', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'PC1_2', value: '0.000000000000E+00', entryType: 1 },
                        {
                            name: 'PC2_2',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1
                        },
                        { name: 'PC3_2', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'PC1_3', value: '0.000000000000E+00', entryType: 1 },
                        { name: 'PC2_3', value: '0.000000000000E+00', entryType: 1 },
                        {
                            name: 'PC3_3',
                            value: '1.000000000000E+00',
                            entryType: 1,
                            numericValue: 1
                        },
                        { name: 'CTYPE1', value: 'UU' },
                        {
                            name: 'CRVAL1',
                            value: '0.000000000000E+00',
                            entryType: 1,
                        },
                        {
                            name: 'CDELT1',
                            value: '-1.718873385392E+03',
                            entryType: 1,
                            numericValue: -1718.8733853924696
                        },
                        {
                            name: 'CRPIX1',
                            value: '151',
                            entryType: 1,
                            numericValue: 151
                        },
                        { name: 'CUNIT1', value: 'lambda' },
                        { name: 'CTYPE2', value: 'VV' },
                        {
                            name: 'CRVAL2',
                            value: '0.000000000000E+00',
                            entryType: 1,
                        },
                        {
                            name: 'CDELT2',
                            value: '1.718873385392E+03',
                            entryType: 1,
                            numericValue: 1718.8733853924696
                        },
                        {
                            name: 'CRPIX2',
                            value: '151',
                            entryType: 1,
                            numericValue: 151
                        },
                        { name: 'CUNIT2', value: 'lambda' },
                        { name: 'CTYPE3', value: 'FREQ' },
                        {
                            name: 'CRVAL3',
                            value: '3.639235438064E+10',
                            entryType: 1,
                            numericValue: 36392354380.64446
                        },
                        {
                            name: 'CDELT3',
                            value: '1.250145992279E+05',
                            entryType: 1,
                            numericValue: 125014.59922790527
                        },
                        { name: 'CRPIX3', value: '-10', entryType: 1, numericValue: -10 },
                        { name: 'CUNIT3', value: 'Hz' },
                        {
                            name: 'RESTFRQ',
                            value: '3.639232000000E+10',
                            entryType: 1,
                            numericValue: 36392319999.99999,
                            comment: 'Rest Frequency (Hz)'
                        },
                        {
                            name: 'SPECSYS',
                            value: 'LSRK',
                            comment: 'Spectral reference frame'
                        },
                        {
                            name: 'ALTRVAL',
                            value: '-2.832206881268E+02',
                            entryType: 1,
                            numericValue: -283.22068812680686,
                            comment: 'Alternate frequency reference value'
                        },
                        {
                            name: 'ALTRPIX',
                            value: '-10',
                            entryType: 1,
                            numericValue: -10,
                            comment: 'Alternate frequency reference pixel'
                        },
                        {
                            name: 'VELREF',
                            value: '257',
                            entryType: 2,
                            numericValue: 257,
                            comment: '1 LSR, 2 HEL, 3 OBS, +256 Radio'
                        },
                        { name: 'TELESCOP', value: 'EVLA' },
                        { name: 'OBSERVER', value: 'Mark J. Mark Claussen' },
                        {
                            name: 'DATE-OBS',
                            value: '2010-04-26T03:23:44.000000'
                        },
                        { name: 'TIMESYS', value: 'UTC' },
                        {
                            name: 'OBSRA',
                            value: '1.469890916667E+02',
                            entryType: 1,
                            numericValue: 146.98909166671865
                        },
                        {
                            name: 'OBSDEC',
                            value: '1.327796110878E+01',
                            entryType: 1,
                            numericValue: 13.277961108781836
                        },
                        {
                            name: 'OBSGEO-X',
                            value: '-1.601156673287E+06',
                            entryType: 1,
                            numericValue: -1601156.673287362
                        },
                        {
                            name: 'OBSGEO-Y',
                            value: '-5.041988986066E+06',
                            entryType: 1,
                            numericValue: -5041988.986065895
                        },
                        {
                            name: 'OBSGEO-Z',
                            value: '3.554879236821E+06',
                            entryType: 1,
                            numericValue: 3554879.2368205097
                        },
                        { name: 'INSTRUME', value: 'EVLA' },
                        {
                            name: 'DISTANCE',
                            value: '0.000000000000E+00',
                            entryType: 1
                        },
                        { name: 'USEWEIGH', value: 'F', entryType: 2 },
                        {
                            name: 'CASAMBM',
                            value: 'T',
                            entryType: 2,
                            numericValue: 1,
                            comment: 'CASA multiple BEAMS table present'
                        }
                    ],
                }
            }
        }
    ]
};

describe("FILEINFO_CASA_VARIENTS: Testing if file info of a variant CASA images is correctly delivered by the backend", () => {

    let Connection: Client;
    beforeAll(async () => {
        Connection = new Client(testServerUrl);
        await Connection.open();
        await Connection.registerViewer(assertItem.registerViewer);
    }, connectTimeout);

    describe(`Go to "${testSubdirectory}" folder`, () => {
        let basePath: string;
        beforeAll(async () => {
            await Connection.send(CARTA.FileListRequest, { directory: "$BASE" });
            basePath = (await Connection.receive(CARTA.FileListResponse) as CARTA.FileListResponse).directory;
        }, listFileTimeout);
        assertItem.fileInfoRequest.map((fileInfoRequest,index) => {
            describe(`query the info of file : ${fileInfoRequest.file}`, () => {
                let FileInfoResponse: CARTA.FileInfoResponse;
                test(`FILE_INFO_RESPONSE should arrive within ${openFileTimeout} ms".`, async () => {
                    await Connection.send(CARTA.FileInfoRequest, {
                        directory: `${basePath}/` + testSubdirectory,
                        ...fileInfoRequest,
                    });
                    FileInfoResponse = await Connection.receive(CARTA.FileInfoResponse);
                }, openFileTimeout);

                test("FILE_INFO_RESPONSE.success = true", () => {
                    expect(FileInfoResponse.success).toBe(true);
                });
    
                test(`FILE_INFO_RESPONSE.file_info.HDU_List = [${assertItem.fileInfoResponse[index].fileInfo.HDUList}]`, () => {
                    expect(FileInfoResponse.fileInfo.HDUList[0]).toBe(assertItem.fileInfoResponse[index].fileInfo.HDUList[0]);
                });
    
                test(`FILE_INFO_RESPONSE.file_info.name = "${assertItem.fileInfoResponse[index].fileInfo.name}"`, () => {
                    expect(FileInfoResponse.fileInfo.name).toEqual(assertItem.fileInfoResponse[index].fileInfo.name);
                });
    
                test(`FILE_INFO_RESPONSE.file_info.size = ${assertItem.fileInfoResponse[index].fileInfo.size}`, () => {
                    expect(FileInfoResponse.fileInfo.size.toString()).toEqual(assertItem.fileInfoResponse[index].fileInfo.size.toString());
                });
    
                test(`FILE_INFO_RESPONSE.file_info.type = ${CARTA.FileType.CASA}`, () => {
                    expect(FileInfoResponse.fileInfo.type).toBe(assertItem.fileInfoResponse[index].fileInfo.type);
                });
    
                test(`FILE_INFO_RESPONSE.file_info_extended.dimensions = ${assertItem.fileInfoResponse[index].fileInfoExtended[''].dimensions}`, () => {
                    expect(FileInfoResponse.fileInfoExtended[''].dimensions).toEqual(assertItem.fileInfoResponse[index].fileInfoExtended[''].dimensions);
                });
    
                test(`FILE_INFO_RESPONSE.file_info_extended.width = ${assertItem.fileInfoResponse[index].fileInfoExtended[''].width}`, () => {
                    expect(FileInfoResponse.fileInfoExtended[''].width).toEqual(assertItem.fileInfoResponse[index].fileInfoExtended[''].width);
                });
    
                test(`FILE_INFO_RESPONSE.file_info_extended.height = ${assertItem.fileInfoResponse[index].fileInfoExtended[''].height}`, () => {
                    expect(FileInfoResponse.fileInfoExtended[''].height).toEqual(assertItem.fileInfoResponse[index].fileInfoExtended[''].height);
                });
    
                if (assertItem.fileInfoResponse[index].fileInfoExtended[''].dimensions > 2) {
                    test(`FILE_INFO_RESPONSE.file_info_extended.depth = ${assertItem.fileInfoResponse[index].fileInfoExtended[''].depth}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[''].depth).toEqual(assertItem.fileInfoResponse[index].fileInfoExtended[''].depth);
                    });
                };
    
                if (assertItem.fileInfoResponse[index].fileInfoExtended[''].dimensions > 3) {
                    test(`FILE_INFO_RESPONSE.file_info_extended.stokes = ${assertItem.fileInfoResponse[index].fileInfoExtended[''].stokes}`, () => {
                        expect(FileInfoResponse.fileInfoExtended[''].stokes).toEqual(assertItem.fileInfoResponse[index].fileInfoExtended[''].stokes);
                    });
                };
    
                test(`FILE_INFO_RESPONSE.file_info_extended.stokes_vals = [${assertItem.fileInfoResponse[index].fileInfoExtended[''].stokesVals}]`, () => {
                    expect(FileInfoResponse.fileInfoExtended[''].stokesVals).toEqual(assertItem.fileInfoResponse[index].fileInfoExtended[''].stokesVals);
                });
    
                test(`len(FILE_INFO_RESPONSE.file_info_extended.computed_entries)==${assertItem.fileInfoResponse[index].fileInfoExtended[''].computedEntries.length}`, () => {
                    expect(FileInfoResponse.fileInfoExtended[''].computedEntries.length).toEqual(assertItem.fileInfoResponse[index].fileInfoExtended[''].computedEntries.length);
                });
    
                test(`assert FILE_INFO_RESPONSE.file_info_extended.computed_entries`, () => {
                    assertItem.fileInfoResponse[index].fileInfoExtended[''].computedEntries.map((entry: CARTA.IHeaderEntry, index) => {
                        if (isNaN(parseFloat(entry.value))){
                            expect(FileInfoResponse.fileInfoExtended[''].computedEntries.find(f => f.name == entry.name).value).toEqual(entry.value);
                        } else {
                            expect(parseFloat(FileInfoResponse.fileInfoExtended[''].computedEntries.find(f => f.name == entry.name).value)).toEqual(parseFloat(entry.value));
                        }
                    });
                });
    
                test(`len(file_info_extended.header_entries)==${assertItem.fileInfoResponse[index].fileInfoExtended[''].headerEntries.length}`, () => {
                    expect(FileInfoResponse.fileInfoExtended[''].headerEntries.length).toEqual(assertItem.fileInfoResponse[index].fileInfoExtended[''].headerEntries.length)
                });
    
                test(`assert FILE_INFO_RESPONSE.file_info_extended.header_entries`, () => {
                    assertItem.fileInfoResponse[index].fileInfoExtended[''].headerEntries.map((entry: CARTA.IHeaderEntry, index) => {
                        if (isNaN(parseFloat(entry.value)) && entry.value != undefined){
                            expect(FileInfoResponse.fileInfoExtended[''].headerEntries.find(f => f.name == entry.name).value).toEqual(entry.value);
                        } else {
                            expect(parseFloat(FileInfoResponse.fileInfoExtended[''].headerEntries.find(f => f.name == entry.name).value)).toEqual(parseFloat(entry.value));
                        }
                    });
                });

                // //For snapshot method
                // test(`FILE_INFO_RESPONSE should match snapshot".`, async () => {
                //     expect(FileInfoResponse).toMatchSnapshot({
                //         fileInfo: {
                //             // Date for creating a file is not a constant
                //             date: expect.any(Object), // Might be a Number or Long
                //         },
                //         fileInfoExtended: {
                //             "": {
                //                 // Skip this
                //                 headerEntries: expect.any(Object),
                //             },
                //         },
                //     });
                //     // Tolerance for precision digits 
                //     FileInfoResponse.fileInfoExtended[""].headerEntries.map(item => {
                //         if (item["numericValue"]) {
                //             expect(item).toMatchSnapshot({
                //                 numericValue: expect.any(Number),
                //             });
                //             expect(item["numericValue"].toExponential(assertItem.precisionDigit)).toMatchSnapshot();
                //         }else{
                //             expect(item).toMatchSnapshot();
                //         }
                //     });
                // });
            });
        });
    });
    afterAll(() => Connection.close());
});