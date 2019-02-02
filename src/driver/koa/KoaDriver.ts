import {MethodMetadata} from "../../metadata/MethodMetadata";
import {Action} from "../../Action";
import {ParamMetadata} from "../../metadata/ParamMetadata";
import {BaseDriver} from "../BaseDriver";
import {MethodNotAllowedError} from "../../http-error/MethodNotAllowedError";
import {MethodNotFoundError} from "../../rpc-error/MethodNotFoundError";
import {ParseError} from "../../rpc-error/ParseError";
import {InvalidRequestError} from "../../rpc-error/InvalidRequestError";

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
        this.koa.use(bodyParser({
            enableTypes: ["json"]
        }));
        if (this.cors) {
            const cors = require("kcors");
            if (this.cors === true) {
                this.koa.use(cors({
                    origin: "POST"
                }));
            } else {
                this.koa.use(cors(this.cors));
            }
        }
    }

    /**
     * Registers action in the driver.
     */
    registerMethod(methods: MethodMetadata[], executeCallback: (error: any, action: Action, method?: MethodMetadata) => any): void {

        // prepare route and route handler function
        const route = this.routePrefix + "*";
        const errorHandler = async (request: any, next: Function) => {
            try {
                await next();
            } catch (e) {
                console.log(e);
            }
        };
        const routeHandler = (context: any, next: () => Promise<any>) => {
            const action: Action = {request: context.request, response: context.response, context, next};
            const method: MethodMetadata = methods.find((methodMetadata) => methodMetadata.fullName === action.request.body.method);
            try {
                if (action.request.method.toLowerCase() !== "post") {

                    return next();
                } else if (!action.request.body || typeof action.request.body !== "object") {

                    return executeCallback(new ParseError(), action, method);
                } else if (!action.request.body.params) {

                    return executeCallback(new InvalidRequestError(), action, method);
                } else if (!action.request.body.method || !method) {

                    return executeCallback(new MethodNotFoundError(), action, method);
                }

                return executeCallback(null, action, method);
            } catch (e) {
                return executeCallback(new ParseError(), action, method);
            }
        };

        // finally register action in koa
        this.router.all(...[
            route,
            errorHandler,
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

        if (result === undefined) { // throw NotFoundError on undefined response
            // todo send error

        } else if (result === null) { // send null response
            // todo send null response
            action.next();
        } else { // send regular result
            action.response.body = {
                jsonrpc: "2.0",
                id: action.request.body.id,
                result: result
            };
            action.next();
        }
    }

    /**
     * Handles result of failed executed controller action.
     */
    handleError(error: any, action: Action) {
        return new Promise((resolve, reject) => {
            if (true) {

                // send error content
                console.log("aasf");
                action.response.body = this.processJsonError(error);

                // todo set http status

                return resolve();
            }
            // return reject(error);
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
