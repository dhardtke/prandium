import { type Config, thumbnailsDir } from '../../config.ts';
import { ThumbnailStore } from './internal/thumbnail.store.ts';

export class ThumbnailsFacade {
  readonly #store: ThumbnailStore;
  readonly #userAgent: string;

  constructor(store: ThumbnailStore, userAgent: string) {
    this.#store = store;
    this.#userAgent = userAgent;
  }

  /** The file's path, or null for a name that would leave the thumbnail directory. */
  resolve(file: string): string | null {
    return this.#store.resolve(file);
  }

  /** Stores the bytes under a free name derived from `suggestedName` and returns that name. */
  store(bytes: Uint8Array, type: string, suggestedName: string): Promise<string> {
    return this.#store.write(bytes, suggestedName, type);
  }

  remove(file: string): Promise<void> {
    return this.#store.remove(file);
  }

  download(url: string): Promise<string> {
    return this.#store.download(url, this.#userAgent);
  }
}

export function createThumbnailsFacade(config: Config): ThumbnailsFacade {
  return new ThumbnailsFacade(new ThumbnailStore(thumbnailsDir(config)), config.userAgent);
}
