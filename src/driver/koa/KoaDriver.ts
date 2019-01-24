import {Action} from "../../Action";
import {MethodMetadata} from "../../metadata/MethodMetadata";
import {BaseDriver} from "../BaseDriver";
import {ParamMetadata} from "../../metadata/ParamMetadata";
import {error} from "util";

/**
 * Integration with koa framework.
 */
export class KoaDriver extends BaseDriver {

    constructor(public koa?: any, public router?: any) {
        super();
        this.loadKoa();
        this.loadRouter();
        this.app = this.koa;
    }

    /**
     * Initializes the things driver needs before routes and middleware registration.
     */
    initialize() {
        const bodyParser = require("koa-bodyparser");
        this.koa.use(bodyParser());
        if (this.cors) {
            const cors = require("kcors");
            if (this.cors === true) {
                this.koa.use(cors());
            } else {
                this.koa.use(cors(this.cors));
            }
        }
    }

    /**
     * Registers action in the driver.
     */
    registerMethod(methods: MethodMetadata[], executeCallback: (methodMetadata: MethodMetadata, action: Action, error: any) => any): void {

        // prepare route and route handler function
        const route = this.routePrefix + "*";
        const routeHandler = (context: any, next: () => Promise<any>) => {
            const action: Action = {request: context.request, response: context.response, context, next};
            const method = methods.find(method => method.fullName === action.request.method);
            return executeCallback(method, action, error);
        };

        // finally register action in koa
        this.router.use(...[
            route,
            routeHandler,
        ]);
    }

    /**
     * Registers all routes in the framework.
     */
    registerRoutes() {
        this.koa.use(this.router.routes());
        this.koa.use(this.router.allowedMethods());
    }

    /**
     * Gets param from the request.
     */
    getParamFromRequest(actionOptions: Action, param: ParamMetadata): any {
        const context = actionOptions.context;
        const request: any = actionOptions.request;
        switch (param.type) {
            case "method":
                return request.body.method;

            case "request-id":
                return request.body.id;

            case "param":
                return request.body.params[param.name];

            case "params":
                return request.body.params;

        }
    }

    /**
     * Handles result of successfully executed controller action.
     */
    handleSuccess(result: any, method: MethodMetadata, action: Action): void {

        // if the action returned the context or the response object itself, short-circuits
        if (result && (result === action.response || result === action.context)) {
            return action.next();
        }

        // transform result if needed
        result = this.transformResult(result, method, action);

        if (result === undefined) { // throw NotFoundError on undefined response

        }
        // todo send null response

        // todo set http status code

        // apply http headers
        Object.keys(method.headers).forEach(name => {
            action.response.set(name, method.headers[name]);
        });

        return action.next();
    }

    /**
     * Handles result of failed executed controller action.
     */
    handleError(error: any, action: Action) {
        return new Promise((resolve, reject) => {
            if (this.isDefaultErrorHandlingEnabled) {

                // send error content
                action.response.body = this.processJsonError(error);

                // todo set http status

                return resolve();
            }
            return reject(error);
        });
    }

    /**
     * Dynamically loads koa and required koa-router module.
     */
    protected loadKoa() {
        if (require) {
            if (!this.koa) {
                try {
                    this.koa = new (require("koa"))();
                } catch (e) {
                    throw new Error("koa package was not found installed. Try to install it: npm install koa@next --save");
                }
            }
        } else {
            throw new Error("Cannot load koa. Try to install all required dependencies.");
        }
    }

    /**
     * Dynamically loads koa-router module.
     */
    private loadRouter() {
        if (require) {
            if (!this.router) {
                try {
                    this.router = new (require("koa-router"))();
                } catch (e) {
                    throw new Error("koa-router package was not found installed. Try to install it: npm install koa-router@next --save");
                }
            }
        } else {
            throw new Error("Cannot load koa. Try to install all required dependencies.");
        }
    }

}