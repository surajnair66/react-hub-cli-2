import fs from "fs-extra";
import { find } from "lodash";
import { WORK_DIR } from "../..";
import { AbstractGenerator } from "../../lib/abstract/generator";
import { TAuthPage } from "../../lib/types";
import { error, info } from "../../lib/ui/prefixes";

export class LoginGenerator extends AbstractGenerator {
  constructor(private pageData: TAuthPage) {
    super();
  }

  async generate(): Promise<void> {
    info(`Creating login page...`);

    switch (this.pageData.type) {
      case "EmailPassword":
        await this.generateEmailPassword();
        break;
      case "Phone":
        break;
      case "VerifyOtp":
        break;
      case "ForgotPassword":
        break;
      case "ResetPassword":
        break;
      default:
        await this.generateEmailPassword();
        break;
    }

    info("Adding custom components");
    await this.addCustomComponents();

    info(`Committing all generated files`);
    await this.commit("WIP: Adding Login pages and integrating the APIs");
  }

  private async generateEmailPassword() {
    const loginPage = this.pageData;
    const [loginApi, currentuserApi] = [find(loginPage.api, { type: "login" }), find(loginPage.api, { type: "currentUser" })];

    await Promise.all([
      this.addShadCnComponents(["button", "input", "label"]),
      this.convertTemplate("/templates/react/components/login-form.tsx.hbs", `./src/components/login-form.tsx`),
      this.convertTemplate("/templates/react/pages/advanced-pages/login/index.tsx.hbs", `./src/pages/login/index.tsx`, {
        currentUserHook: currentuserApi?.graphqlHook,
        loginHook: loginApi?.graphqlHook,
      }),
      this.convertTemplate("/templates/react/pages/advanced-pages/login/graphql/index.ts.hbs", `./src/pages/login/graphql/index.ts`, {
        loginMutation: loginApi?.queryString,
        currentUserQuery: currentuserApi?.queryString,
      }),
      fs.copy(`${WORK_DIR}/templates/react/assets/login1.jpg`, "./src/assets/login1.jpg"),
    ]);
    try {
      await this.codgenCompile();
    } catch (e) {
      error("An error occured during codegen compile, you can manually run it again");
    }
  }

  private async addCustomComponents(): Promise<void> {
    await Promise.all([this.convertTemplate("/templates/react/components/ui/button.tsx.hbs", "./src/components/ui/button.tsx")]);
  }
}
