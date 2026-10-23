import type { DB } from '../../db/db.ts';
import type { RouteTable } from '../../http/routing.ts';
import { TagController } from './internal/tag.controller.ts';
import { createTagFacade } from './tags.facade.ts';

export function tagRoutes(db: DB): RouteTable {
  const controller = new TagController(createTagFacade(db));

  return {
    '/api/tags': {
      GET: (req) => controller.list(req),
    },
  };
}
