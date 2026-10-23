import type { Config } from '../config.ts';
import type { DB } from '../db/db.ts';
import { createAuthFacade } from '../features/auth/auth.facade.ts';
import { authRoutes } from '../features/auth/auth.routes.ts';
import { devRoutes } from '../features/dev/dev.routes.ts';
import { metaRoutes } from '../features/meta/meta.routes.ts';
import { recipeRoutes } from '../features/recipes/recipe.routes.ts';
import { staticRoutes } from '../features/static/static.routes.ts';
import { tagRoutes } from '../features/tags/tag.routes.ts';
import { thumbnailRoutes } from '../features/thumbnails/thumbnail.routes.ts';
import type { RouteTable } from './routing.ts';
import { accessLog } from './access-log.ts';
import { sameOriginWrites } from './same-origin.ts';
import { securityHeaders } from './security-headers.ts';

// accessLog wraps the guards so their refusals are logged, and securityHeaders wraps it so its error responses get headers.
// Spread order is cosmetic: Bun matches by specificity.
export function allRoutes(db: DB, config: Config, now?: () => number): RouteTable {
  const auth = createAuthFacade({ passwordHash: config.passwordHash, now });
  return securityHeaders(
    accessLog(
      sameOriginWrites({
        ...metaRoutes(auth),
        ...authRoutes(auth),
        ...auth.guard({
          ...recipeRoutes(db, config),
          ...tagRoutes(db),
          ...thumbnailRoutes(config),
        }),
        ...devRoutes(),
        ...staticRoutes(auth),
      }),
    ),
  );
}
