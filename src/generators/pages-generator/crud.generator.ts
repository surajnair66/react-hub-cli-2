import { camelCase } from "lodash";
import { AbstractGenerator } from "../../lib/abstract/generator";
import { TListingPage } from "../../lib/types";
import { info } from "../../lib/ui/prefixes";

export class CRUDGenerator extends AbstractGenerator {
  constructor(
    private pageData: TListingPage,
    private moduleName: string
  ) {
    super();
  }

  async generate(addCustomTable: boolean): Promise<void> {
    if (addCustomTable) {
      info("Creating custom table components");
      await this.addCustomComponents();
    }

    info("Adding queries and mutations");
    await this.addQueriesAndMutations();

    // info(`Committing all generated files`);
    // await this.commit(`Feat: Creating ${this.pageData.name} module`);
  }

  private async addCustomComponents(): Promise<void> {
    await Promise.all([
      this.convertTemplate("/templates/react/components/ui/table.tsx.hbs", "src/components/ui/table.tsx"),
      this.convertTemplate("/templates/react/components/ui/table-header.tsx.hbs", "src/components/ui/table-header.tsx"),
      this.convertTemplate("/templates/react/components/ui/pagination.tsx.hbs", "src/components/ui/pagination.tsx"),
      this.convertTemplate("/templates/react/components/tableLoader.tsx.hbs", "src/components/tableLoader.tsx"),
    ]);
  }

  private async addQueriesAndMutations(): Promise<void> {
    const apis = this.pageData.api?.map((api) => ({ ...api, name: `${api.type}${this.moduleName}`.toUpperCase() })) ?? [];

    const pageName =
      this.pageData.type === "Detail"
        ? `${camelCase(this.pageData.route.split("/")[1])}Detail`
        : camelCase(this.pageData.route.split("/")[1]);

    await Promise.all([
      this.convertTemplate("/templates/react/pages/advanced-pages/crud/graphql/index.ts.hbs", `src/pages/${pageName}/graphql/index.ts`, {
        apis,
      }),
    ]);
  }
}
