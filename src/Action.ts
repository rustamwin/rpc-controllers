/**
 * Controller method properties.
 */
export interface Action {

    /**
     * Method Request object.
     */
    request: any;

    /**
     * Method Response object.
     */
    response: any;

    /**
     * Content in which method is executed.
     * Koa-specific property.
     */
    context?: any;

    /**
     * "Next" function used to call next middleware.
     */
    next?: Function;

}
