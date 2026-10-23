// `null` means "read from disk"; `bun run build` swaps this module for one carrying the files.
import type { MigrationSource } from '../db/migrations.ts';

export interface EmbeddedFile {
  body: string;
  type: string;
  base64?: true;
}

export interface EmbeddedWeb {
  pages: Record<string, EmbeddedFile>;
}

export interface Embedded extends EmbeddedWeb {
  migrations: MigrationSource[];
}

export const EMBEDDED: Embedded | null = null;
