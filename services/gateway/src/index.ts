// import { Service } from "./service";
import { Service } from "nebulous";

function main() {
  let problemsService = new Service("gateway");
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
