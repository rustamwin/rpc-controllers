import {getMetadataArgsStorage} from "../index";
import {ParamsOptions} from "../decorator-options/ParamsOptions";

export function RequestId(options?: ParamsOptions) {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "request-id",
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