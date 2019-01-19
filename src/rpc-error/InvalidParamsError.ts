import {RpcError} from "./RpcError";

/**
 * Exception for -32602 RPC error.
 */
export class InvalidParamsError extends RpcError {
    name = "InvalidParamsError";

    constructor(message: string) {
        super(-32602);
        Object.setPrototypeOf(this, InvalidParamsError.prototype);

        if (message)
            this.message = message;
    }

}