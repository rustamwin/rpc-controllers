import {MethodMetadata} from "../../metadata/MethodMetadata";
import {Action} from "../../Action";
import {ParamMetadata} from "../../metadata/ParamMetadata";
import {BaseDriver} from "../BaseDriver";
import {MethodNotAllowedError} from "../../http-error/MethodNotAllowedError";
import {MethodNotFoundError} from "../../rpc-error/MethodNotFoundError";
import {ParseError} from "../../rpc-error/ParseError";
import {InvalidRequestError} from "../../rpc-error/InvalidRequestError";
import {Request} from "../../Request";

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
    registerMethods(methods: MethodMetadata[], executeCallback: (error: any, action: Request, method?: MethodMetadata) => Promise<any>): void {

        // middlewares required for this method
        const defaultMiddlewares: any[] = [];

        defaultMiddlewares.push(this.loadBodyParser().json());

        defaultMiddlewares.push(function (err: any, request: any, response: any, next: Function) {
            if (err) {
                console.log(err);
                response.json(executeCallback(new ParseError(), request.body));
            }
        });

        // prepare route and route handler function
        const route = this.routePrefix + "*";

        const callbackExecutor = (body: Request, action: Action) => {
            const method: MethodMetadata = methods.find((methodMetadata) => methodMetadata.fullName === body.method);
            if (!body || typeof body !== "object") {

                return executeCallback(new ParseError(), body, method);
            } else if (!body.params) {

                return executeCallback(new InvalidRequestError(), body, method);
            } else if (!body.method || !method) {

                return executeCallback(new MethodNotFoundError(), body, method);
            }

            return executeCallback(null, body, method);
        };

        const routeHandler = async function routeHandler(request: any, response: any, next: Function) {
            const action = {request, response, next};
            // todo batch requests
            if (request.method.toLowerCase() !== "post") {
                throw new MethodNotAllowedError();
            }

            if (request.body instanceof Array) {
                const results: any[] = await Promise.all(request.body.map((body: Request) => callbackExecutor(body, action)));
                response.json(results);
            } else {
                callbackExecutor(request.body, action).then(result => response.json(result));
            }
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
    getParamFromRequest(request: Request, param: ParamMetadata): any {
        switch (param.type) {
            case "request-id":
                return request.id;

            case "method":
                return request.method;

            case "param":
                return request.params[param.name];

            case "params":
                return request.params;

        }
    }

    /**
     * Handles result of successfully executed controller action.
     */
    handleSuccess(result: any, method: MethodMetadata, request: Request): object {
        // if the method returned the response object itself, short-circuits
        /*if (result && result === action.response) {
            action.next();
            return;
        }*/

        // transform result if needed
        result = this.transformResult(result, method, request);

        if (result === undefined) { // throw NotFoundError on undefined response
            // todo send error

        } else if (result === null) { // send null response
            // todo send null response
            return null;
        } else { // send regular result
            return {
                jsonrpc: "2.0",
                id: request.id,
                result: result
            };
            // action.next();
        }
    }

    /**
     * Handles result of failed executed controller method.
     */
    handleError(error: any, request: Request): any {

        // send error content
        return {
            jsonrpc: "2.0",
            id: null,
            error: this.processJsonError(error),
        };
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
