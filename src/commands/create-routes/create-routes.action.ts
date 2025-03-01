import { RoutesGenerator } from "../../generators/routes.generator";
import { AbstractAction, Input } from "../../lib/abstract";
import { error } from "../../lib/ui/prefixes";

export interface Route {
  path: string;
  isPrivate: boolean;
  type: string;
}

export class CreateRoutesAction extends AbstractAction {
  public async handle(inputs?: Input[], options?: Input[], extraFlags?: string[]): Promise<void> {
    try {
      const routeName = this.getValue(inputs!, "route-name");
      if (!routeName || typeof routeName !== "string") throw new Error("Route name is required");
      else {
        const routes = routeName.split(",").map((el) => ({
          path: el.trim(),
          isPrivate: false,
          type: "page",
        }));
        const routeGenerator = new RoutesGenerator(routes, "", "");
        await routeGenerator.generate();
      }

      process.exit(0);
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  }
}
