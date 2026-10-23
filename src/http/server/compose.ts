import { AppRequest, Handler, Middleware } from "./types.ts";

/**
 * Composes the given middlewares and the handler into a single handler. The middlewares are invoked in the given order, each one deciding whether to
 * call the next one (and eventually the handler) or to short-circuit by returning its own response.
 */
export function compose(middlewares: Middleware[], handler: Handler): Handler {
    return (req: AppRequest) => {
        const dispatch = (i: number): Promise<Response> => {
            if (i === middlewares.length) {
                return Promise.resolve().then(() => handler(req));
            }
            return Promise.resolve().then(() => middlewares[i](req, () => dispatch(i + 1)));
        };
        return dispatch(0);
    };
}
