import {MethodMetadata} from "../../metadata/MethodMetadata";
import {Action} from "../../Action";
import {ParamMetadata} from "../../metadata/ParamMetadata";
import {BaseDriver} from "../BaseDriver";
import {MethodNotAllowedError} from "../../http-error/MethodNotAllowedError";
import {MethodNotFoundError} from "../../rpc-error/MethodNotFoundError";
import {ParseError} from "../../rpc-error/ParseError";
import {InvalidRequestError} from "../../rpc-error/InvalidRequestError";

/**
 * Integration with express framework.
 */
export class ExpressDriver extends BaseDriver {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(public express?: any) {
        super();
        this.loadExpress();
        this.app = this.express;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Initializes the things driver needs before routes and middlewares registration.
     */
    initialize() {
        if (this.cors) {
            const cors = require("cors");
            if (this.cors === true) {
                this.express.use(cors({
                    origin: "POST"
                }));
            } else {
                this.express.use(cors(this.cors));
            }
        }
    }

    /**
     * Registers action in the driver.
     */
    registerMethod(methods: MethodMetadata[], executeCallback: (error: any, action: Action, method?: MethodMetadata) => any): void {

        // middlewares required for this method
        const defaultMiddlewares: any[] = [];

        defaultMiddlewares.push(this.loadBodyParser().json());

        defaultMiddlewares.push(function (err: any, request: any, response: any, next: Function) {
            if (err) {
                return executeCallback(new ParseError(), {request, response, next});
            }
        });

        // prepare route and route handler function
        const route = this.routePrefix + "*";
        const routeHandler = function routeHandler(request: any, response: any, next: Function) {
            const action = {request, response, next};
            // todo batch requests

            const method: MethodMetadata = methods.find((methodMetadata) => methodMetadata.fullName === request.body.method);

            if (request.method.toLowerCase() !== "post") {

                return next(method, action, new MethodNotAllowedError());
            } else if (!request.body || typeof request.body !== "object") {

                return executeCallback(new ParseError(), action, method);
            } else if (!request.body.params) {

                return executeCallback(new InvalidRequestError(), action, method);
            } else if (!request.body.method || !method) {

                return executeCallback(new MethodNotFoundError(), action, method);
            }

            return executeCallback(null, action, method);
        };

        // finally register method in express
        this.express.use(...[
            route,
            ...defaultMiddlewares,
            routeHandler,
        ]);
    }

    /**
     * Registers all routes in the framework.
     */
    registerRoutes() {
    }

    /**
     * Gets param from the request.
     */
    getParamFromRequest(action: Action, param: ParamMetadata): any {
        const request: any = action.request;
        switch (param.type) {
            case "request-id":
                return request.body.id;

            case "method":
                return request.body.method;

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
        // if the method returned the response object itself, short-circuits
        if (result && result === action.response) {
            action.next();
            return;
        }

        // transform result if needed
        result = this.transformResult(result, method, action);

        // apply http headers
        Object.keys(method.headers).forEach(name => {
            action.response.header(name, method.headers[name]);
        });

        if (result === undefined) { // throw NotFoundError on undefined response
            // todo send error

        } else if (result === null) { // send null response
            // todo send null response
            action.next();
        }  else { // send regular result
            action.response.json({
                jsonrpc: "2.0",
                id: action.request.body.id,
                result: result
            });
            action.next();
        }
    }

    /**
     * Handles result of failed executed controller method.
     */
    handleError(error: any, action: Action): any {
        const response: any = action.response;

        // set http code
        // note that we can't use error instanceof HttpError properly anymore because of new typescript emit process

        // send error content
        response.json({
            jsonrpc: "2.0",
            id: null,
            error: this.processJsonError(error),
        });
    }

    /**
     * Dynamically loads express module.
     */
    protected loadExpress() {
        if (require) {
            if (!this.express) {
                try {
                    this.express = require("express")();
                } catch (e) {
                    throw new Error("express package was not found installed. Try to install it: npm install express --save");
                }
            }
        } else {
            throw new Error("Cannot load express. Try to install all required dependencies.");
        }
    }

    /**
     * Dynamically loads body-parser module.
     */
    protected loadBodyParser() {
        try {
            return require("body-parser");
        } catch (e) {
            throw new Error("body-parser package was not found installed. Try to install it: npm install body-parser --save");
        }
    }

}
