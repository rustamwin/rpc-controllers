import {classToPlain, ClassTransformOptions} from "class-transformer";

import {MethodMetadata} from "../metadata/MethodMetadata";
import {ParamMetadata} from "../metadata/ParamMetadata";
import {RpcError} from "../rpc-error/RpcError";
import {InternalError} from "../rpc-error/InternalError";
import {ServerError} from "../rpc-error/ServerError";
import {Request} from "../Request";

/**
 * Base driver functionality for all other drivers.
 * Abstract layer to organize controllers integration with different http server implementations.
 */
export abstract class BaseDriver {

    /**
     * Reference to the underlying framework app object.
     */
    app: any;

    /**
     * Indicates if class-transformer should be used or not.
     */
    useClassTransformer: boolean;

    /**
     * Global class transformer options passed to class-transformer during classToPlain operation.
     * This operation is being executed when server returns response to user.
     */
    classToPlainTransformOptions: ClassTransformOptions;

    /**
     * Global class transformer options passed to class-transformer during plainToClass operation.
     * This operation is being executed when parsing user parameters.
     */
    plainToClassTransformOptions: ClassTransformOptions;

    /**
     * Indicates if default routing-controllers error handler should be used or not.
     */
    isDefaultErrorHandlingEnabled: boolean;

    /**
     * Indicates if routing-controllers should operate in development mode.
     */
    developmentMode: boolean;

    /**
     * Global application prefix.
     */
    routePrefix: string = "";

    /**
     * Indicates if cors are enabled.
     * This requires installation of additional module (cors for express and kcors for koa).
     */
    cors?: boolean | Object;

    /**
     * Initializes the things driver needs before routes and middleware registration.
     */
    abstract initialize(): void;

    /**
     * Registers all methods in the driver.
     */
    abstract registerMethods(methods: MethodMetadata[], executeCallback: (error: any, request: Request, method?: MethodMetadata) => any): void;

    /**
     * Registers all routes in the framework.
     */
    abstract registerRoutes(): void;

    /**
     * Gets param from the request.
     */
    abstract getParamFromRequest(methodOptions: Request, param: ParamMetadata): any;

    /**
     * Defines an algorithm of how to handle error during executing controller method.
     */
    abstract handleError(error: any, request: Request): any;

    /**
     * Defines an algorithm of how to handle success result of executing controller method.
     */
    abstract handleSuccess(result: any, method: MethodMetadata, request: Request): void;

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected transformResult(result: any, method: MethodMetadata, request: Request): any {
        // check if we need to transform result
        const shouldTransform = (this.useClassTransformer && result != null) // transform only if enabled and value exist
            && result instanceof Object // don't transform primitive types (string/number/boolean)
            && !(
                result instanceof Uint8Array // don't transform binary data
                ||
                result.pipe instanceof Function // don't transform streams
            );

        // transform result if needed
        if (shouldTransform) {
            const action = method.responseClassTransformOptions || this.classToPlainTransformOptions;
            result = classToPlain(result, action);
        } else if (result instanceof Buffer || result instanceof Uint8Array) { // check if it's binary data (typed array)
            result = new Buffer(result as any).toString("binary");
        }

        return result;
    }

    protected processJsonError(error: any) {

        let processedError: any = {};
        if (error instanceof RpcError) {
            processedError.code = error.rpcCode;

            if (error.message)
                processedError.message = error.message;

            processedError.data = {};
            if (error.stack && this.developmentMode)
                processedError.data.stack = error.stack;

            Object.keys(error)
                .filter(key => key !== "stack" && key !== "name" && key !== "message" && key !== "rpcCode")
                .forEach(key => processedError.data[key] = (error as any)[key]);

        } else if (typeof error === "string") {
            error = new InternalError(error);
            processedError.code = error.rpcCode;

            if (error.message)
                processedError.message = error.message;

            processedError.data = {};
            if (error.stack && this.developmentMode)
                processedError.data.stack = error.stack;

            Object.keys(error)
                .filter(key => key !== "stack" && key !== "name" && key !== "message" && key !== "rpcCode")
                .forEach(key => processedError.data[key] = (error as any)[key]);

        } else {
            processedError.code = new ServerError().rpcCode;
            processedError.message = new ServerError().message;

            processedError.data = {};
            if (error.stack && this.developmentMode)
                processedError.data.stack = error.stack;

            Object.keys(error)
                .filter(key => key !== "stack" && key !== "name" && key !== "message" && key !== "rpcCode")
                .forEach(key => processedError.data[key] = (error as any)[key]);

        }

        return Object.keys(processedError).length > 0 ? processedError : undefined;
    }

}
