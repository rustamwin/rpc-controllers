import {RpcError} from "./RpcError";

/**
 * Exception for 500 HTTP error.
 */
export class ParseError extends RpcError {
    name = "ParseError";

    constructor(message: string) {
        super(-32700);
        Object.setPrototypeOf(this, ParseError.prototype);

        if (message)
            this.message = message;
    }

}