import { BaseDriver } from "./driver/BaseDriver";
import { ExpressDriver } from "./driver/express/ExpressDriver";
import { KoaDriver } from "./driver/koa/KoaDriver";
import { MetadataArgsStorage } from "./metadata-builder/MetadataArgsStorage";
import { Application } from "./Application";
import { ApplicationOptions } from "./ApplicationOptions";
import { ValidationOptions } from "class-validator";
import { importClassesFromDirectories } from "./helpers/importClassesFromDirectories";

// -------------------------------------------------------------------------
// Main exports
// -------------------------------------------------------------------------

export * from "./container";

export * from "./rpc-error/RpcError";
export * from "./rpc-error/InternalError";
export * from "./rpc-error/InvalidParamsError";
export * from "./rpc-error/InvalidRequestError";
export * from "./rpc-error/MethodNotFoundError";
export * from "./rpc-error/ParseError";
export * from "./rpc-error/ServerError";

export * from "./decorator/Controller";
export * from "./decorator/Method";
export * from "./decorator/RequestId";
export * from "./decorator/Params";
export * from "./decorator/Params";
export * from "./decorator/Param";
export * from "./decorator-options/ParamOptions";

export * from "./metadata-builder/MetadataArgsStorage";
export * from "./metadata/MethodMetadata";
export * from "./metadata/ControllerMetadata";
export * from "./metadata/ParamMetadata";
export * from "./metadata/ResponseHandleMetadata";

export * from "./ApplicationOptions";
export * from "./Action";

export * from "./driver/BaseDriver";
export * from "./driver/express/ExpressDriver";
export * from "./driver/koa/KoaDriver";

// -------------------------------------------------------------------------
// Main Functions
// -------------------------------------------------------------------------

/**
 * Gets metadata args storage.
 * Metadata args storage follows the best practices and stores metadata in a global variable.
 */
export function getMetadataArgsStorage(): MetadataArgsStorage {
    if (!(global as any).rpcControllersMetadataArgsStorage)
        (global as any).rpcControllersMetadataArgsStorage = new MetadataArgsStorage();

    return (global as any).rpcControllersMetadataArgsStorage;
}

/**
 * Registers all loaded actions in your express application.
 */
export function useExpressServer<T>(expressApp: T, options?: ApplicationOptions): T {
    const driver = new ExpressDriver(expressApp);
    return createServer(driver, options);
}

/**
 * Registers all loaded actions in your express application.
 */
export function createExpressServer(options?: ApplicationOptions): any {
    const driver = new ExpressDriver();
    return createServer(driver, options);
}

/**
 * Registers all loaded actions in your koa application.
 */
export function useKoaServer<T>(koaApp: T, options?: ApplicationOptions): T {
    const driver = new KoaDriver(koaApp);
    return createServer(driver, options);
}

/**
 * Registers all loaded actions in your koa application.
 */
export function createKoaServer(options?: ApplicationOptions): any {
    const driver = new KoaDriver();
    return createServer(driver, options);
}

/**
 * Registers all loaded actions in your application using selected driver.
 */
export function createServer<T extends BaseDriver>(driver: T, options?: ApplicationOptions): any {
    createExecutor(driver, options);
    return driver.app;
}

/**
 * Registers all loaded actions in your express application.
 */
export function createExecutor<T extends BaseDriver>(driver: T, options: ApplicationOptions = {}): void {

    // import all controllers and middlewares and error handlers (new way)
    let controllerClasses: Function[];
    if (options && options.controllers && options.controllers.length) {
        controllerClasses = (options.controllers as any[]).filter(controller => controller instanceof Function);
        const controllerDirs = (options.controllers as any[]).filter(controller => typeof controller === "string");
        controllerClasses.push(...importClassesFromDirectories(controllerDirs));
    }

    if (options && options.development !== undefined) {
        driver.developmentMode = options.development;
    } else {
        driver.developmentMode = process.env.NODE_ENV !== "production";
    }

    if (options.classTransformer !== undefined) {
        driver.useClassTransformer = options.classTransformer;
    } else {
        driver.useClassTransformer = true;
    }

    /*if (options.validation !== undefined) {
        driver.enableValidation = !!options.validation;
        if (options.validation instanceof Object)
            driver.validationOptions = options.validation as ValidationOptions;

    } else {
        driver.enableValidation = true;
    }*/

    driver.classToPlainTransformOptions = options.classToPlainTransformOptions;
    driver.plainToClassTransformOptions = options.plainToClassTransformOptions;

    if (options.routePrefix !== undefined)
        driver.routePrefix = options.routePrefix;

    driver.cors = options.cors;

    // next create a controller executor
    new Application(driver, options)
        .initialize()
        .registerControllers(controllerClasses);
}
