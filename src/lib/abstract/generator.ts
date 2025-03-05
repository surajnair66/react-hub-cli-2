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

  protected linearRgbToOklab(linearR: number, linearG: number, linearB: number): { L: number; a: number; b: number } {
    // Convert linear RGB to XYZ using sRGB matrix
    const X = 0.4122214708 * linearR + 0.5363325363 * linearG + 0.0514459929 * linearB;
    const Y = 0.2119034982 * linearR + 0.6806995451 * linearG + 0.1073969566 * linearB;
    const Z = 0.0883024619 * linearR + 0.2817188376 * linearG + 0.6299787005 * linearB;

    // Convert XYZ to OKLAB
    const l = Math.cbrt(X);
    const m = Math.cbrt(Y);
    const s = Math.cbrt(Z);

    return {
      L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    };
  }

  protected srgbToLinear(x: number): number {
    if (x <= 0.04045) {
      return x / 12.92;
    } else {
      return Math.pow((x + 0.055) / 1.055, 2.4);
    }
  }

  protected hexToOklch(hex: string): string {
    if (!hex) {
      throw new Error("Hex color string cannot be empty");
    }

    // Remove the # if present
    hex = hex.replace(/^#/, "");

    // Handle shorthand hex (#RGB or #RGBA)
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }

    // Validate hex string
    if (!/^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) {
      throw new Error("Invalid hex color format");
    }

    // Parse the hex value to RGB (ignore alpha if present)
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Convert sRGB to linear RGB
    const linearR = this.srgbToLinear(r);
    const linearG = this.srgbToLinear(g);
    const linearB = this.srgbToLinear(b);

    // Convert linear RGB to OKLAB
    const { L, a, b: bValue } = this.linearRgbToOklab(linearR, linearG, linearB);

    // Convert OKLAB to OKLCH
    const C = Math.sqrt(a * a + bValue * bValue);

    // Handle achromatic colors (near zero chroma)
    // For colors very close to neutral gray, hue is meaningless and can be unstable
    let h = 0;
    if (C > 0.0001) {
      h = Math.atan2(bValue, a) * (180 / Math.PI);

      // Ensure hue is in the range [0, 360)
      if (h < 0) {
        h += 360;
      }
    }

    // Round values to avoid floating point precision issues
    // This is particularly important for values that should be zero
    const roundedL = Math.abs(L) < 1e-10 ? 0 : L;
    const roundedC = Math.abs(C) < 1e-10 ? 0 : C;

    const color = {
      l: roundedL,
      c: roundedC,
      h,
    };

    return `oklch(${color.l.toFixed(4)} ${color.c.toFixed(4)} ${color.h.toFixed(2)}deg)`;
  }
}
