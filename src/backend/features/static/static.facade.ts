import type { EmbeddedWeb } from '../../shared/embedded.ts';
import { embedWebRoot } from './internal/embed.ts';
import { FRONTEND_DIR } from './internal/paths.ts';

export class StaticFacade {
  webRoot(): string {
    return FRONTEND_DIR;
  }

  embed(): Promise<EmbeddedWeb> {
    return embedWebRoot();
  }
}

export function createStaticFacade(): StaticFacade {
  return new StaticFacade();
}
