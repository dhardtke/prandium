import { Oak } from "../../../deps-oak.ts";
import { singleton } from "../../../deps.ts";
import { root } from "../../shared/util.ts";
import { Router } from "./router.ts";

const AssetsDir = root("assets");
const CompiledAssetsDir = root("out/assets");

async function tryMultiple<P extends string>(ctx: Oak.RouterContext<P>, filename: string, dirs: string[]) {
  for (const dir of dirs) {
    try {
      await Oak.send(ctx, filename, {
        root: dir,
      });
      break;
    } catch {
      // ignored
    }
  }
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
      .get("/assets/(.+)", this.get)
      .get("/sw.js", this.getSw);
  }

  get: Oak.RouterMiddleware<"/assets/(.+)"> = async (ctx, next) => {
    await assetMiddleware(ctx, next, ctx.params[0]!);
  };

  getSw: Oak.RouterMiddleware<"/sw.js"> = async (ctx, next) => {
    await assetMiddleware(ctx, next, "sw.js");
  };
}
