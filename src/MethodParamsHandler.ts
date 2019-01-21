import { RpcError } from "./rpc-error/RpcError";
import { plainToClass } from "class-transformer";
import { validateOrReject as validate, ValidationError } from "class-validator";
import { Method } from "./Method";
import { BaseDriver } from "./driver/BaseDriver";
import { ParamMetadata } from "./metadata/ParamMetadata";
import { isPromiseLike } from "./helpers/isPromiseLike";
import {InvalidParamsError} from "./rpc-error/InvalidParamsError";
import {ParseError} from "./rpc-error/ParseError";

/**
 * Handles method params.
 */
export class MethodParamsHandler<T extends BaseDriver> {

    constructor(private driver: T) {
    }

    /**
     * Handles method parameter.
     */
    handle(method: Method, param: ParamMetadata): Promise<any> | any {

       /* if (param.type === "request")
            return method.request;

        if (param.type === "response")
            return method.response;

        if (param.type === "context")
            return method.context;
*/
        // get parameter value from request and normalize it
        const value = this.normalizeParamValue(this.driver.getParamFromRequest(method, param), param);
        if (isPromiseLike(value))
            return value.then(value => this.handleValue(value, method, param));

        return this.handleValue(value, method, param);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Handles non-promise value.
     */
    protected handleValue(value: any, method: Method, param: ParamMetadata): Promise<any> | any {

        // if transform function is given for this param then apply it
        if (param.transform)
            value = param.transform(method, value);

        // check cases when parameter is required but its empty and throw errors in this case
        if (param.required) {
            const isValueEmpty = value === null || value === undefined || value === "";
            const isValueEmptyObject = value instanceof Object && Object.keys(value).length === 0;

            if (param.type === "params" && !param.name && (isValueEmpty || isValueEmptyObject)) { // body has a special check and error message
                return Promise.reject(new InvalidParamsError("Params empty"));

            } else if (param.name && isValueEmpty) { // regular check for all other parameters // todo: figure out something with param.name usage and multiple things params (query params, upload files etc.)
                return Promise.reject(new InvalidParamsError("method, param"));
            }
        }

        return value;
    }

    /**
     * Normalizes parameter value.
     */
    protected normalizeParamValue(value: any, param: ParamMetadata): Promise<any> | any {
        if (value === null || value === undefined)
            return value;

        switch (param.targetName) {
            case "number":
                if (value === "") return undefined;
                return +value;

            case "string":
                return value;

            case "boolean":
                if (value === "true" || value === "1") {
                    return true;

                } else if (value === "false" || value === "0") {
                    return false;
                }

                return !!value;

            // case "date":
            //     const parsedDate = new Date(value);
            //     if (isNaN(parsedDate.getTime())) {
            //         return Promise.reject(new BadRequestError(`${param.name} is invalid! It can't be parsed to date.`));
            //     }
            //     return parsedDate;

            default:
                if (value && (param.parse || param.isTargetObject)) {
                    value = this.parseValue(value, param);
                    value = this.transformValue(value, param);
                    value = this.validateValue(value, param); // note this one can return promise
                }
        }
        return value;
    }

    /**
     * Parses string value into a JSON object.
     */
    protected parseValue(value: any, paramMetadata: ParamMetadata): any {
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            } catch (error) {
                throw new ParseError("");
            }
        }

        return value;
    }

    /**
     * Perform class-transformation if enabled.
     */
    protected transformValue(value: any, paramMetadata: ParamMetadata): any {
        if (this.driver.useClassTransformer &&
            paramMetadata.targetType &&
            paramMetadata.targetType !== Object &&
            !(value instanceof paramMetadata.targetType)) {

            const options = paramMetadata.classTransform || this.driver.plainToClassTransformOptions;
            value = plainToClass(paramMetadata.targetType, value, options);
        }

        return value;
    }

    /**
     * Perform class-validation if enabled.
     */
    protected validateValue(value: any, paramMetadata: ParamMetadata): Promise<any> | any {
        const isValidationEnabled = (paramMetadata.validate instanceof Object || paramMetadata.validate === true)
            || (this.driver.enableValidation === true && paramMetadata.validate !== false);
        const shouldValidate = paramMetadata.targetType
            && (paramMetadata.targetType !== Object)
            && (value instanceof paramMetadata.targetType);

        if (isValidationEnabled && shouldValidate) {
            const options = paramMetadata.validate instanceof Object ? paramMetadata.validate : this.driver.validationOptions;
            return validate(value, options)
                .then(() => value)
                .catch((validationErrors: ValidationError[]) => {
                    // todo better error
                    const error: any = new RpcError(400, `Invalid ${paramMetadata.type}, check 'errors' property for more info.`);
                    error.errors = validationErrors;
                    error.paramName = paramMetadata.name;
                    throw error;
                });
        }

        return value;
    }

}
