import {RpcError} from "./RpcError";

/**
 * Exception for todo HTTP error.
 */
export class MethodNotAllowedError extends RpcError {
    name = "MethodNotAllowedError";

    constructor(message?: string) {
        super(405);
        Object.setPrototypeOf(this, MethodNotAllowedError.prototype);

        if (message)
            this.message = message;
    }

}