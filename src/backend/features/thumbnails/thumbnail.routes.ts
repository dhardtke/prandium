import type { Config } from '../../config.ts';
import type { RouteTable } from '../../http/routing.ts';
import { ThumbnailController } from './internal/thumbnail.controller.ts';
import { createThumbnailsFacade } from './thumbnails.facade.ts';

export function thumbnailRoutes(config: Config): RouteTable {
  const controller = new ThumbnailController(createThumbnailsFacade(config));
  const serve = (req: Request): Promise<Response> => controller.serve(req);

  return {
    '/thumbnails/*': {
      GET: serve,
      HEAD: serve,
    },
  };
}
