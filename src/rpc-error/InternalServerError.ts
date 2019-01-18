import {RpcError} from "./RpcError";

/**
 * Exception for 500 HTTP error.
 */
export class InternalServerError extends RpcError {
    name = "InternalServerError";

    constructor(message: string) {
        super(500);
        Object.setPrototypeOf(this, InternalServerError.prototype);

        if (message)
            this.message = message;
    }

}