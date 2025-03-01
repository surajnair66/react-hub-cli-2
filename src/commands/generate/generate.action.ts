import fs from "fs-extra";
import path from "node:path";
import { AppGenerator } from "../../generators/app.generator";
import { CRUDGenerator } from "../../generators/pages-generator/crud.generator";
import { LoginGenerator } from "../../generators/pages-generator/login.generator";
import { RoutesGenerator } from "../../generators/routes.generator";
import { AbstractAction, Input } from "../../lib/abstract";
import { TAuthPage, TListingPage, TRequirement } from "../../lib/types";
import { error } from "../../lib/ui/prefixes";
import { Route } from "../create-routes/create-routes.action";

export class GenerateAction extends AbstractAction {
  public async handle(inputs: Input[], options?: Input[], extraFlags?: string[]): Promise<void> {
    try {
      const pathName: string = this.getValue(inputs, "path") as string;
      if (path.extname(pathName) !== ".json") throw new Error(`${path.extname(pathName)} extension not supported! (Supports: [ ".json" ])`);

      const jsonData: TRequirement = fs.readJsonSync(pathName, { encoding: "utf-8" });
      console.log("jsonData", jsonData);

      const appGenerator = new AppGenerator();
      await appGenerator.generate({ projectName: jsonData.app.name });

      const routes: Route[] = [];
      jsonData.modules.forEach((module) => {
        if (module.pages && module.pages.length > 0) {
          module.pages.forEach((page) => {
            if (page.route) {
              routes.push({
                path: page.route,
                isPrivate: page.isPrivate,
                type: page.type,
              });
            }
          });
        }
      });

      if (routes.length > 0) {
        const routeGenerator = new RoutesGenerator(routes, jsonData.app.apiEndpoint, jsonData.app.branding.logo);
        await routeGenerator.generate();
      }

      const authModule = jsonData.modules.find((module) => module.name === "auth");
      if (authModule) {
        for (const page of authModule.pages) {
          switch (page.name) {
            case "LoginPage":
              const loginGenerator = new LoginGenerator(page as TAuthPage);
              await loginGenerator.generate();
              break;
            default:
              break;
          }
        }
      }

      const otherModules = jsonData.modules.filter((module) => module.name !== "auth");
      for (const module of otherModules) {
        const createCommonComponents = module.name === otherModules[0].name;

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
