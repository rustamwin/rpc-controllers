import {RpcError} from "./RpcError";

/**
 * Exception for -32601 RPC error.
 */
export class MethodNotFoundError extends RpcError {
    name = "MethodNotFoundError";

    constructor(message?: string) {
        super(-32601);
        Object.setPrototypeOf(this, MethodNotFoundError.prototype);

        if (message)
            this.message = message;
    }

}