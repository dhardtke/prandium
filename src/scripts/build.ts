import { relative, resolve } from 'node:path';
import { MIGRATIONS_DIR, readMigrations } from '../backend/db/migrations.ts';
import type { Embedded, EmbeddedWeb } from '../backend/shared/embedded.ts';
import { createStaticFacade } from '../backend/features/static/static.facade.ts';

const SRC = resolve(import.meta.dir, '..');

export interface BuildResult {
  outfile: string;
  bytes: number;
  embedded: Embedded;
}

function commit(): string {
  const git = (...args: string[]): string | null => {
    const result = Bun.spawnSync(['git', ...args], { cwd: SRC, stderr: 'ignore' });
    return result.success ? result.stdout.toString().trim() : null;
  };
  const head = git('rev-parse', 'HEAD');
  if (head === null) {
    return 'unknown';
  }
  return git('status', '--porcelain') === '' ? head : `${head}-dirty`;
}

function stamp(web: EmbeddedWeb, builtAt: Date): void {
  const index = web.pages['/index.html'];
  if (index === undefined) {
    throw new Error('src/frontend/index.html is missing');
  }
  const runId = Bun.env.GITHUB_RUN_ID;
  const run = runId === undefined ? '' : `, run ${runId}`;
  const comment = `<!-- cena ${commit()}, built ${builtAt.toISOString()}${run} -->`;
  const doctype = /^<!doctype html>\r?\n/i.exec(index.body)?.[0];
  if (doctype === undefined) {
    throw new Error('src/frontend/index.html must start with <!doctype html>');
  }
  index.body = `${doctype}${comment}\n${index.body.slice(doctype.length)}`;
}

export async function build(outdir: string): Promise<BuildResult> {
  const web = await createStaticFacade().embed();
  stamp(web, new Date());
  const embedded: Embedded = { ...web, migrations: readMigrations(MIGRATIONS_DIR) };
  await Bun.build({
    entrypoints: [resolve(SRC, 'backend/main.ts')],
    target: 'bun',
    outdir,
    naming: 'cena.js',
    minify: true,
    sourcemap: 'linked',
    files: { [resolve(SRC, 'backend/shared/embedded.ts')]: `export const EMBEDDED = ${JSON.stringify(embedded)};` },
  });
  await Bun.write(resolve(outdir, 'bun-version'), `${Bun.version}\n`);
  const outfile = resolve(outdir, 'cena.js');
  return { outfile, bytes: Bun.file(outfile).size, embedded };
}

async function main(): Promise<void> {
  const { outfile, bytes, embedded } = await build('dist');
  const shown = relative(process.cwd(), outfile).replaceAll('\\', '/');
  console.log(`built ${shown} (${Math.round(bytes / 1024)} KB), ${shown}.map and bun-version (${Bun.version})`);
  const count = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;
  console.log(`  embedded ${count(Object.keys(embedded.pages).length, 'frontend file')}, ${count(embedded.migrations.length, 'migration')}`);
}

if (import.meta.main) {
  await main();
}
