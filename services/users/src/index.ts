import { Service } from "nebulous";

function main() {
  let usersService = new Service("users", 5656);
  usersService.register("all", (caller, payload) => {
    return { users: [] };
  });
  usersService.start();
}

main();
