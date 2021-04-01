import { Oak } from "../../../deps.ts";

declare module "https://deno.land/x/oak@v6.5.0/mod.ts" {
  interface Context {
    configDir: () => string;
  }

  // noinspection JSUnusedGlobalSymbols
  interface RouterContext {
    configDir: () => string;
  }
}

export const configDirAdapter = (configDir: string) => {
  return async function (ctx: Oak.Context, next: () => Promise<void>) {
    ctx.configDir = function (): string {
      return configDir;
    };

    await next();
  };
};
