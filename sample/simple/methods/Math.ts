import {Controller} from "../../../src/decorator/Controller";
import {Method} from "../../../src/decorator/Method";
import {Params} from "../../../src/decorator/Params";

@Controller("math")
export class Test {

    @Method("add")
    foo(@Params() params: Array<number>) {
        // console.log(params);
        return params.reduce((prev, curr) => prev + curr);
    }

    @Method("hello")
    hello(@Params() params: any) {
        console.log(params);
        return "hi";
    }
}