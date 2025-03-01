import { Command } from "commander";
import { AbstractLayout } from "../../lib/abstract";

export class CreateRoutesLayout extends AbstractLayout {
  public load(program: Command): void {
    program
      .command("create-routes")
      .alias("cr")
      .description("Create new routes for the application")
      .argument("<route-names>", "Names of the route separated by space")
      .action(async (routeName: string, command: Command) => {
        const input = [{ name: "route-name", value: routeName }];
        await this.action.handle(input);
      });
  }
}
