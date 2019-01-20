import "reflect-metadata";
import {createExpressServer} from "../../src";

const app = createExpressServer({
    controllers: [__dirname + "/methods/*{.js,.ts}"]
});

app.listen(3000);

console.log("Server started");