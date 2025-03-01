#!/usr/bin/env node

/**
 * rhc
 * A CLI tool created by Hubspire for bootstraping React apps
 *
 * @author Suraj Nair <https://www.hubspire.com/>
 */

import { program } from "commander";
import path from "path";
import { CommandLoader } from "./commands";
export const WORK_DIR = path.resolve(__dirname);

const bootstrap = async () => {
  program.version(`Current CLI Version: ${require("../package.json").version}`, "-v, --version", "Output the current version.");
  await CommandLoader.load(program);

  program.parse(process.argv);
};

bootstrap();
