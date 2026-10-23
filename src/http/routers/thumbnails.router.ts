import * as needle from "@needle-di/core";
import { getThumbnailDir } from "../../data/util/thumbnails.ts";
import { CONFIG_DIR } from "../../di.ts";
import { NotFoundError } from "../../shared/errors.ts";
import { serveFile } from "../server/static-files.ts";
import { AppRequest } from "../server/types.ts";
import { Router } from "./router.ts";

export const THUMBNAILS_PREFIX = "/thumbnails/" as const;

@needle.injectable()
export class ThumbnailsRouter extends Router {
    constructor(private configDir: string = needle.inject(CONFIG_DIR)) {
        super();
        this.get(`${THUMBNAILS_PREFIX}*`, this.getThumbnail);
    }

    getThumbnail = async (req: AppRequest): Promise<Response> => {
        const filename = req.url.pathname.substring(THUMBNAILS_PREFIX.length);
        const response = await serveFile(req, getThumbnailDir(this.configDir), filename);
        if (!response) {
            throw new NotFoundError(`Thumbnail not found: ${filename}`);
        }
        return response;
    };
}
