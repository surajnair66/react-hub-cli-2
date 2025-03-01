import { Command } from "commander";
import { get } from "lodash";
import { AbstractLayout, Input } from "../../lib/abstract";

export class GenerateLayout extends AbstractLayout {
  public load(program: Command) {
    program
      .command("generate")
      .alias("g")
      .description("Generates a React project using JSON file containing the project structure")
      .argument("[path]", "file path")
      .option("--validate", "allows to validate the requirements to run project")
      .action(async (path: string, command: Command) => {
        const options: Input[] = [
          {
            name: "validate",
            value: get(command, "validate")!,
          },
        ];
        const inputs: Input[] = [
          {
            name: "path",
            value: path,
          },
        ];
        await this.action.handle(inputs, options);
      });
  }
}
