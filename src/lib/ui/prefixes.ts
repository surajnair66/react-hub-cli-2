import chalk from "chalk";

export function success(message: string) {
  console.info(" ", chalk.bgGreen.bold(" SUCCESS "), chalk.green(message));
}

export function warning(message: string) {
  console.info(" ", chalk.bgYellow.bold(" WARNING "), chalk.yellow(message));
}

export function info(message: string) {
  console.info(" ", chalk.bgBlue.bold(" INFO "), chalk.blue(message));
}

export function error(message: string) {
  console.info(" ", chalk.bgRed.bold(" ERROR "), chalk.red(message));
}
