import {RpcError} from "./RpcError";

/**
 * Exception for -32603 RPC error.
 */
export class InternalError extends RpcError {
    name = "InternalError";
    message = "Internal error";

    constructor(message?: string) {
        super(-32603);
        Object.setPrototypeOf(this, InternalError.prototype);

        if (message)
            this.message = message;
    }

}