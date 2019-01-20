import {getMetadataArgsStorage} from "../index";

export function Method(name: string): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().methods.push({
            target: object.constructor,
            method: methodName,
            name: name
        });
    };
}