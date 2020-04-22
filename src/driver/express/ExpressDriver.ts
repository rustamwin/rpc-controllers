import {MethodMetadata} from "../../metadata/MethodMetadata";
import {Action} from "../../Action";
import {ParamMetadata} from "../../metadata/ParamMetadata";
import {BaseDriver} from "../BaseDriver";
import {MethodNotAllowedError} from "../../http-error/MethodNotAllowedError";
import {MethodNotFoundError} from "../../rpc-error/MethodNotFoundError";
import {ParseError} from "../../rpc-error/ParseError";
import {InvalidRequestError} from "../../rpc-error/InvalidRequestError";
import {Request} from "../../Request";
import {runInSequence} from "../../helpers/runInSequence";
import {InvalidParamsError} from "../../rpc-error/InvalidParamsError";

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
                response.json(executeCallback(new ParseError(), request.body));
            }
        });

        // prepare route and route handler function
        const route = this.routePrefix + "*";

        const callbackExecutor = (body: Request, action: Action) => {
            const method: MethodMetadata = methods.find((methodMetadata) => methodMetadata.fullName === body.method);
            if (!body || (typeof body === "string" && !JSON.parse(body))) {

                return executeCallback(new ParseError(), body, method);
            } else if (!body.params || (typeof body.method !== "string")) {

                return executeCallback(new InvalidRequestError(), body, method);
            } else if (!body.method || !method) {

                return executeCallback(new MethodNotFoundError(), body, method);
            } else if ((body.params instanceof Array && body.params.length < 1)
                || (body.params instanceof Object && Object.keys(body.params).length < 1)) {

                return executeCallback(new InvalidParamsError(), body, method);
            }

            return executeCallback(null, body, method).then(result => body.id ? result : undefined);
        };

        const routeHandler = async function routeHandler(request: any, response: any, next: Function) {
            const action = {request, response, next};
            if (request.method.toLowerCase() !== "post") {
                throw new MethodNotAllowedError();
            }

            if (request.body instanceof Array) {
                if (!request.body.length)
                    executeCallback(new InvalidRequestError(), request.body).then(result => response.json(result));
                let results = await runInSequence(request.body, (body: Request) => callbackExecutor(body, action));
                results = results.filter((result) => result);
                response.json(results);
            } else {
                callbackExecutor(request.body, action).then(result => result ? response.json(result) : undefined); // todo: refactor
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

        // transform result if needed
        result = this.transformResult(result, method, request);

        if (result === null || result === undefined) { // send null response
            return null;
        } else { // send regular result
            return {
                jsonrpc: "2.0",
                id: request.id,
                result: result
            };
        }
    }

    /**
     * Handles result of failed executed controller method.
     */
    handleError(error: any, request: Request): any {

        // send error content
        return {
            jsonrpc: "2.0",
            id: error instanceof MethodNotFoundError ? request.id : null,
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
