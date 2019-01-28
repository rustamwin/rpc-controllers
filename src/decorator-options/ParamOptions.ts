import {ClassTransformOptions} from "class-transformer";
import {ValidationOptions} from "class-validator";

export interface ParamOptions {
    required?: boolean;
    transform?: ClassTransformOptions;
    validate?: boolean | ValidationOptions;
    type?: any;
    options?: any;
}