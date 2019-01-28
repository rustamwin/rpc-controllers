import {getMetadataArgsStorage} from "../index";
import {ParamOptions} from "../decorator-options/ParamOptions";

export function Params(options?: ParamOptions): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "params",
            object: object,
            method: methodName,
            index: index,
            parse: false,
            required: options ? options.required : undefined,
            classTransform: options ? options.transform : undefined,
            validate: options ? options.validate : undefined,
            explicitType: options ? options.type : undefined,
            extraOptions: options ? options.options : undefined
        });
    };
}