import { Command } from "commander";
import { error } from "../lib/ui/prefixes";
import { CreateAppAction } from "./create-app/create-app.action";
import { CreateAppLayout } from "./create-app/create-app.layout";
import { CreateCRUDAction } from "./create-crud/create-crud.action";
import { CreateCRUDLayout } from "./create-crud/create-crud.layout";
import { CreateLoginAction } from "./create-login/create-login.action";
import { CreateLoginLayout } from "./create-login/create-login.layout";
import { CreateRoutesAction } from "./create-routes/create-routes.action";
import { CreateRoutesLayout } from "./create-routes/create-routes.layout";
import { GenerateAction } from "./generate/generate.action";
import { GenerateLayout } from "./generate/generate.layout";
import { InfoAction } from "./info/info.action";
import { InfoLayout } from "./info/info.layout";

export class CommandLoader {
  public static async load(program: Command): Promise<void> {
    new InfoLayout(new InfoAction()).load(program);
    new CreateAppLayout(new CreateAppAction()).load(program);
    new CreateRoutesLayout(new CreateRoutesAction()).load(program);
    new CreateLoginLayout(new CreateLoginAction()).load(program);
    new CreateCRUDLayout(new CreateCRUDAction()).load(program);
    new GenerateLayout(new GenerateAction()).load(program);

    this.handleInvalidCommand(program);
  }

  private static handleInvalidCommand(program: Command) {
    program.on("command:*", () => {
      error(`Invalid command: ${program.args.join(" ")}`);
      process.exit(1);
    });
  }
}
