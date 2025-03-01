import { Command } from "commander";
import { AbstractLayout } from "../../lib/abstract";

export class InfoLayout extends AbstractLayout {
  public load(program: Command): void {
    program
      .command("info")
      .alias("i")
      .description("Get system information and React Hub CLI information")
      .action(async () => await this.action.handle());
  }
}
