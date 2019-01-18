/**
 * Used to throw HTTP errors.
 * Just do throw new HttpError(code, message) in your controller action and
 * default error handler will catch it and give in your response given code and message .
 * 
 * todo implement
 * 
 * PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603
  
 */
export class RpcError extends Error {

    httpCode: number;

    constructor(httpCode: number, message?: string) {
        super();
        Object.setPrototypeOf(this, RpcError.prototype);
        
        if (httpCode)
            this.httpCode = httpCode;
        if (message)
            this.message = message;

        this.stack = new Error().stack;
    }

}