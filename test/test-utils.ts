const jayson = require("jayson/promise");

export function assertRequest(ports: number[], method: string, params: Array<any> | object): void {
    const args = arguments.length;

    ports.forEach(port => {

        it("asserting port " + port, async () => {
            let unhandledRejection: Error = undefined;
            const rpcClient = jayson.client.http({port});
            const captureRejection = (e: Error) => {
                unhandledRejection = e;
            };
            process.on("unhandledRejection", captureRejection);

            try {
                let r;
                if (args === 3) {
                    r = await rpcClient.request(method, params);
                }
                else {
                    throw new Error("No assertion has been performed");
                }

                if (unhandledRejection) {
                    const e = new Error("There was an unhandled rejection while processing the request");
                    e.stack += "\nCaused by: " + unhandledRejection.stack;
                    throw e;
                }

                return r;
            }
            finally {
                process.removeListener("unhandledRejection", captureRejection);
            }
        });

    });

}