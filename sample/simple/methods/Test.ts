import {Controller} from "../../../src/decorator/Controller";
import {Method} from "../../../src/decorator/Method";
import {Params} from "../../../src/decorator/Params";
import {RequestId} from "../../../src/decorator/RequestId";
import {Param} from "../../../src/decorator/Param";

@Controller()
export class Test {

    @Method("hello")
    async foo(@Params() params: Array<number> | object) {
        console.log(params);
        return Promise.resolve(params);
    }

    @Method("hello")
    hello(@Param("a") params: any, @RequestId() id: number) {
        console.log(params, id);
        return {"hi from id": id};
    }
}