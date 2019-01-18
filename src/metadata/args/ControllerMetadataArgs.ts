/**
 * Controller metadata used to storage information about registered controller.
 */
export interface ControllerMetadataArgs {

    /**
     * Indicates object which is used by this controller.
     */
    target: Function;

    /**
     * Base name for all actions registered in this controller.
     */
    name: string;

    /**
     * Controller type. Can be default or json-typed. Json-typed controllers operate with json requests and responses.
     */
    type: "default"|"json";
    
}