import {RpcError} from "./RpcError";

/**
 * Exception for 500 HTTP error.
 */
export class InvalidRequestError extends RpcError {
    name = "InvalidRequestError";
    message = "Invalid Request";

    constructor(message?: string) {
        super(-32600);
        Object.setPrototypeOf(this, InvalidRequestError.prototype);

        if (message)
            this.message = message;
    }

}