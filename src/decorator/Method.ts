import {getMetadataArgsStorage} from "../index";

export function Method(name: string) {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().methods.push({
            type: "get",
            target: object.constructor,
            method: methodName,
            name: name
        });
    };
}