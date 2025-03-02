import { exec, execSync, spawn } from "child_process";
import fs from "fs-extra";
import handlebars from "handlebars";
import path from "path";
import prettier from "prettier";
import { promisify } from "util";
import { WORK_DIR } from "../..";

const execPromise = promisify(exec);

export abstract class AbstractGenerator {
  constructor() {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    handlebars.registerHelper("properCase", function (str) {
      if (!str || typeof str !== "string") return "";
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    handlebars.registerHelper("eq", function (a, b) {
      return a === b;
    });

    handlebars.registerHelper("graphqlQuery", function (queryString) {
      if (!queryString || typeof queryString !== "string") return "";
      // Return the query string as-is, without any processing
      return queryString;
    });
  }

  protected async convertTemplate(hbsPath: string, newFilePath: string, data?: Record<string, any>) {
    const commonPrettierConfig = {
      printWidth: 150,
      tabWidth: 2,
      singleQuote: true,
      jsxSingleQuote: true,
    };

    const template = handlebars.compile(fs.readFileSync(WORK_DIR + hbsPath, "utf-8"));
    const fileExtension = newFilePath.split(".").pop();

    if (fileExtension === "ts" || fileExtension === "tsx") {
      const content = template(data || {});

      if (newFilePath.includes("/graphql/")) {
        fs.outputFileSync(newFilePath, content);
      } else {
        const formattedData = await prettier.format(content, {
          parser: "typescript",
          ...commonPrettierConfig,
        });
        fs.outputFileSync(newFilePath, formattedData);
      }
    } else if (fileExtension === "json") {
      const formattedData = await prettier.format(template(data || {}), {
        parser: "json",
        ...commonPrettierConfig,
      });
      console.log("formattedData", formattedData);
      fs.outputFileSync(newFilePath, formattedData);
    } else {
      fs.outputFileSync(newFilePath, template(data || {}));
    }
  }

  protected async commit(commitMessage?: string) {
    await execPromise(`git add . && git commit -m "${commitMessage || "initial commit"}" --no-verify`);
  }

  protected async installDependencies(projectPath: string, dependencies: string[], isDev: boolean = false): Promise<void> {
    const devFlag = isDev ? "--save-dev" : "--save";
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

    try {
      const args = ["install", devFlag, ...dependencies];

      const child = spawn(npmCommand, args, {
        cwd: path.resolve(process.cwd(), projectPath),
        stdio: "inherit",
        shell: true,
      });

      return new Promise((resolve, reject) => {
        child.on("error", (error) => {
          console.error(`Failed to execute npm install: ${error.message}`);
          reject(error);
        });

        child.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`npm install exited with code ${code}`));
            return;
          }
          resolve();
        });
      });
    } catch (error) {
      console.error("Error installing dependencies:", error);
      throw error;
    }
  }

  protected async addShadCnComponents(components: string[]): Promise<void> {
    console.log("Adding ShadCn components");

    const componentsDir = path.join("src", "components", "ui");
    const componentsToAdd: string[] = [];

    for (const component of components) {
      const componentPath = path.join(componentsDir, `${component}.tsx`);
      try {
        await fs.access(componentPath);
      } catch (error) {
        componentsToAdd.push(component);
      }
    }

    if (componentsToAdd.length > 0) {
      const command = `npx shadcn@latest add ${componentsToAdd.join(" ")}`;
      try {
        execSync(command, { stdio: "inherit" });
      } catch (error) {
        console.error(`Error executing command: ${error}`);
      }
    } else {
      console.log("All components are already present. No command executed.");
    }
  }

  protected async codgenCompile(): Promise<void> {
    execSync("npm run compile");
  }
}
