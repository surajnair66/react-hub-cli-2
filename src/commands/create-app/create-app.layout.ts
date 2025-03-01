import { Command } from "commander";
import { AbstractLayout } from "../../lib/abstract";

export class CreateAppLayout extends AbstractLayout {
  public load(program: Command): void {
    program
      .command("create-app")
      .alias("ca")
      .description("Create a new React app")
      .argument("<project-name>", "Name of the project")
      .action(async (projectName: string, command: Command) => {
        const input = [{ name: "project-name", value: projectName }];
        await this.action.handle(input);
      });
  }
}
