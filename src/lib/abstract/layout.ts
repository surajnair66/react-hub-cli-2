import { Command } from "commander";
import { AbstractAction } from "./action";

export abstract class AbstractLayout {
  constructor(protected action: AbstractAction) {}
  public abstract load(program: Command): void;
}
