import {RpcError} from "./RpcError";

/**
 * Exception for 500 HTTP error.
 */
export class ServerError extends RpcError {
    name = "ServerError";

    constructor(message: string) {
        super(-32000);
        Object.setPrototypeOf(this, ServerError.prototype);

        if (message)
            this.message = message;
    }

}