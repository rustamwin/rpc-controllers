import {MethodMetadata} from "./MethodMetadata";
import {ControllerMetadataArgs} from "./args/ControllerMetadataArgs";
import {getFromContainer} from "../container";
import {ResponseHandlerMetadata} from "./ResponseHandleMetadata";

/**
 * Controller metadata.
 */
export class ControllerMetadata {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * Controller methods.
     */
    methods: MethodMetadata[];

    /**
     * Indicates object which is used by this controller.
     */
    target: Function;

    /**
     * Base name for all methods registered in this controller.
     */
    name: string;

    /**
     * Controller type. Can be default or json-typed. Json-typed controllers operate with json requests and responses.
     */
    type: "default"|"json";

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    
    constructor(args: ControllerMetadataArgs) {
        this.target = args.target;
        this.name = args.name;
        this.type = args.type;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets instance of the controller.
     */
    get instance(): any {
        return getFromContainer(this.target);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds everything controller metadata needs.
     * Controller metadata should be used only after its build.
     */
    build(responseHandlers: ResponseHandlerMetadata[]) {
        const authorizedHandler = responseHandlers.find(handler => handler.type === "authorized" && !handler.method);
    }

}