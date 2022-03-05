import { Oak } from "../../../deps-oak.ts";

export abstract class Router {
  protected router: Oak.Router;

  protected constructor(opts: Oak.RouterOptions = {}) {
    this.router = new Oak.Router(opts);
  }

  routes(): Oak.Middleware {
    return this.router.routes();
  }

  allowedMethods(): Oak.Middleware {
    return this.router.allowedMethods();
  }
}
