import fs from "fs-extra";
import path from "node:path";
import { CRUDGenerator } from "../../generators/pages-generator/crud.generator";
import { AbstractAction, Input } from "../../lib/abstract";
import { TListingPage, TRequirement } from "../../lib/types";
import { error } from "../../lib/ui/prefixes";

export class CreateCRUDAction extends AbstractAction {
  public async handle(inputs: Input[], options?: Input[], extraFlags?: string[]): Promise<void> {
    try {
      const pathName: string = this.getValue(inputs, "path") as string;
      if (path.extname(pathName) !== ".json") throw new Error(`${path.extname(pathName)} extension not supported! (Supports: [ ".json" ])`);

      const jsonData: TRequirement = fs.readJsonSync(pathName, { encoding: "utf-8" });

      const modules = jsonData.modules.filter((module) => module.name !== "auth");
      for (const module of modules) {
        const createCommonComponents = module.name === modules[0].name;
        for (const page of module.pages) {
          const crudGenerator = new CRUDGenerator(page as TListingPage, module.name);
          await crudGenerator.generate(createCommonComponents);
        }
      }
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  }
}
