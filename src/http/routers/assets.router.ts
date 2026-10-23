import * as needle from "@needle-di/core";
import { NotFoundError } from "../../shared/errors.ts";
import { root } from "../../shared/util.ts";
import { serveFile } from "../server/static-files.ts";
import { AppRequest } from "../server/types.ts";
import { Router } from "./router.ts";

const AssetsDir = root("assets");
const CompiledAssetsDir = root("out/assets");

export const ASSETS_PREFIX = "/assets/" as const;
export const GET_ROUTE = `${ASSETS_PREFIX}*` as const;
export const SW_JS_ROUTE = "/sw.js" as const;

async function serveAsset(req: AppRequest, filename: string): Promise<Response> {
    for (const dir of [AssetsDir, CompiledAssetsDir]) {
        const response = await serveFile(req, dir, filename);
        if (response) {
            return response;
        }
    }
    throw new NotFoundError(`Asset not found: ${filename}`);
}

@needle.injectable()
export class AssetsRouter extends Router {
    constructor() {
        super();
        this.get(GET_ROUTE, this.getAsset).get(SW_JS_ROUTE, this.getSw);
    }

    getAsset = (req: AppRequest): Promise<Response> => {
        return serveAsset(req, req.url.pathname.substring(ASSETS_PREFIX.length));
    };

    getSw = (req: AppRequest): Promise<Response> => {
        return serveAsset(req, "sw.js");
    };
}
