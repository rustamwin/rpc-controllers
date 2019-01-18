import { MethodMetadata } from "../metadata/MethodMetadata";
import { ControllerMetadata } from "../metadata/ControllerMetadata";
import { ParamMetadata } from "../metadata/ParamMetadata";
import { ParamMetadataArgs } from "../metadata/args/ParamMetadataArgs";
import { ResponseHandlerMetadata } from "../metadata/ResponseHandleMetadata";
import { ApplicationOptions } from "../ApplicationOptions";
import { getMetadataArgsStorage } from "../index";

/**
 * Builds metadata from the given metadata arguments.
 */
export class MetadataBuilder {

    constructor(private options: ApplicationOptions) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds controller metadata from a registered controller metadata args.
     */
    buildControllerMetadata(classes?: Function[]) {
        return this.createControllers(classes);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates controller metadatas.
     */
    protected createControllers(classes?: Function[]): ControllerMetadata[] {
        const controllers = !classes ? getMetadataArgsStorage().controllers : getMetadataArgsStorage().filterControllerMetadatasForClasses(classes);
        return controllers.map(controllerArgs => {
            const controller = new ControllerMetadata(controllerArgs);
            controller.build(this.createControllerResponseHandlers(controller));
            controller.methods = this.createMethods(controller);
            return controller;
        });
    }

    /**
     * Creates method metadatas.
     */
    protected createMethods(controller: ControllerMetadata): MethodMetadata[] {
        return getMetadataArgsStorage()
            .filterMethodsWithTarget(controller.target)
            .map(methodArgs => {
                const method = new MethodMetadata(controller, methodArgs, this.options);
                method.params = this.createParams(method);
                method.build(this.createMethodResponseHandlers(method));
                return method;
            });
    }

    /**
     * Creates param metadatas.
     */
    protected createParams(method: MethodMetadata): ParamMetadata[] {
        return getMetadataArgsStorage()
            .filterParamsWithTargetAndMethod(method.target, method.method)
            .map(paramArgs => new ParamMetadata(method, this.decorateDefaultParamOptions(paramArgs)));
    }

    /**
     * Decorate paramArgs with default settings
     */
    private decorateDefaultParamOptions(paramArgs: ParamMetadataArgs) {
        let options = this.options.defaults && this.options.defaults.paramOptions;
        if (!options)
            return paramArgs;

        if (paramArgs.required === undefined)
            paramArgs.required = options.required || false;

        return paramArgs;
    }

    /**
     * Creates response handler metadatas for method.
     */
    protected createMethodResponseHandlers(method: MethodMetadata): ResponseHandlerMetadata[] {
        return getMetadataArgsStorage()
            .filterResponseHandlersWithTargetAndMethod(method.target, method.method)
            .map(handlerArgs => new ResponseHandlerMetadata(handlerArgs));
    }

    /**
     * Creates response handler metadatas for controller.
     */
    protected createControllerResponseHandlers(controller: ControllerMetadata): ResponseHandlerMetadata[] {
        return getMetadataArgsStorage()
            .filterResponseHandlersWithTarget(controller.target)
            .map(handlerArgs => new ResponseHandlerMetadata(handlerArgs));
    }

}
