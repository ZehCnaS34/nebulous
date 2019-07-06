import { Service } from "nebulous"

function main() {
  let problemsService = new Service("problems", 3434);
  problemsService.register("getProblems", (caller, payload) => {
    return { name: "something", difficulty: "something" };
  });
  problemsService.start();
}

main();
