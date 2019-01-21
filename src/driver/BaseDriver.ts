import {ValidatorOptions} from "class-validator";
import {classToPlain, ClassTransformOptions} from "class-transformer";

import {MethodMetadata} from "../metadata/MethodMetadata";
import {ParamMetadata} from "../metadata/ParamMetadata";
import {Method} from "../Method";
import {RpcError} from "../rpc-error/RpcError";

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
     * Indicates if class-validator should be used or not.
     */
    enableValidation: boolean;

    /**
     * Global class transformer options passed to class-transformer during classToPlain operation.
     * This operation is being executed when server returns response to user.
     */
    classToPlainTransformOptions: ClassTransformOptions;

    /**
     * Global class-validator options passed during validate operation.
     */
    validationOptions: ValidatorOptions;

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
     * Map of error overrides.
     */
    errorOverridingMap: {[key: string]: any};

    /**
     * Methods
     */
    private methods: MethodMetadata[];

    /**
     * Initializes the things driver needs before routes and middleware registration.
     */
    abstract initialize(): void;

    /**
     * Registers action in the driver.
     */
    abstract registerMethod(methods: MethodMetadata[], executeCallback: (method: MethodMetadata, options: Method) => any): void;

    /**
     * Registers all routes in the framework.
     */
    abstract registerRoutes(): void;

    /**
     * Gets param from the request.
     */
    abstract getParamFromRequest(actionOptions: Method, param: ParamMetadata): any;

    /**
     * Defines an algorithm of how to handle error during executing controller action.
     */
    abstract handleError(error: any, action: MethodMetadata, options: Method): any;

    /**
     * Defines an algorithm of how to handle success result of executing controller action.
     */
    abstract handleSuccess(result: any, action: MethodMetadata, options: Method): void;

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected transformResult(result: any, action: MethodMetadata, options: Method): any {
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
            const options = action.responseClassTransformOptions || this.classToPlainTransformOptions;
            result = classToPlain(result, options);
        }

        return result;
    }

    protected processJsonError(error: any, options: Method) {

        if (typeof error.toJSON === "function")
            return error.toJSON();

        let processedError: any = {};
        if (error instanceof RpcError) {
            processedError.name = error.name && error.name !== "RpcError" ? error.name : error.constructor.name;

            if (error.message)
                processedError.message = error.message;
            if (error.stack && this.developmentMode)
                processedError.data.stack = error.stack;

            Object.keys(error)
                .filter(key => key !== "stack" && key !== "name" && key !== "message" && key !== "rpcCode")
                .forEach(key => processedError.data[key] = (error as any)[key]);

            // todo check server error

            return Object.keys(processedError).length > 0 ? processedError : undefined;
        }

        return error;
    }

    protected merge(obj1: any, obj2: any): any {
        const result: any = {};
        for (let i in obj1) {
            if ((i in obj2) && (typeof obj1[i] === "object") && (i !== null)) {
                result[i] = this.merge(obj1[i], obj2[i]);
            } else {
                result[i] = obj1[i];
            }
        }
        for (let i in obj2) {
            result[i] = obj2[i];
        }
        return result;
    }

}
