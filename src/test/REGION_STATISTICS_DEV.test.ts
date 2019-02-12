/// Manual
let testServerUrl = "ws://127.0.0.1:1234";
// let testServerUrl = "wss://acdc0.asiaa.sinica.edu.tw/socket2";
let testSubdirectoryName = "set_QA";
let connectionTimeout = 1000;
let operationTimeout = 500;

/// ICD defined
import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";

let testFileName = "S255_IR_sci.spw25.cube.I.pbcor.fits";

describe("REGION_STATISTICS_DEV: Temporary test case of region statistics to assist backend development", () => {   
    let Connection: WebSocket;

    beforeAll( done => {
        // Establish a websocket connection in the binary form: arraybuffer 
        Connection = new WebSocket(testServerUrl);
        Connection.binaryType = "arraybuffer";
        // While open a Websocket
        Connection.onopen = () => {
            // Checkout if Websocket server is ready
            if (Connection.readyState === WebSocket.OPEN) {
                
                Utility.getEvent(Connection, "REGISTER_VIEWER_ACK", CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        expect(RegisterViewerAck.success).toBe(true);
                        
                        Utility.getEvent(Connection, "OPEN_FILE_ACK", CARTA.OpenFileAck, 
                            (OpenFileAck: CARTA.OpenFileAck) => {
                                expect(OpenFileAck.success).toBe(true);

                                Utility.getEvent(Connection, "RASTER_IMAGE_DATA", CARTA.RasterImageData, 
                                    (RasterImageData: CARTA.RasterImageData) => {
                                        expect(RasterImageData.imageData.length).toBeGreaterThan(1);
                                        
                                        done();
                                });  
                                
                                Utility.setEvent(Connection, "SET_IMAGE_VIEW", CARTA.SetImageView,
                                    {
                                        fileId: 0, 
                                        imageBounds: {xMin: 0, xMax: 1920, yMin: 0, yMax: 1920}, 
                                        mip: 4, 
                                        compressionType: CARTA.CompressionType.ZFP, 
                                        compressionQuality: 11, 
                                        numSubsets: 4
                                    }
                                );
                            }  
                        );
                        
                        Utility.setEvent(Connection, "OPEN_FILE", CARTA.OpenFile, 
                        {
                            directory: testSubdirectoryName, 
                            file: testFileName, hdu: "0", fileId: 0, 
                            renderMode: CARTA.RenderMode.RASTER
                        }
                        );

                    }
                );
                
                Utility.setEvent(Connection, "REGISTER_VIEWER", CARTA.RegisterViewer, 
                    {
                        sessionId: "", 
                        apiKey: "1234"
                    }
                );

            } else {
                console.log(`Can not open a connection. @${new Date()}`);
                done();
            }
            
        };
    }, connectionTimeout);
 
    test(`Test set region.`, 
    done => {
        Utility.getEvent(Connection, "SET_REGION_ACK", CARTA.SetRegionAck, 
            (SetRegionAck: CARTA.SetRegionAck) => {
                expect(SetRegionAck.success).toBe(true);
                expect(SetRegionAck.regionId).toEqual(0);
                
                done();
            }
        );  

        Utility.setEvent(Connection, "SET_REGION", CARTA.SetRegion, 
            {
                fileId: 0, regionId: -1, regionName: "a box",
                regionType: CARTA.RegionType.RECTANGLE, 
                channelMin: 0, channelMax: 0, stokes: [],
                controlPoints: [{x: 1000, y: 1300}, {x: 200, y: 300}],
                rotation: 0
            }
        );

    }, operationTimeout);

    test(`Test region stastics.`, 
    done => {

        Utility.getEvent(Connection, "REGION_STATS_DATA", CARTA.RegionStatsData, 
            (RegionStatsData: CARTA.RegionStatsData) => {
                expect(RegionStatsData.fileId).toEqual(0);
                expect(RegionStatsData.regionId).toEqual(0);
                expect(RegionStatsData.channel).toEqual(0);
                expect(RegionStatsData.stokes).toEqual(0);

                expect(RegionStatsData.statistics.find( f => f.statsType === CARTA.StatsType.Max)).toEqual(9.904252E-3);
                expect(RegionStatsData.statistics.find( f => f.statsType === CARTA.StatsType.Min)).toEqual(-3.641330E-3);
                expect(RegionStatsData.statistics.find( f => f.statsType === CARTA.StatsType.Sum)).toEqual(2.443106);
                expect(RegionStatsData.statistics.find( f => f.statsType === CARTA.StatsType.Mean)).toEqual(4.038126E-5);
                expect(RegionStatsData.statistics.find( f => f.statsType === CARTA.StatsType.RMS)).toEqual(9.254825E-4);
                expect(RegionStatsData.statistics.find( f => f.statsType === CARTA.StatsType.Sigma)).toEqual(9.246087E-4);
                expect(RegionStatsData.statistics.find( f => f.statsType === CARTA.StatsType.FluxDensity)).toEqual(3.049256E-2);

                done();
            }
        ); 

        Utility.setEvent(Connection, "SET_STATS_REQUIREMENTS", CARTA.SetStatsRequirements, 
            {
                fileId: 0, regionId: 0, 
                stats: [
                    CARTA.StatsType.Sum, CARTA.StatsType.FluxDensity, 
                    CARTA.StatsType.Mean, CARTA.StatsType.RMS, CARTA.StatsType.Sigma, 
                    CARTA.StatsType.Min, CARTA.StatsType.Max
                ]
            }
        );
        
    }, operationTimeout);

    afterAll( done => {
        Connection.close();
        done();
    });
});