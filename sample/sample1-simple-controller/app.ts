import "reflect-metadata";
import {createExpressServer} from "../../src";
import {MathController} from "./controllers/MathController";

const app = createExpressServer({
    controllers: [MathController]
});

app.listen(3000);

console.log("Server started");
