import { camelCase, startCase, upperFirst } from "lodash";
import { AbstractGenerator } from "../../lib/abstract/generator";
import { TListingPage } from "../../lib/types";
import { error, info } from "../../lib/ui/prefixes";

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

    if (this.pageData.type === "Listing") {
      info("Creating listing page components");
      await this.createListingPage();
    } else if (this.pageData.type === "Detail") {
      info("Creating detail page components");
      // Detail page generation would be implemented here
    }
  }

  private async addCustomComponents(): Promise<void> {
    await this.addShadCnComponents(["drawer", "select", "input", "textarea", "label"]);

    await Promise.all([
      this.convertTemplate("/templates/react/components/ui/table.tsx.hbs", "src/components/ui/table.tsx"),
      this.convertTemplate("/templates/react/components/ui/table-header.tsx.hbs", "src/components/ui/table-header.tsx"),
      this.convertTemplate("/templates/react/components/ui/pagination.tsx.hbs", "src/components/ui/pagination.tsx"),
      this.convertTemplate("/templates/react/components/tableLoader.tsx.hbs", "src/components/tableLoader.tsx"),
      this.convertTemplate("/templates/react/components/ui/sheet.tsx.hbs", "src/components/ui/sheet.tsx"),
    ]);
  }

  private async addQueriesAndMutations(): Promise<void> {
    const apis =
      this.pageData.api?.map((api) => ({
        ...api,
        name: `${api.type}${this.moduleName}`.toUpperCase(),
      })) ?? [];

    const { pagePath } = this.getPagePath();

    await this.convertTemplate(
      "/templates/react/pages/advanced-pages/crud/graphql/index.ts.hbs",
      `src/pages/${pagePath}/graphql/index.ts`,
      { apis }
    );

    try {
      await this.codgenCompile();
    } catch (e) {
      error("An error occured during codegen compile, you can manually run it again");
    }
  }

  private getPagePath() {
    const routePath = this.pageData.route;
    const routeParts = routePath.split("/");
    const basePath = routeParts[1];
    const pagePath = this.pageData.type === "Detail" ? `${camelCase(basePath)}Detail` : camelCase(basePath);

    return {
      routePath,
      routeParts,
      basePath,
      pagePath,
    };
  }

  private async createListingPage(): Promise<void> {
    const { basePath } = this.getPagePath();

    // Format names for template
    const pluralName = startCase(basePath).replace(/\s/g, ""); // e.g., "Trainers"
    const singularName = pluralName.endsWith("s")
      ? pluralName.slice(0, -1) // e.g., "Trainer"
      : pluralName;
    const singularNameCamel = camelCase(singularName);

    // Prepare column definitions
    const columns = this.prepareColumns();

    // Find GraphQL hooks
    const hooks = this.findGraphQLHooks();

    // Check actions
    const actions = this.checkActions();

    // Check if there's a detail page route and name
    const detailInfo = this.getDetailPageInfo(basePath, actions.hasView);

    // Prepare fields for the form
    const allFields = this.prepareAllFields();

    // Check for password fields for special handling
    const passwordFields = allFields.filter((field) => field.type === "password");
    const hasPasswordFields = passwordFields.length > 0;

    // Generate components
    const pagePath = camelCase(basePath);
    const componentDir = `src/pages/${pagePath}`;

    await Promise.all([
      // Listing Component
      this.convertTemplate("/templates/react/pages/advanced-pages/crud/index.tsx.hbs", `${componentDir}/index.tsx`, {
        componentName: upperFirst(pluralName),
        singularName,
        singularNameCamel,
        pluralName,
        pluralNameCamel: camelCase(pluralName),
        title: pluralName,
        getHook: hooks.getListHook,
        createHook: hooks.createHook,
        updateHook: hooks.updateHook,
        deleteHook: hooks.deleteHook,
        getByIdHook: hooks.getByIdHook,
        columns,
        hasCreateAction: actions.hasCreate,
        hasEditAction: actions.hasEdit,
        hasDeleteAction: actions.hasDelete,
        detailPage: detailInfo.hasDetailPage,
        detailRouteName: detailInfo.detailRouteName,
      }),

      // Form Component
      this.convertTemplate("/templates/react/pages/advanced-pages/crud/form.tsx.hbs", `${componentDir}/${singularName}Form.tsx`, {
        singularName,
        singularNameCamel,
        fields: allFields,
        hasPasswordFields,
        passwordFields,
      }),

      this.commit(`WIP: Adding ${singularNameCamel} CRUD page`),
    ]);
  }

  private prepareAllFields() {
    const createFields = this.prepareFields(this.pageData.drawerCreate.fields);
    const updateFields = this.prepareFields(this.pageData.drawerUpdate.fields);

    // Combine fields, removing duplicates by name
    const fieldMap = new Map();

    [...createFields, ...updateFields].forEach((field) => {
      if (!fieldMap.has(field.name)) {
        fieldMap.set(field.name, field);
      }
    });

    return Array.from(fieldMap.values());
  }

  private prepareColumns() {
    return this.pageData.columns.map((column) => {
      const fieldParts = column.field.split(".");
      const fieldName = fieldParts[fieldParts.length - 1];

      let customComponent;

      // Custom rendering based on field type
      if (fieldName === "averageRating") {
        customComponent = `<div className='flex items-center gap-1'>
            <StarIcon className='h-4 w-4 fill-yellow-400 stroke-yellow-400' />
            <span>{item.${column.field}?.toFixed(1) || 'N/A'}</span>
          </div>`;
      } else if (fieldName === "rate") {
        customComponent = `<div>${"$"}{item.${column.field}}/hr</div>`;
      } else if (fieldName.toLowerCase().includes("name")) {
        customComponent = `<div className='font-medium'>{item.${column.field}}</div>`;
      } else if (fieldName.includes("Date") || fieldName.includes("Time")) {
        customComponent = `<div>{new Date(item.${column.field}).toLocaleString()}</div>`;
      } else {
        customComponent = `<div>{item.${column.field}}</div>`;
      }

      return {
        field: column.field,
        label: column.label.toUpperCase(),
        displayInTable: true,
        customComponent,
        align: "left",
      };
    });
  }

  private findGraphQLHooks() {
    return {
      getListHook: this.pageData.api?.find((api) => api.type === "list")?.graphqlHook,
      createHook: this.pageData.api?.find((api) => api.type === "create")?.graphqlHook,
      updateHook: this.pageData.api?.find((api) => api.type === "update")?.graphqlHook,
      deleteHook: this.pageData.api?.find((api) => api.type === "delete")?.graphqlHook,
      getByIdHook: this.pageData.api?.find((api) => api.type === "getById")?.graphqlHook,
    };
  }

  private checkActions() {
    return {
      hasCreate: this.pageData.actions.includes("create"),
      hasEdit: this.pageData.actions.includes("edit"),
      hasDelete: this.pageData.actions.includes("delete"),
      hasView: false,
    };
  }

  private getDetailPageInfo(basePath: string, hasViewAction: boolean) {
    return {
      hasDetailPage: this.pageData.type === "Listing" && hasViewAction,
      detailRouteName: hasViewAction ? `${camelCase(basePath)}Detail` : null,
    };
  }

  private prepareFields(fieldsData: any[]) {
    return fieldsData.map((field) => {
      return {
        name: field.name,
        label: startCase(field.name),
        type: field.type,
        required: field.required || false,
        hidden: field.type === "hidden",
        defaultValue: field.defaultValue,
        placeholder: `Enter ${startCase(field.name)}`,
        zodString: field.validation?.zodString || "z.string()",
        validationType: field.type === "number" ? "number()" : "string()",
        options: field.options,
      };
    });
  }
}
