import { plainToClass } from "class-transformer";
import { Action } from "./Action";
import { BaseDriver } from "./driver/BaseDriver";
import { ParamMetadata } from "./metadata/ParamMetadata";
import { isPromiseLike } from "./helpers/isPromiseLike";
import {InvalidParamsError} from "./rpc-error/InvalidParamsError";
import {InvalidRequestError} from "./rpc-error/InvalidRequestError";

/**
 * Handles method params.
 */
export class MethodParamsHandler<T extends BaseDriver> {

    constructor(private driver: T) {
    }

    /**
     * Handles method parameter.
     */
    handle(action: Action, param: ParamMetadata): Promise<any> | any {

       /* if (param.type === "request")
            return action.request;

        if (param.type === "response")
            return action.response;

        if (param.type === "context")
            return action.context;
*/
        // get parameter value from request and normalize it
        const value = this.normalizeParamValue(this.driver.getParamFromRequest(action, param), param);
        if (isPromiseLike(value))
            return value.then(value => this.handleValue(value, action, param));

        return this.handleValue(value, action, param);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Handles non-promise value.
     */
    protected handleValue(value: any, action: Action, param: ParamMetadata): Promise<any> | any {

        // if transform function is given for this param then apply it
        if (param.transform)
            value = param.transform(action, value);

        // check cases when parameter is required but its empty and throw errors in this case
        if (param.required) {
            const isValueEmpty = value === null || value === undefined || value === "";
            const isValueEmptyObject = value instanceof Object && Object.keys(value).length === 0;

            if (param.type === "params" && !param.name && (isValueEmpty || isValueEmptyObject)) { // body has a special check and error message
                return Promise.reject(new InvalidParamsError("Params empty"));

            } else if (param.name && isValueEmpty) { // regular check for all other parameters // todo: figure out something with param.name usage and multiple things params (query params, upload files etc.)
                return Promise.reject(new InvalidParamsError());
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

            case "date":
                const parsedDate = new Date(value);
                if (isNaN(parsedDate.getTime())) {
                    return Promise.reject(new InvalidRequestError(`${param.name} is invalid! It can't be parsed to date.`));
                }
                return parsedDate;

            default:
                if (value && (param.parse || param.isTargetObject)) {
                    value = this.transformValue(value, param);
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

}
