import { CARTA } from "carta-protobuf";
import {MessageController, ConnectionStatus} from "./MessageController";
import { take } from 'rxjs/operators';

function checkConnection() {
    const msgController = MessageController.Instance;
    test("check connection", () => {
        expect(msgController.connectionStatus).toBe(ConnectionStatus.ACTIVE)
    })
}

function Stream(cartaType: any, InputNum: number) {
    return new Promise<any>((resolve,reject) => {
        const msgController = MessageController.Instance;
        let _count = 0;
        switch(cartaType){
            case CARTA.RegionHistogramData:
                let RegionHistogramData: CARTA.RegionHistogramData[] = [];
                let resRegionHistogramData = msgController.histogramStream.pipe(take(InputNum));
                resRegionHistogramData.subscribe(data => {
                    RegionHistogramData.push(data);
                    _count++;
                    if (_count === InputNum){
                        resolve(RegionHistogramData);
                    }
                });
            case CARTA.SpatialProfileData:
                let SpatialProfileData: CARTA.SpatialProfileData[] = [];
                let resSpatialProfileData = msgController.spatialProfileStream.pipe(take(InputNum));
                resSpatialProfileData.subscribe(data => {
                    SpatialProfileData.push(data);
                    _count++;
                    if (_count === InputNum){
                        resolve(SpatialProfileData);
                    }
                });
            case CARTA.RasterTileData:
                let ack: any[] = [];
                let ex1 = msgController.rasterSyncStream.pipe(take(2));
                ex1.subscribe(data => {
                    ack.push(data);
                    if (data.endSync){
                        resolve(ack);
                    }
                })
                let ex2 = msgController.rasterTileStream.pipe(take(InputNum));
                ex2.subscribe(data => {
                    ack.push(data)
                })
            case CARTA.MomentProgress:
                let MomentProgressData: any[] = [];
                let resMomentProgressData = msgController.momentProgressStream.pipe(take(InputNum));
                resMomentProgressData.subscribe(data => {
                    MomentProgressData.push(data);
                    _count++;
                    if (_count === InputNum) {
                        resolve(MomentProgressData);
                    }
                });
            case CARTA.MomentResponse:
                let MomentResponseData: any[] = [];
                let resMomentResponseData = msgController.momentResponseStream.pipe(take(InputNum));
                resMomentResponseData.subscribe(data => {
                    MomentResponseData.push(data);
                    _count++
                    if (_count === InputNum) {
                        resolve(MomentResponseData);
                    }
                })

        }
    })
}


export { checkConnection , Stream };
