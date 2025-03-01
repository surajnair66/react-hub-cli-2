import { Command } from "commander";
import { AbstractLayout } from "../../lib/abstract";

export class CreateLoginLayout extends AbstractLayout {
  public load(program: Command): void {
    program
      .command("create-login")
      .alias("clogin")
      .description("Create Login Page")
      .argument("[path]", "file path")
      .action(async (path: string, command: Command) => {
        const input = [{ name: "path", value: path }];
        await this.action.handle(input);
      });
  }
}
