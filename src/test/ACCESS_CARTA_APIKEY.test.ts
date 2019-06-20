import {CARTA} from "carta-protobuf";
import * as Utility from "./testUtilityFunction";
import config from "./config.json";
let testServerUrl = config.serverURL;
let connectTimeout = config.timeout.connection;
let expectBasePath = config.path.base;
interface AssertItem {
    register: CARTA.IRegisterViewer;
    filelist: CARTA.IFileListRequest;
}
let assertItem: AssertItem = {
    register: {
        sessionId: 0,
        apiKey: "11111111-1111-1111-1111-111111111111",
    },
    filelist: {
        directory: expectBasePath,
    },
}
describe("ACCESS_CARTA_APIKEY tests: Testing connections to the backend with an API key", () => {
    let Connection: WebSocket;
    describe(`send "REGISTER_VIEWER" to "${testServerUrl}" with session_id=${assertItem.register.sessionId} & api_key="${assertItem.register.apiKey}"`, () => {
        let RegisterViewerAckTemp: CARTA.RegisterViewerAck; 
        test(`should get "REGISTER_VIEWER_ACK" within ${connectTimeout} ms`, done => {        
            // Connect to "testServerUrl"
            Connection = new WebSocket(testServerUrl);
            expect(Connection.readyState).toBe(WebSocket.CONNECTING);

            Connection.binaryType = "arraybuffer";
            Connection.onopen = OnOpen;        
            
            async function OnOpen(this: WebSocket, ev: Event) {
                expect(this.readyState).toBe(WebSocket.OPEN);
                await Utility.setEventAsync(this, CARTA.RegisterViewer, assertItem.register);
                await Utility.getEventAsync(this, CARTA.RegisterViewerAck, 
                    (RegisterViewerAck: CARTA.RegisterViewerAck) => {
                        RegisterViewerAckTemp = RegisterViewerAck;
                    }
                );
                done();
            }
        }, connectTimeout);

        test("REGISTER_VIEWER_ACK.success = True", () => {
            expect(RegisterViewerAckTemp.success).toBe(true);
        });

        test("REGISTER_VIEWER_ACK.session_id is not None", () => {
            expect(RegisterViewerAckTemp.sessionId).toBeDefined();
            console.log(`Registered session ID is ${RegisterViewerAckTemp.sessionId} @${new Date()}`);
        });

        test(`REGISTER_VIEWER_ACK.session_type = "CARTA.SessionType.NEW"`, () => {
            expect(RegisterViewerAckTemp.sessionType).toBe(CARTA.SessionType.NEW);
        });

        test("REGISTER_VIEWER_ACK.message is empty", () => {
            expect(RegisterViewerAckTemp.message).toBe("");
        });

    });

    describe(`send "FILE_LIST_REQUEST" with directory = "$BASE"`, () => {
        let FileListResponseTemp: CARTA.FileListResponse; 
        test(`should get "FILE_LIST_RESPONSE" within ${connectTimeout} ms`, async () => {
            await Utility.setEventAsync(Connection, CARTA.FileListRequest, assertItem.filelist);
            await Utility.getEventAsync(Connection, CARTA.FileListResponse, 
                (FileListResponse: CARTA.FileListResponse) => {
                    FileListResponseTemp = FileListResponse;
                }
            );
        }, connectTimeout);

        test("FILE_LIST_RESPONSE.success = True", () => {
            expect(FileListResponseTemp.success).toBe(true);
        });

        test(`FILE_LIST_RESPONSE.directory = "."`, () => {
            expect(FileListResponseTemp.directory).toBe(".");
        });

        test(`FILE_LIST_RESPONSE.parent = ""`, () => {
            expect(FileListResponseTemp.parent).toBe("");
        });

        test("FILE_LIST_RESPONSE.files = []", () => {
            expect(FileListResponseTemp.files).toEqual([]);
        });

        test(`FILE_LIST_RESPONSE.subdirectories = [api_private1", "public"]`, () => {
            expect(FileListResponseTemp.subdirectories).toEqual(["api_private1", "public"]);
        });

        test(`FILE_LIST_RESPONSE.message = ""`, () => {
            expect(FileListResponseTemp.message).toBe("");
        });

    });

    afterAll( () => {
        Connection.close();
    });
});
