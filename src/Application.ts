import { BaseDriver } from "./driver/BaseDriver";
import { isPromiseLike } from "./helpers/isPromiseLike";
import { MethodParamsHandler } from "./MethodParamsHandler";
import { MetadataBuilder } from "./metadata-builder/MetadataBuilder";
import { MethodMetadata } from "./metadata/MethodMetadata";
import { Method } from "./Method";
import { ApplicationOptions } from "./ApplicationOptions";

export class Application<T extends BaseDriver> {

    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    /**
     * Used to check and handle controller method params.
     */
    private paramsHandler: MethodParamsHandler<T>;

    /**
     * Used to build metadata objects for controllers and middlewares.
     */
    private metadataBuilder: MetadataBuilder;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private driver: T, private options: ApplicationOptions) {
        this.paramsHandler = new MethodParamsHandler(driver);
        this.metadataBuilder = new MetadataBuilder(options);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Initializes the things driver needs before routes and middleware registration.
     */
    initialize(): this {
        this.driver.initialize();
        return this;
    }

    /**
     * Registers all given controllers and methods from those controllers.
     */
    registerControllers(classes?: Function[]): this {
        const controllers = this.metadataBuilder.buildControllerMetadata(classes);
        controllers.forEach(controller => {
            controller.methods.forEach(methodMetadata => {
                this.driver.registerMethod(methodMetadata, (method: Method) => {
                    return this.executeMethod(methodMetadata, method);
                });
            });
        });
        this.driver.registerRoutes();
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Executes given controller method.
     */
    protected executeMethod(methodMetadata: MethodMetadata, method: Method) {

        // compute all params
        const paramsPromises = methodMetadata.params
            .sort((param1, param2) => param1.index - param2.index)
            .map(param => this.paramsHandler.handle(method, param));

        // after all params are computed
        return Promise.all(paramsPromises).then(params => {

            // execute method and handle result
            const allParams = methodMetadata.appendParams ? methodMetadata.appendParams(method).concat(params) : params;
            const result = methodMetadata.methodOverride ? methodMetadata.methodOverride(methodMetadata, method, allParams) : methodMetadata.callMethod(allParams);
            return this.handleCallMethodResult(result, methodMetadata, method);

        }).catch(error => {

            // otherwise simply handle error without method execution
            return this.driver.handleError(error, methodMetadata, method);
        });
    }

    /**
     * Handles result of the method method execution.
     */
    protected handleCallMethodResult(result: any, method: MethodMetadata, options: Method): any {
        if (isPromiseLike(result)) {
            return result
                .then((data: any) => {
                    return this.handleCallMethodResult(data, method, options);
                })
                .catch((error: any) => {
                    return this.driver.handleError(error, method, options);
                });
        } else {

            return this.driver.handleSuccess(result, method, options);
        }
    }

}