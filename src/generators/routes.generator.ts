import fs from "fs-extra";
import { camelCase, upperFirst } from "lodash";
import { Route } from "../commands/create-routes/create-routes.action";
import { AbstractGenerator } from "../lib/abstract/generator";
import { info } from "../lib/ui/prefixes";

export class RoutesGenerator extends AbstractGenerator {
  constructor(
    private routes: Route[],
    private apiEndpoint?: string,
    private logo?: string
  ) {
    super();
  }

  async generate(): Promise<void> {
    info(`Creating routes...`);

    info("Configuring auth vars and env variables");
    await this.configureAuthVars();

    info("Configuring codegen");
    await this.configureCodegen();

    info("Configuring route wrappers");
    await this.configureRouteWrappers();

    info("Configuring routes");
    await this.configureRoutes();

    info("Creating route components");
    await this.createRouteComponents();

    info("Creating sidemenu and header");
    await this.configureSideMenu();

    info(`Committing all generated files`);
    await this.commit("WIP: Adding routes, common components and sidemenu / header");
  }

  private async configureAuthVars(): Promise<void> {
    await Promise.all([
      this.convertTemplate("/templates/react/env.hbs", ".env", { apiEndpoint: this.apiEndpoint ?? "http://localhost:4001" }),
      this.convertTemplate("/templates/react/vars/auth.ts.hbs", "src/vars/auth.ts"),
      this.convertTemplate("/templates/react/vars/userDetails.ts.hbs", "src/vars/userDetails.ts"),
    ]);
  }

  private async configureCodegen(): Promise<void> {
    await Promise.all([
      this.convertTemplate("/templates/config/codegen/codegen-loader.ts.hbs", "codegen-loader.ts", {
        apiEndpoint: this.apiEndpoint ?? "http://localhost:4001",
      }),
      this.convertTemplate("/templates/config/codegen/codegen.ts.hbs", "codegen.ts"),
    ]);
  }

  private async configureRouteWrappers(): Promise<void> {
    await Promise.all([
      this.convertTemplate("/templates/react/components/pageLoader.tsx.hbs", "src/components/pageLoader.tsx"),
      this.convertTemplate("/templates/react/components/notify.tsx.hbs", "src/components/notify.tsx"),
    ]);

    await Promise.all([
      this.convertTemplate("/templates/react/App.tsx.hbs", `./src/App.tsx`, { isAuthenticated: true }),
      this.convertTemplate("/templates/react/hooks/useCurrentUser.tsx.hbs", "src/hooks/useCurrentUser.tsx"),
      this.convertTemplate("/templates/react/layout/privateLayout.tsx.hbs", "src/layout/privateLayout.tsx"),
    ]);
  }

  private async configureRoutes(): Promise<void> {
    const routeDefenitions = this.routes.map((route) => ({
      path: route.path,
      isPrivate: route.isPrivate,
      name: route.type === "Detail" ? `${camelCase(route.path.split("/")[1])}Detail` : camelCase(route.path.split("/")[1]),
    }));
    const privateRoutes = routeDefenitions.filter((route) => route.isPrivate);
    const publicRoutes = routeDefenitions.filter((route) => !route.isPrivate);

    const routePaths: Record<string, string> = { invalidPath: "*" };
    routeDefenitions.forEach((route) => {
      routePaths[route.name] = route.path;
    });

    const routePathContent = `const getRoutes = ${JSON.stringify(routePaths, null, 2)};\nexport default getRoutes;`;

    await Promise.all([
      fs.writeFile("src/routes/routePaths.ts", routePathContent),
      this.convertTemplate("/templates/react/routes/advanced-route/index.tsx.hbs", "src/routes/index.tsx", {
        privateRoutes,
        publicRoutes,
        routeDefenitions,
        initialRoute: routeDefenitions[0].name,
      }),
      this.convertTemplate("/templates/react/routes/advanced-route/private.tsx.hbs", "src/routes/private.tsx"),
      this.convertTemplate("/templates/react/routes/advanced-route/public.tsx.hbs", "src/routes/public.tsx", {
        initialRoute: routeDefenitions[0].name,
      }),
    ]);
  }

  private async createRouteComponents(): Promise<void> {
    await Promise.all(
      this.routes.map((route) => {
        const name = route.type === "Detail" ? `${camelCase(route.path.split("/")[1])}Detail` : camelCase(route.path.split("/")[1]);
        const formattedName = upperFirst(name);
        return fs.outputFile(
          `src/pages/${name}/index.tsx`,
          `const ${formattedName} = () => {\n  return <div>${formattedName}</div>;\n};\n\nexport default ${formattedName};`
        );
      })
    );
  }

  private async configureSideMenu(): Promise<void> {
    const routeNames = this.routes.filter((route) => route.isPrivate && route.type !== "Detail").map((route) => camelCase(route.path.split("/")[1]));

    await Promise.all([
      this.convertTemplate("/templates/react/components/header.tsx.hbs", "src/components/header.tsx", { logo: this.logo || "" }),
      this.convertTemplate("/templates/react/components/app-sidebar.tsx.hbs", "src/components/app-sidebar.tsx", { items: routeNames }),
      this.addShadCnComponents(["sidebar", "dialog", "avatar", "dropdown-menu"]),
    ]);
  }
}
