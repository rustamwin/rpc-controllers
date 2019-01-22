/**
 * Used to throw HTTP errors.
 * Just do throw new HttpError(code, message) in your controller action and
 * default error handler will catch it and give in your response given code and message .
 */
export class RpcError extends Error {

    /**
     * specified rpc code
     */
    rpcCode: number;

    constructor(rpcCode: number, message?: string) {
        super();
        Object.setPrototypeOf(this, RpcError.prototype);

        if (rpcCode)
            this.rpcCode = rpcCode;
        if (message)
            this.message = message;

        this.stack = new Error().stack;
    }

}