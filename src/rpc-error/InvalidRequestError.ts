import {RpcError} from "./RpcError";

/**
 * Exception for 500 HTTP error.
 */
export class InvalidRequestError extends RpcError {
    name = "InvalidRequestError";

    constructor(message: string) {
        super(-32600);
        Object.setPrototypeOf(this, InvalidRequestError.prototype);

        if (message)
            this.message = message;
    }

}