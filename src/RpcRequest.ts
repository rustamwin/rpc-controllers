export interface RpcRequest {
    "json-rpc": string;
    id: string | number;
    method: string;
    params: Array<any> | {[key: string]: any};
}