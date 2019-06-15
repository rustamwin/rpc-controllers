import {MethodMetadata} from "../../metadata/MethodMetadata";
import {Request} from "../../Request";
import {ParamMetadata} from "../../metadata/ParamMetadata";
import {BaseDriver} from "../BaseDriver";
import {MethodNotFoundError} from "../../rpc-error/MethodNotFoundError";
import {ParseError} from "../../rpc-error/ParseError";
import {InvalidRequestError} from "../../rpc-error/InvalidRequestError";
import {Action} from "../../Action";

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
    registerMethods(methods: MethodMetadata[], executeCallback: (error: any, action: Request, method?: MethodMetadata) => any): void {

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

                    return executeCallback(new ParseError(), context.request.body, method);
                } else if (!action.request.body.params) {

                    return executeCallback(new InvalidRequestError(), context.request.body, method);
                } else if (!action.request.body.method || !method) {

                    return executeCallback(new MethodNotFoundError(), context.request.body, method);
                }

                return executeCallback(null, context.request.body, method);
            } catch (e) {
                return executeCallback(new ParseError(), context.request.body, method);
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
    getParamFromRequest(request: Request, param: ParamMetadata): any {
        switch (param.type) {
            case "method":
                return request.method;

            case "request-id":
                return request.id;

            case "param":
                return request.params[param.name];

            case "params":
                return request.params;

        }
    }

    /**
     * Handles result of successfully executed controller action.
     */
    handleSuccess(result: any, method: MethodMetadata, action: Request): object {

        // if the action returned the context or the response object itself, short-circuits
        /*if (result && (result === action.response || result === action.context)) {
            return action.next();
        }*/

        // transform result if needed
        result = this.transformResult(result, method, action);

        if (result === undefined) { // throw NotFoundError on undefined response

        }
        // todo send null response

        // todo set http status code


        if (result === undefined) { // throw NotFoundError on undefined response
            // todo send error

        } else if (result === null) { // send null response
            // todo send null response
            return null;
        } else { // send regular result
            return {
                jsonrpc: "2.0",
                id: action.id,
                result: result
            };
        }
    }

    /**
     * Handles result of failed executed controller action.
     */
    handleError(error: any, action: Request) {
        return new Promise((resolve, reject) => {
            if (true) {

                // send error content
                console.log("aasf");
                const body = this.processJsonError(error);

                // todo set http status

                return resolve(body);
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
