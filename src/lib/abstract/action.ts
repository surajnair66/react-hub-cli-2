export interface Input {
  name: string;
  value: boolean | string;
  options?: any;
}

export abstract class AbstractAction {
  public abstract handle(inputs?: Input[], options?: Input[], extraFlags?: string[]): Promise<void>;

  protected getValue(input: Input[], key: string) {
    return input.find((o) => o.name === key)?.value;
  }
}
