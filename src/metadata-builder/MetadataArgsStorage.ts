import {ControllerMetadataArgs} from "../metadata/args/ControllerMetadataArgs";
import {MethodMetadataArgs} from "../metadata/args/MethodMetadataArgs";
import {ParamMetadataArgs} from "../metadata/args/ParamMetadataArgs";
import {ResponseHandlerMetadataArgs} from "../metadata/args/ResponseHandleMetadataArgs";

/**
 * Storage all metadatas read from decorators.
 */
export class MetadataArgsStorage {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * Registered controller metadata args.
     */
    controllers: ControllerMetadataArgs[] = [];

    /**
     * Registered action metadata args.
     */
    methods: MethodMetadataArgs[] = [];

    /**
     * Registered param metadata args.
     */
    params: ParamMetadataArgs[] = [];

    /**
     * Registered response handler metadata args.
     */
    responseHandlers: ResponseHandlerMetadataArgs[] = [];

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Filters registered controllers by a given classes.
     */
    filterControllerMetadatasForClasses(classes: Function[]): ControllerMetadataArgs[] {
        return this.controllers.filter(ctrl => {
            return classes.filter(cls => ctrl.target === cls).length > 0;
        });
    }

    /**
     * Filters registered methods by a given classes.
     */
    filterMethodsWithTarget(target: Function): MethodMetadataArgs[] {
        return this.methods.filter(action => action.target === target);
    }

    /**
     * Filters parameters by a given classes.
     */
    filterParamsWithTargetAndMethod(target: Function, methodName: string): ParamMetadataArgs[] {
        return this.params.filter(param => {
            return param.object.constructor === target && param.method === methodName;
        });
    }

    /**
     * Filters response handlers by a given class.
     */
    filterResponseHandlersWithTarget(target: Function): ResponseHandlerMetadataArgs[] {
        return this.responseHandlers.filter(property => {
            return property.target === target;
        });
    }

    /**
     * Filters response handlers by a given classes.
     */
    filterResponseHandlersWithTargetAndMethod(target: Function, methodName: string): ResponseHandlerMetadataArgs[] {
        return this.responseHandlers.filter(property => {
            return property.target === target && property.method === methodName;
        });
    }

    /**
     * Removes all saved metadata.
     */
    reset() {
        this.controllers = [];
        this.methods = [];
        this.params = [];
        this.responseHandlers = [];
    }

}