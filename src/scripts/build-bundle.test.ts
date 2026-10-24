import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createStaticFacade } from '../backend/features/static/static.facade.ts';
import type { ProbeReport } from './build-bundle.probe.ts';

const PROBE = resolve(import.meta.dir, 'build-bundle.probe.ts');

function sheets(requested: string[]): string[] {
  return requested.filter((url) => url.endsWith('.css')).toSorted();
}

describe('the built frontend bundle', () => {
  let dir = '';
  let report: ProbeReport;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'cena-bundle-'));
    const bundle = join(dir, 'main.js');
    const { pages } = await createStaticFacade().embed();
    await Bun.write(bundle, pages['/main.ts']?.body ?? '');

    const proc = Bun.spawn([process.execPath, PROBE, bundle], { stdout: 'pipe', stderr: 'pipe' });
    const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
    if (code !== 0) {
      throw new Error(`build-bundle.probe exited ${code}: ${stderr}`);
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- written by the probe
    report = JSON.parse(stdout.trim().split('\n').at(-1) ?? '') as ProbeReport;
  }, 30_000);

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
  });

  test('defines the shell, each component with its stylesheets from the bundle', () => {
    for (const tag of ['ce-app', 'ce-header', 'ce-theme-toggle', 'ce-language-switch', 'ce-breadcrumbs']) {
      expect(report.beforeMount.defined).toContain(tag);
    }
    expect(sheets(report.beforeMount.requested)).toEqual([]);
    expect(report.beforeMount.appRules).toBeGreaterThan(0);
  });

  test('runs a lazily imported view only when its route opens, still fetching no sheet', () => {
    expect(report.beforeMount.defined).not.toContain('ce-recipe-list');
    expect(report.afterMount.defined).toContain('ce-recipe-list');
    expect(sheets(report.afterMount.requested)).toEqual([]);
  });
});
