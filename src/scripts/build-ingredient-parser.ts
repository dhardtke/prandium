import { resolve } from 'node:path';

const DIR = resolve(import.meta.dir, '../backend/features/recipes/internal/ingredient');
const GRAMMAR = resolve(DIR, 'parser.pegjs');
const PARSER = resolve(DIR, 'parser.js');

async function main(): Promise<void> {
  // `bun x` runs the locally installed peggy; --dts writes parser.d.ts beside it, which `bun check` reads.
  const proc = Bun.spawn([process.execPath, 'x', 'peggy', '--format', 'es', '--dts', '--output', PARSER, GRAMMAR], { stdout: 'inherit', stderr: 'inherit' });
  if ((await proc.exited) !== 0) {
    process.exit(1);
  }
  // Generated: excluded from formatting in bunfig.toml and from linting in .oxlintrc.json.
  await Bun.write(PARSER, `/* oxlint-disable */\n${await Bun.file(PARSER).text()}`);
  console.log(`wrote ${PARSER}`);
}

if (import.meta.main) {
  await main();
}
