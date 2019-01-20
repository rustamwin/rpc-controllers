import {Controller} from "../../../src/decorator/Controller";
import {Method} from "../../../src/decorator/Method";
import {Params} from "../../../src/decorator/Params";

@Controller()
export class Test {

    @Method("foo")
    foo(@Params() params: any) {
        console.log(params);
        return "bar";
    }

    @Method("hello")
    hello(@Params() params: any) {
        console.log(params);
        return "hi";
    }
}