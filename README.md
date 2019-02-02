# rpc-controllers

[![Build Status](https://travis-ci.org/rustamwin/rpc-controllers.svg?branch=master)](https://travis-ci.org/rustamwin/rpc-controllers)
[![npm version](https://badge.fury.io/js/rpc-controllers.svg)](https://badge.fury.io/js/rpc-controllers)
[![Dependency Status](https://david-dm.org/rustamwin/rpc-controllers.svg)](https://david-dm.org/rustamwin/rpc-controllers)

Allows to create controller classes with methods as JSON-RPC methods that handle [JSON-RPC 2.0][3] requests.
You can use rpc-controllers with [express.js][1] or [koa.js][2].

# Table of contents

 * [Installation](#installation)
 * [Example of usage](#example-of-usage)
 * [More examples](#more-usage-examples)
 
 
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

    **b. If you want to use rpc-controllers with *koa.js*, then install it and all required dependencies:**

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
    
3. Send a JSON-RPC 2.0 request to `http://localhost:3000` using the method `math.add` and the params `[1, 1]`. You will get the result `2`.

## More usage examples

#### Load all controllers from the given directory

```typescript
import "reflect-metadata"; // don't forget import this shim!
import {createExpressServer} from "rpc-controllers";

const app = createExpressServer({
  controllers: [__dirname + "/controllers/*.js"] // registers all given controllers
});

// run express application on port 3000
app.listen(3000);
```

#### Pre-configure express/koa

If you have, or if you want to create and configure express app separately,
you can use `useExpressServer` instead of `createExpressServer` function:

```typescript
import "reflect-metadata";
import {useExpressServer} from "rpc-controllers";
import {MathController} from "./MathController";

let express = require("express"); // or you can import it if you have installed typings
let app = express(); // your created express server
// app.use() // you can configure it the way you want
useExpressServer(app, { // register created express server in rpc-controllers
    controllers: [MathController] // and configure it the way you need (controllers, validation, etc.)
});
app.listen(3000); // run your express server
```

> Note: Koa driver is experimental

#### Using DI container

`rpc-controllers` supports a DI container out of the box.
You can inject your services into your controllers. Container must be setup during application bootstrap.
Here is example how to integrate rpc-controllers with [typedi][4]:

```typescript
import "reflect-metadata";
import {createExpressServer, useContainer} from "rpc-controllers";
import {Container} from "typedi";

// its important to set container before any operation you do with rpc-controllers,
// including importing controllers
useContainer(Container);

// create and run express server
let app = createExpressServer(3000, {
    controllers: [__dirname + "/controllers/*.js"],
});
```

That's it, now you can inject your services into your controllers:

```typescript
@Controller()
export class MessageController {

    constructor(private messageRepository: MessageRepository) {
    }

    // ... controller methods

}
```

[1]: http://expressjs.com/
[2]: http://koajs.com/
[3]: https://www.jsonrpc.org/specification
[4]: https://github.com/typestack/typedi
