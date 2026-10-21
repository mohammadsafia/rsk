import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { hashFile } from '../../scripts/kit/core';
import { buildStarter } from '../../scripts/starter/build-starter';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

let out = '';

beforeAll(() => {
  out = buildStarter(mkdtempSync(path.join(os.tmpdir(), 'rsk-starter-test-')));
});

afterAll(() => {
  rmSync(out, { recursive: true, force: true });
});

describe('buildStarter', () => {
  it('ships a kit.lock.json naming the kit commit and fingerprinting every kit file, and the kit:status/kit:update scripts', () => {
    const lock = JSON.parse(readFileSync(path.join(out, 'kit.lock.json'), 'utf8')) as { kit: string; files: Record<string, string> };
    expect(lock.kit).toBe(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim());
    const button = 'src/components/ui/button/Button.tsx';
    expect(lock.files[button]).toBe(hashFile(path.join(out, button)));
    expect(lock.files['src/pages/dashboard/DashboardPage.tsx']).toBeUndefined(); // app-owned
    expect(Object.keys(lock.files).every((file) => existsSync(path.join(out, file)))).toBe(true);
    const pkg = JSON.parse(readFileSync(path.join(out, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(pkg.scripts['kit:status']).toBe('tsx scripts/kit/kit.ts status');
    expect(pkg.scripts['kit:update']).toBe('tsx scripts/kit/kit.ts update');
  });

  it('ships the block catalogue in registry/ (not in src), an empty block index, kit:add/kit:remove and the picker’s library', () => {
    const index = JSON.parse(readFileSync(path.join(out, 'registry/index.json'), 'utf8')) as { id: string }[];
    const registered = existsSync(path.join(out, 'registry/blocks')) ? readdirSync(path.join(out, 'registry/blocks')).sort() : [];
    expect(index.map((block) => block.id).sort()).toEqual(registered);
    expect(registered).toEqual(expect.arrayContaining(['invite-members-dialog', 'search-field', 'system-pages']));
    expect(existsSync(path.join(out, 'registry/blocks/system-pages/files/src/locales/ar/block-system-pages.json'))).toBe(true);
    for (const id of registered) expect(existsSync(path.join(out, `registry/blocks/${id}/files/src/blocks/${id}/block.json`))).toBe(true);
    // No block in the app's own source: an app has only the blocks it adds.
    expect(readdirSync(path.join(out, 'src/blocks'))).toEqual(['index.ts']);
    for (const lang of ['en', 'ar'])
      expect(readdirSync(path.join(out, `src/locales/${lang}`)).filter((file) => file.startsWith('block-'))).toEqual([]);
    expect(readFileSync(path.join(out, 'src/blocks/index.ts'), 'utf8')).toContain('export const appBlockRoutes: RouteObject[] = [];');
    const pkg = JSON.parse(readFileSync(path.join(out, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.scripts['kit:add']).toBe('tsx scripts/kit/add.ts add');
    expect(pkg.scripts['kit:remove']).toBe('tsx scripts/kit/add.ts remove');
    expect(pkg.devDependencies['@clack/prompts']).toBeDefined();
  });

  it('gives the blocks’ pages outside the app shell an error page too', () => {
    const router = readFileSync(path.join(out, 'src/routes/router.tsx'), 'utf8');
    // A pathless parent with the error element, so a /maintenance or 404 chunk that fails to load isn't React Router's default page.
    expect(router).toMatch(/errorElement:[\s\S]{0,160}children: bareBlockRoutes/);
  });

  it('ships none of the starter tooling, its tests or its sync workflow', () => {
    expect(existsSync(path.join(out, 'scripts/starter'))).toBe(false);
    expect(existsSync(path.join(out, 'tests/starter'))).toBe(false);
    expect(existsSync(path.join(out, '.github/workflows/starter-sync.yml'))).toBe(false);
    expect(existsSync(path.join(out, '.github/workflows/docs.yml'))).toBe(false);
  });

  it('ships SonarCloud settings that skip the Tailwind v4 stylesheet its CSS parser cannot read', () => {
    const settings = readFileSync(path.join(out, '.sonarcloud.properties'), 'utf8');
    expect(settings).toMatch(/^sonar\.exclusions=src\/styles\/utilities\.css$/m);
  });

  it('ships none of the RSK brand tooling (the favicon renderer)', () => {
    expect(existsSync(path.join(out, 'scripts/design-system/favicons'))).toBe(false);
    // The class/prop codemods stay: the starter's own tests and scripts use them.
    expect(existsSync(path.join(out, 'scripts/design-system/codemods'))).toBe(true);
  });

  it('ships no script that runs a file the starter drops (docs:build runs scripts/docs/)', () => {
    const pkg = JSON.parse(readFileSync(path.join(out, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(pkg.scripts['docs:build']).toBeUndefined();
    expect(Object.values(pkg.scripts).filter((command) => command.includes('scripts/docs/'))).toEqual([]);
  });

  it('points the DTO generator at a placeholder API, never a real one', () => {
    const defaults = readFileSync(path.join(out, 'scripts/cli/config/defaults.ts'), 'utf8');
    const urls = [...defaults.matchAll(/url: '([^']+)'/g)].map((match) => match[1]);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => url.startsWith('https://api.example.com/'))).toBe(true);
  });

  it('ignores .env but keeps .env.example', () => {
    execFileSync('git', ['init', '-q'], { cwd: out });
    const ignored = (file: string) => {
      try {
        execFileSync('git', ['check-ignore', '-q', file], { cwd: out });
        return true;
      } catch {
        return false;
      }
    };
    expect(ignored('.env')).toBe(true);
    expect(ignored('.env.example')).toBe(false);
  });

  it('ships none of the screenshot tests (they shoot the docs site), their config or their runner', () => {
    expect(existsSync(path.join(out, 'tests/visual'))).toBe(false);
    expect(existsSync(path.join(out, 'playwright.config.ts'))).toBe(false);
    expect(existsSync(path.join(out, '.github/workflows/visual.yml'))).toBe(false);
    const pkg = JSON.parse(readFileSync(path.join(out, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.devDependencies['@playwright/test']).toBeUndefined();
    expect(pkg.scripts['visual:test']).toBeUndefined();
  });
});
