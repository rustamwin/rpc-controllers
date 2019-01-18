import {getMetadataArgsStorage} from "../index";

export function Method(name: string) {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().actions.push({
            type: "get",
            target: object.constructor,
            method: methodName,
            route: name
        });
    };
}