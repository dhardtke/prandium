import { Oak } from "../../../deps-oak.ts";
import { singleton } from "../../../deps.ts";
import { root } from "../../shared/util.ts";
import { Router } from "./router.ts";

const AssetsDir = root("assets");
const CompiledAssetsDir = root("out/assets");

export const GET_ROUTE = "/assets/(.+)" as const;
export const SW_JS_ROUTE = "/sw.js" as const;

async function tryMultiple<P extends string>(ctx: Oak.RouterContext<P>, filename: string, dirs: string[]) {
  let lastError: unknown;
  for (const dir of dirs) {
    try {
      await Oak.send(ctx, filename, {
        root: dir,
      });
      return;
    } catch (e) {
      // ignored
      lastError = e;
    }
  }
  throw lastError;
}

async function assetMiddleware<P extends string>(
  ctx: Oak.RouterContext<P>,
  next: () => Promise<unknown>,
  filename: string,
) {
  try {
    await tryMultiple(ctx, filename, [AssetsDir, CompiledAssetsDir]);
  } catch {
    await next();
  }
}

@singleton()
export class AssetsRouter extends Router {
  constructor() {
    super();
    this.router
      .get(GET_ROUTE, this.get)
      .get(SW_JS_ROUTE, this.getSw);
  }

  get: Oak.RouterMiddleware<typeof GET_ROUTE> = async (ctx, next) => {
    await assetMiddleware(ctx, next, ctx.params && ctx.params[0]);
  };

  getSw: Oak.RouterMiddleware<typeof SW_JS_ROUTE> = async (ctx, next) => {
    await assetMiddleware(ctx, next, "sw.js");
  };
}
