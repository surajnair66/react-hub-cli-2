import chalk from "chalk";
import { exec, execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import util from "util";
import { AbstractGenerator } from "../lib/abstract/generator";
import { TBranding } from "../lib/types";
import { info, success } from "../lib/ui/prefixes";

interface ProjectOptions {
  projectName: string;
  branding?: TBranding;
}

export class AppGenerator extends AbstractGenerator {
  constructor() {
    super();
  }

  async generate(options: ProjectOptions): Promise<void> {
    try {
      info(`Creating a new React project with Vite: ${chalk.yellow(options.projectName)}`);
      await this.initViteProject(options);

      info(`Installing additional dependencies`);
      await this.installAdditionalDependencies(options);

      info(`Configuring project`);
      await this.configureProject(options);

      info(`Updating existing configurations`);
      await this.updateConfigurations(options);

      info(`Adding template files`);
      await this.addTemplateFiles(options);

      info("Configuring Tailwind");
      await this.configureTailwind(options);

      info("Configuring Shadcn UI");
      await this.configureShadCnUI(options);

      info("Configuring Apollo Client");
      await this.configureApollo(options);

      info("Configuring basic routes");
      await this.configureRoutes(options);

      success(`✅ Project ${options.projectName} created successfully!`);
    } catch (error) {
      throw error;
    }
  }

  private async initViteProject(options: ProjectOptions): Promise<void> {
    const { projectName } = options;
    const command = `npm create vite@latest ${projectName} -- --template react-ts`;

    try {
      execSync(command, { stdio: "inherit" });
    } catch (error) {
      throw error;
    }
  }

  private async installAdditionalDependencies(options: ProjectOptions): Promise<void> {
    const dependencies: string[] = [
      "@apollo/client",
      "graphql",
      "react-hook-form",
      "@hookform/resolvers",
      "dayjs",
      "lodash",
      "zod",
      "react-router-dom",
      "sonner",
      "ldrs",
    ];
    const devDependencies: string[] = [
      "@vitejs/plugin-react-swc",
      "@commitlint/cli",
      "@commitlint/config-conventional",
      "@testing-library/jest-dom",
      "@typescript-eslint/eslint-plugin",
      "@typescript-eslint/parser",
      "@vitest/coverage-v8",
      "@types/lodash",
      "@vitest/ui",
      "commitizen",
      "commitlint-config-gitmoji",
      "cz-customizable",
      "eslint",
      "eslint-config-prettier",
      "eslint-import-resolver-typescript",
      "eslint-plugin-import",
      "eslint-plugin-prettier",
      "eslint-plugin-react",
      "eslint-plugin-react-hooks",
      "eslint-plugin-react-refresh",
      "jsdom",
      "prettier",
      "vitest",
      "husky",
      "@types/node",
      "@graphql-codegen/cli",
      "@graphql-codegen/client-preset",
      "@graphql-codegen/typescript",
      "@graphql-codegen/typescript-operations",
      "@graphql-codegen/typescript-react-apollo",
    ];

    await this.installDependencies(options.projectName, dependencies, false);
    await this.installDependencies(options.projectName, devDependencies, true);
  }

  private async configureProject(options: ProjectOptions): Promise<void> {
    const projectPath = path.resolve(process.cwd(), options.projectName);
    const directories = [
      "src/assets",
      "src/common",
      "src/components",
      "src/config/apollo",
      "src/helpers",
      "src/layout",
      "src/pages/home",
      "src/routes",
      "src/utils",
      "src/types",
      "src/lib",
      "src/vars",
      "tests",
    ];

    try {
      for (const dir of directories) {
        await fs.ensureDir(path.join(projectPath, dir));
      }
    } catch (error) {
      throw error;
    }
  }

  private async updateConfigurations(options: ProjectOptions): Promise<void> {
    const projectPath = path.resolve(process.cwd(), options.projectName);

    await this.updateViteConfig(projectPath, options);
    await this.updatePackageJson(projectPath, options);
  }

  private async updateViteConfig(projectPath: string, options: ProjectOptions): Promise<void> {
    const configPath = path.join(projectPath, `vite.config.ts`);

    try {
      let configContent = await fs.readFile(configPath, "utf-8");

      configContent = `import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
`;

      await fs.writeFile(configPath, configContent);
    } catch (error) {
      console.error("Error updating Vite config:", error);
      throw error;
    }
  }

  private async updatePackageJson(projectPath: string, options: ProjectOptions): Promise<void> {
    const packageJsonPath = path.join(projectPath, `package.json`);
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
      const packageObject = JSON.parse(packageJsonContent);

      const newPackageObject = {
        ...packageObject,
        scripts: {
          ...packageObject.scripts,
          prepare: "husky",
          commit: "git-cz",
          test: "vitest",
          "test:coverage": "vitest run --coverage",
          "test:ui": "vitest --ui",
          compile: "graphql-codegen",
          watch: "graphql-codegen -w",
        },
        config: {
          commitizen: {
            path: "./node_modules/cz-customizable",
          },
          "cz-customizable": {
            config: "./.cz-config.cjs",
          },
        },
        "lint-staged": {
          "src/**/*.{js,jsx,ts,tsx}": ["eslint src/**/*.{js,jsx,ts,tsx} --fix-dry-run", "prettier --write"],
        },
      };

      await fs.writeFile(packageJsonPath, JSON.stringify(newPackageObject, null, 2));
    } catch (error) {
      console.error("Error updating package.json:", error);
      throw error;
    }
  }

  private async addTemplateFiles(options: ProjectOptions): Promise<void> {
    try {
      process.chdir(options.projectName);
      await this.initializeGit();
      this.convertTemplate("/templates/config/.gitignore.hbs", `./.gitignore`);

      this.convertTemplate("/templates/config/eslint.config.hbs", "./eslint.config.js");
      this.convertTemplate("/templates/config/.prettierrc.hbs", `./.prettierrc.cjs`);
      this.convertTemplate("/templates/config/.cz-config.hbs", `./.cz-config.cjs`);
      this.convertTemplate("/templates/config/commitlint.config.hbs", `./commitlint.config.cjs`);
      this.convertTemplate("/templates/config/nvmrc.hbs", `./.nvmrc`);
      this.convertTemplate("/templates/config/npmrc.hbs", `./.npmrc`);

      fs.mkdirSync(`.vscode`, { recursive: true });
      this.convertTemplate("/templates/config/.vscode/extensions.hbs", `./.vscode/extensions.json`);
      this.convertTemplate("/templates/config/.vscode/settings.hbs", `./.vscode/settings.json`);

      await this.initializeHusky();
      this.convertTemplate("/templates/config/.husky/commit-msg.hbs", `./.husky/commit-msg`);
      this.convertTemplate("/templates/config/.husky/pre-commit.hbs", `./.husky/pre-commit`);
      await this.makeExecutable(".husky/*");

      info(`Committing all generated files`);
      await this.commit();

      process.chdir("..");
    } catch (error) {
      throw error;
    }
  }

  private async configureTailwind(options: ProjectOptions): Promise<void> {
    const dependencies = ["tailwindcss", "@tailwindcss/vite"];
    await this.installDependencies(options.projectName, dependencies, true);
  }

  private async configureShadCnUI(options: ProjectOptions): Promise<void> {
    process.chdir(options.projectName);

    await Promise.all([
      this.convertTemplate("/templates/config/tailwind/index.css.hbs", `./src/index.css`),
      this.convertTemplate("/templates/config/tsconfig.hbs", `./tsconfig.json`),
      this.convertTemplate("/templates/config/tsconfig.app.hbs", `./tsconfig.app.json`),
    ]);

    await this.initializeShadCn();

    await this.convertTemplate("/templates/config/shadcnui/index.css.hbs", `./src/index.css`, {
      primaryColor: options.branding?.primaryColor ? this.hexToOklch(options.branding.primaryColor) : "oklch(31.19% 0.0952 259.33)",
      secondaryColor: options.branding?.secondaryColor ? this.hexToOklch(options.branding.secondaryColor) : "oklch(0.967 0.001 286.375)",
    });

    info(`Committing all generated files`);
    await this.commit("WIP: Adding Shadcn UI and Tailwind CSS");
  }

  private async configureApollo(options: ProjectOptions): Promise<void> {
    await Promise.all([
      this.convertTemplate("/templates/config/apollo/apollo-config.ts.hbs", `./src/config/apollo/apolloConfig.ts`),
      this.convertTemplate("/templates/config/apollo/error-handling.ts.hbs", `./src/config/apollo/errorHandling.ts`),
    ]);
  }

  private async configureRoutes(options: ProjectOptions): Promise<void> {
    await Promise.all([
      this.convertTemplate("/templates/react/main.tsx.hbs", `./src/main.tsx`),
      this.convertTemplate("/templates/react/App.tsx.hbs", `./src/App.tsx`, { isAuthenticated: false }),
      this.convertTemplate("/templates/react/routes/basic-route/index.tsx.hbs", `./src/routes/index.tsx`),
      this.convertTemplate("/templates/react/pages/basic-pages/home/index.tsx.hbs", `./src/pages/home/index.tsx`),
    ]);

    info(`Committing all generated files`);
    await this.commit("Adding routes and apollo configuration");
  }

  private async initializeGit() {
    const execAsync = util.promisify(exec);
    await execAsync("git init && git checkout -b main");
  }

  private async initializeHusky() {
    const execAsync = util.promisify(exec);
    await execAsync("npx husky init");
  }

  private async makeExecutable(path: string) {
    const execAsync = util.promisify(exec);
    await execAsync(`chmod ug+x ${path}`);
  }

  private async initializeShadCn() {
    try {
      execSync("npx shadcn@latest init -d", { stdio: "inherit" });
    } catch (error) {
      console.error("Failed to initialize ShadCn:", error);
      throw error;
    }
  }
}
