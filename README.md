# rpc-controllers

[![Build Status](https://travis-ci.org/rustamwin/rpc-controllers.svg?branch=master)](https://travis-ci.org/rustamwin/rpc-controllers)
[![codecov](https://codecov.io/gh/rustamwin/rpc-controllers/branch/master/graph/badge.svg)](https://codecov.io/gh/rustamwin/rpc-controllers)
[![npm version](https://badge.fury.io/js/rpc-controllers.svg)](https://badge.fury.io/js/rpc-controllers)
[![Dependency Status](https://david-dm.org/rustamwin/rpc-controllers.svg)](https://david-dm.org/rustamwin/rpc-controllers)

Allows to create controller classes with methods as JSON-RPC methods that handle JSON-RPC requests.
You can use rpc-controllers with [express.js][1] or [koa.js][2].

# Table of contents

 * [Installation](#installation)
 * [Example of usage](#example-of-usage)
 
 
## Installation

1. Install module:

    `npm install rpc-controllers --save`

2. `reflect-metadata` shim is required:

    `npm install reflect-metadata --save`

    and make sure to import it before you use rpc-controllers:

    ```typescript
    import "reflect-metadata";
    ```

3. Install framework:

    **a. If you want to use rpc-controllers with *express.js*, then install it and all required dependencies:**

    `npm install express body-parser --save`

    Optionally you can also install their typings:

    `npm install @types/express @types/body-parser --save`

    **b. If you want to use rpc-controllers with *koa 2*, then install it and all required dependencies:**

    `npm install koa koa-router koa-bodyparser --save`

    Optionally you can also install their typings:

    `npm install @types/koa @types/koa-router @types/koa-bodyparser --save`

4. Its important to set these options in `tsconfig.json` file of your project:

    ```json
    {
     "emitDecoratorMetadata": true,
     "experimentalDecorators": true
    }
    ```
    
## Example of usage

1. Create a file `MathController.ts`

    ```typescript
    import {Controller, Method, Params} from "rpc-controllers";
    
    @Controller("math")
    export class MathController {
    
        @Method("add")
        add(@Params() params: Array<number>) {
            return params.reduce((prev, curr) => prev + curr);
        }
    
        @Method("test")
        test(@Params() params: any[]) {
            return params;
        }
    }
    ```
    
    This class will register JSON-PRC methods specified in method decorators in your server framework (express.js or koa).
    
2. Create a file `app.ts`

    ```typescript
    import "reflect-metadata"; // don't forget import this shim!
    import {createExpressServer} from "rpc-controllers";
    import {MathController} from "./MathController";

    // creates express app, registers all controller methods and returns you express app instance
    const app = createExpressServer({
       controllers: [MathController] // we specify controllers we want to use
    });

    // run express application on port 3000
    app.listen(3000);
    ```
    > if you are koa user you just need to use `createKoaServer` instead of `createExpressServer`
    
3. Open in browser `http://localhost:3000/users`. You will see `This action returns all users` in your browser.
If you open `http://localhost:3000/users/1` you will see `This action returns user #1`.