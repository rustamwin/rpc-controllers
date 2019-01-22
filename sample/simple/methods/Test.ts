import {Controller} from "../../../src/decorator/Controller";
import {Method} from "../../../src/decorator/Method";
import {Params} from "../../../src/decorator/Params";
import {MethodNotFoundError} from "../../../src/rpc-error/MethodNotFoundError";

@Controller()
export class Test {

    @Method("foo")
    foo(@Params() params: any) {
        console.log(params);
        throw new MethodNotFoundError("fasfsfsa");
    }

    @Method("hello")
    hello(@Params() params: any) {
        console.log(params);
        return "hi";
    }
}