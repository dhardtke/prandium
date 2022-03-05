import { Oak } from "../../../deps-oak.ts";
import { singleton } from "../../../deps.ts";
import { root } from "../../shared/util.ts";
import { Router } from "./router.ts";

const CompiledAssetsDir = root("assets");

async function assetMiddleware<P extends string>(
  ctx: Oak.RouterContext<P>,
  next: () => Promise<unknown>,
  filename: string,
) {
  try {
    await Oak.send(ctx, filename, {
      root: CompiledAssetsDir,
    });
  } catch {
    await next();
  }
}

@singleton()
export class AssetsRouter extends Router {
  constructor() {
    super();
    this.router
      .get("/assets/(.+)", this.get)
      .get("/sw.js", this.getSw);
  }

  get = async (ctx: Oak.RouterContext<"/assets/(.+)">, next: () => Promise<unknown>) => {
    await assetMiddleware(ctx, next, ctx.params[0]!);
  };

  getSw = async (ctx: Oak.RouterContext<"/sw.js">, next: () => Promise<unknown>) => {
    await assetMiddleware(ctx, next, "sw.js");
  };
}
