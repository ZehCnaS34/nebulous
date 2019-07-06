import { Service } from "nebulous";

function main() {
  new Service("gateway", 4545)
    .register("info", async (call, payload) => {
      const problems = await call("problems", "getProblems", {});
      const users = await call("users", "all", {});
      const users2 = await call("users", "all", {});
      console.log({ problems, users, payload, users2 });
      return {
        debug: true
      };
    })
    .start();
}

main();
