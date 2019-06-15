import {BaseDriver} from "./driver/BaseDriver";
import {isPromiseLike} from "./helpers/isPromiseLike";
import {MethodParamsHandler} from "./MethodParamsHandler";
import {MetadataBuilder} from "./metadata-builder/MetadataBuilder";
import {MethodMetadata} from "./metadata/MethodMetadata";
import {Action} from "./Action";
import {ApplicationOptions} from "./ApplicationOptions";
import {MethodNotFoundError} from "./rpc-error/MethodNotFoundError";
import {Request} from "./Request";

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
        const methods: MethodMetadata[] = [];
        const controllers = this.metadataBuilder.buildControllerMetadata(classes);
        controllers.forEach(controller => {
            methods.push(...controller.methods);
        });
        this.driver.registerMethods(methods, (error: any, options: Request, methodMetadata?: MethodMetadata) => {
            if (error) {
                return this.driver.handleError(error, options);
            }
            return this.executeMethod(methodMetadata, options);
        });
        this.driver.registerRoutes();
        return this;
    }

    /**
     * Executes given controller method.
     */
    protected executeMethod(methodMetadata: MethodMetadata, request: Request) {

        // compute all params
        const paramsPromises = methodMetadata.params
            .sort((param1, param2) => param1.index - param2.index)
            .map(param => this.paramsHandler.handle(request, param));

        // after all params are computed
        return Promise.all(paramsPromises).then(params => {

            // execute method and handle result
            const result  = methodMetadata.callMethod(params);
            return this.handleCallMethodResult(result, methodMetadata, request);

        }).catch(error => {
            // otherwise simply handle error without method execution
            return this.driver.handleError(error, request);
        });
    }

    /**
     * Handles result of the method method execution.
     */
    protected handleCallMethodResult(result: any, method: MethodMetadata, request: Request): any {
        if (isPromiseLike(result)) {
            return result
                .then((data: any) => {
                    return this.handleCallMethodResult(data, method, request);
                })
                .catch((error: any) => {
                    return this.driver.handleError(error, request);
                });
        } else {

            return this.driver.handleSuccess(result, method, request);
        }
    }

}
