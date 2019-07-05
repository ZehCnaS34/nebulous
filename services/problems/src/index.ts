import { Service } from "./service";

function main() {
  let problemsService = new Service("problems");
  problemsService.register("/", (req, res) => {
    res.json([{ name: "something", difficulty: "something" }]);
  });
  problemsService.register("/:id", (req, res) => {
    res.json({
      name: "awesome",
      content: "this is the content"
    });
  });
}

main();
