import { Action } from "../Action";
import { MethodMetadataArgs } from "./args/MethodMetadataArgs";
import { ClassTransformOptions } from "class-transformer";
import { ControllerMetadata } from "./ControllerMetadata";
import { ParamMetadata } from "./ParamMetadata";
import { ResponseHandlerMetadata } from "./ResponseHandleMetadata";
import { ApplicationOptions } from "../ApplicationOptions";

/**
 * Method metadata.
 */
export class MethodMetadata {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * Method's controller.
     */
    controllerMetadata: ControllerMetadata;

    /**
     * Method's parameters.
     */
    params: ParamMetadata[];

    /**
     * Class on which's method this method is attached.
     */
    target: Function;

    /**
     * Object's method that will be executed on this method.
     */
    method: string;

    /**
     * Route to be registered for the method.
     */
    name: string | RegExp;

    /**
     * Full name to this method (includes controller base name).
     */
    fullName: string | RegExp;

    /**
     * Class-transformer options for the method response content.
     */
    responseClassTransformOptions: ClassTransformOptions;

    /**
     * Response headers to be set.
     */
    headers: { [name: string]: any };

    /**
     * Params to be appended to the method call.
     */
    appendParams?: (action: Action) => any[];

    /**
     * Special function that will be called instead of orignal method of the target.
     */
    methodOverride?: (methodMetadata: MethodMetadata, action: Action, params: any[]) => Promise<any> | any;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(controllerMetadata: ControllerMetadata, args: MethodMetadataArgs, private options: ApplicationOptions) {
        this.controllerMetadata = controllerMetadata;
        this.name = args.name;
        this.target = args.target;
        this.method = args.method;
        this.appendParams = args.appendParams;
        this.methodOverride = args.methodOverride;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds everything method metadata needs.
     * Method metadata can be used only after its build.
     */
    build(responseHandlers: ResponseHandlerMetadata[]) {
        const classTransformerResponseHandler = responseHandlers.find(handler => handler.type === "response-class-transform-options");

        if (classTransformerResponseHandler)
            this.responseClassTransformOptions = classTransformerResponseHandler.value;


        this.fullName = this.buildFullName();
        this.headers = this.buildHeaders(responseHandlers);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Builds full method name.
     */
    private buildFullName(): string | RegExp {
        if (this.name instanceof RegExp) {
            if (this.controllerMetadata.name) {
                return MethodMetadata.appendBaseName(this.controllerMetadata.name, this.name);
            }
            return this.name;
        }

        let paths: Array<string> = [];
        if (this.controllerMetadata.name) paths.push(this.controllerMetadata.name);
        if (this.name && typeof this.name === "string") paths.push(this.name);
        return paths.join(this.options.methodSeparator! || ".");
    }

    /**
     * Builds method response headers.
     */
    private buildHeaders(responseHandlers: ResponseHandlerMetadata[]) {
        const contentTypeHandler = responseHandlers.find(handler => handler.type === "content-type");

        const headers: { [name: string]: string } = {};

        if (contentTypeHandler)
            headers["Content-type"] = contentTypeHandler.value;

        const headerHandlers = responseHandlers.filter(handler => handler.type === "header");
        if (headerHandlers)
            headerHandlers.map(handler => headers[handler.value] = handler.secondaryValue);

        return headers;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Calls method method.
     * Method method is an method defined in a user controller.
     */
    callMethod(params: any[]) {
        const controllerInstance = this.controllerMetadata.instance;
        return controllerInstance[this.method].apply(controllerInstance, params);
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Appends base name to a given regexp name.
     */
    static appendBaseName(baseName: string, name: RegExp | string) {
        const prefix = `${baseName.length > 0 && baseName.indexOf("/") < 0 ? "/" : ""}${baseName}`;
        if (typeof name === "string")
            return `${prefix}${name}`;

        if (!baseName || baseName === "") return name;

        const fullPath = `^${prefix}${name.toString().substr(1)}?$`;

        return new RegExp(fullPath, name.flags);
    }

}