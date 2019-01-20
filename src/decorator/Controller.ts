import { getMetadataArgsStorage } from "../index";

export function Controller(baseName?: string): Function {
    return function (object: Function) {
        getMetadataArgsStorage().controllers.push({
            name: baseName,
            target: object
        });
    };
}