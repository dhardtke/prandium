import { sprintf } from "../../../deps.ts";

export type ArgumentType = "string" | "boolean" | "number" | "void";

export interface ArgumentDefinition {
  name: string;
  description?: string;
  default?: unknown;
  type: ArgumentType;
}

function argumentTypeConverter(type: ArgumentType): (arg0: string) => void {
  if (type === "string") {
    return (input) => input;
  } else if (type === "boolean") {
    return (input) => input === "true";
  } else if (type === "number") {
    return (input) => parseInt(input, 10);
  }
  return () => {
    throw new Error("Not callable.");
  };
}

function requiresValue(definition: ArgumentDefinition): boolean {
  return typeof definition.default === "undefined" &&
    ["string", "number"].includes(definition.type);
}

type Help = [string, string, string];

export class Argparser<Options> {
  static readonly ARGUMENT_PATTERN = /^--([\w-]+)(?:=(.*))?$/;

  private readonly definitions: ArgumentDefinition[];

  constructor(definitions: ArgumentDefinition[]) {
    this.definitions = definitions;
  }

  parse(args: string[]): Options {
    const options: { [index: string]: unknown } = {};
    for (const arg of args) {
      const parts = arg.match(Argparser.ARGUMENT_PATTERN);
      if (parts) {
        const name = parts[1];
        const value = parts[2];
        const definition = this.definitions.find((d) => d.name === name);
        if (definition) {
          const converter = argumentTypeConverter(definition.type);
          if (value) {
            options[name] = converter(value);
          } else if (!requiresValue(definition)) {
            options[name] = true;
          } else {
            throw new Error(`Argument "${name}" must have a value`);
          }
        } else {
          throw new Error(`Unknown argument: "${arg}"`);
        }
      } else {
        throw new Error(`Illegal argument syntax: "${arg}"`);
      }
    }
    for (const definition of this.definitions) {
      if (typeof options[definition.name] === "undefined") {
        if (requiresValue(definition)) {
          if (typeof definition.default === "undefined") {
            throw new Error(
              `Missing required value for argument "${definition.name}"`,
            );
          } else {
            options[definition.name] = definition.default;
          }
        } else if (definition.type !== "void") {
          const converter = argumentTypeConverter(definition.type);
          options[definition.name] = converter(definition.default as string);
        }
      }
    }
    return options as unknown as Options;
  }

  private static definitionToHelp(definition: ArgumentDefinition): Help {
    const help: Help = [`--${definition.name}`, "", ""];
    help[0] += `${definition.type === "void" ? "" : `=[${definition.type}]`}`;
    help[1] = `${definition.description ? `- ${definition.description}` : ""}`;
    help[2] = `${typeof definition.default === "undefined" ? "" : `(Default: ${JSON.stringify(definition.default)})`}`;

    return help;
  }

  help(): string {
    const options: Help[] = this.definitions.map(Argparser.definitionToHelp);
    const lengthMatrix = options.map((h) => h.map((s) => s.length));
    const lengthMatrixByColumn = lengthMatrix[0].map((_ignored, i) => lengthMatrix.map((row) => row[i]));
    const maxLengthPerColumn = lengthMatrixByColumn.map((m) => Math.max(...m));

    return `  Usage: COMMAND

  Options:
    ${
      options.map((help) =>
        help.map((s, col) => sprintf(`%${maxLengthPerColumn[col]}-s`, s)).join(
          " ",
        )
      ).join("\n    ")
    }`;
  }
}
