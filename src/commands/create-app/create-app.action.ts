import { AppGenerator } from "../../generators/app.generator";
import { AbstractAction, Input } from "../../lib/abstract";
import { error } from "../../lib/ui/prefixes";

export class CreateAppAction extends AbstractAction {
  readonly appGenerator;
  constructor() {
    super();
    this.appGenerator = new AppGenerator();
  }
  public async handle(inputs?: Input[], options?: Input[], extraFlags?: string[]): Promise<void> {
    try {
      const projectName = this.getValue(inputs!, "project-name");
      if (!projectName || typeof projectName !== "string") throw new Error("Project name is required");
      else await this.appGenerator.generate({ projectName });

      process.exit(0);
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
  }
}
