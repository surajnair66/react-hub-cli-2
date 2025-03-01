import chalk from "chalk";
import figlet from "figlet";
import { readFileSync } from "node:fs";
import { platform, release } from "node:os";
import { join } from "node:path";
import { WORK_DIR } from "../..";
import { AbstractAction } from "../../lib/abstract";

export class InfoAction extends AbstractAction {
  public async handle() {
    console.log(chalk.blue(figlet.textSync("REACT HUB CLI", { horizontalLayout: "full", font: "ANSI Shadow" })));
    console.info(chalk.green("[System Information]"));
    console.info("OS Version     :", chalk.blue(platform(), release()));
    console.info("NodeJS Version :", chalk.blue(readFileSync(join(WORK_DIR, "../.nvmrc"), "utf-8")));
    console.info(chalk.green("\n[REACT HUB CLI]"));
    console.info("Version :", chalk.blue(require("../../../package.json").version), "\n");
    process.exit(0);
  }
}
