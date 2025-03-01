import fs from "fs-extra";
import path from "node:path";
import { LoginGenerator } from "../../generators/pages-generator/login.generator";
import { AbstractAction, Input } from "../../lib/abstract";
import { TAuthPage, TRequirement } from "../../lib/types";
import { error } from "../../lib/ui/prefixes";

export class CreateLoginAction extends AbstractAction {
  public async handle(inputs: Input[], options?: Input[], extraFlags?: string[]): Promise<void> {
    try {
      const pathName: string = this.getValue(inputs, "path") as string;
      if (path.extname(pathName) !== ".json") throw new Error(`${path.extname(pathName)} extension not supported! (Supports: [ ".json" ])`);

      const jsonData: TRequirement = fs.readJsonSync(pathName, { encoding: "utf-8" });

      const authModule = jsonData.modules.find((module) => module.name === "auth");
      if (authModule) {
        const loginPage = authModule.pages.find((page) => page.name === "LoginPage");
        if (loginPage) {
          const loginGenerator = new LoginGenerator(loginPage as TAuthPage);
          await loginGenerator.generate();
        }
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  }
}
