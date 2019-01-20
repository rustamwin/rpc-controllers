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

// export * from "./decorator/Authorized";
// export * from "./decorator/Body";
// export * from "./decorator/BodyParam";
// export * from "./decorator/ContentType";
// export * from "./decorator/Controller";
// export * from "./decorator/CookieParam";
// export * from "./decorator/CookieParams";
// export * from "./decorator/Ctx";
// export * from "./decorator/CurrentUser";
// export * from "./decorator/Delete";
// export * from "./decorator/Get";
// export * from "./decorator/Head";
// export * from "./decorator/Header";
// export * from "./decorator/HeaderParam";
// export * from "./decorator/HeaderParams";
// export * from "./decorator/HttpCode";
// export * from "./decorator/Interceptor";
// export * from "./decorator/JsonController";
// export * from "./decorator/Location";
// export * from "./decorator/Method";
// export * from "./decorator/Middleware";
// export * from "./decorator/OnNull";
// export * from "./decorator/OnUndefined";
// export * from "./decorator/Param";
// export * from "./decorator/Params";
// export * from "./decorator/Patch";
// export * from "./decorator/Post";
// export * from "./decorator/Put";
// export * from "./decorator/QueryParam";
// export * from "./decorator/QueryParams";
// export * from "./decorator/Redirect";
// export * from "./decorator/Render";
// export * from "./decorator/Req";
// export * from "./decorator/Res";
// export * from "./decorator/ResponseClassTransformOptions";
// export * from "./decorator/Session";
// export * from "./decorator/State";
// export * from "./decorator/UploadedFile";
// export * from "./decorator/UploadedFiles";
// export * from "./decorator/UseAfter";
// export * from "./decorator/UseBefore";
// export * from "./decorator/UseInterceptor";
//
// export * from "./decorator-options/BodyOptions";
// export * from "./decorator-options/ParamOptions";
// export * from "./decorator-options/UploadOptions";

export * from "./rpc-error/RpcError";
export * from "./rpc-error/ServerError";

export * from "./metadata-builder/MetadataArgsStorage";
export * from "./metadata/MethodMetadata";
export * from "./metadata/ControllerMetadata";
export * from "./metadata/ParamMetadata";
export * from "./metadata/ResponseHandleMetadata";

export * from "./ApplicationOptions";
export * from "./Method";

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
    if (!(global as any).tsRpcMetadataArgsStorage)
        (global as any).tsRpcMetadataArgsStorage = new MetadataArgsStorage();

    return (global as any).tsRpcMetadataArgsStorage;
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

    if (options.validation !== undefined) {
        driver.enableValidation = !!options.validation;
        if (options.validation instanceof Object)
            driver.validationOptions = options.validation as ValidationOptions;

    } else {
        driver.enableValidation = true;
    }

    driver.classToPlainTransformOptions = options.classToPlainTransformOptions;
    driver.plainToClassTransformOptions = options.plainToClassTransformOptions;

    if (options.routePrefix !== undefined)
        driver.routePrefix = options.routePrefix;

    driver.cors = options.cors;

    // next create a controller executor
    new Application(driver, options)
        .initialize()
        .registerControllers(controllerClasses);
    console.log(controllerClasses);
}
