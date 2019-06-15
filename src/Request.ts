/**
 * JSON-RPC request.
 */
export interface Request {

    /**
     * JSON-RPC version
     */
    jsonrpc: "1.0" | "2.0";

    /**
     * Request object id.
     */
    id: string | number;

    /**
     * Method Response object.
     */
    method: string;

    /**
     * Request params
     */
    params?: any;

}
