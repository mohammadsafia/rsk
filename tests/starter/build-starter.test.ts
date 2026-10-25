import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { hashFile, inScope } from '../../scripts/kit/core';
import { buildStarter } from '../../scripts/starter/build-starter';

import { APP_FILES } from './app-files';

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
    const lock = JSON.parse(readFileSync(path.join(out, 'kit.lock.json'), 'utf8')) as {
      kit: string;
      starter?: string;
      target?: string;
      files: Record<string, string>;
    };
    expect(lock.kit).toBe(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim());
    // kit:update and kit:add download from the repository the lock names.
    expect(lock).toMatchObject({ starter: 'mohammadsafia/rsk-starter', target: 'vite' });
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

  it('has a pre-commit staged block of its own, so vp create doesn’t add one the formatter rejects', () => {
    expect(readFileSync(path.join(out, 'vite.config.ts'), 'utf8')).toContain("staged: {\n    '*': 'vp check --fix',\n  },");
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

describe('buildStarter --target next', () => {
  let next = '';
  let vite = '';
  const json = <T>(dir: string, file: string) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as T;
  type Pkg = {
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    sideEffects: string[];
  };

  beforeAll(() => {
    next = buildStarter(mkdtempSync(path.join(os.tmpdir(), 'rsk-next-starter-test-')), 'next');
    vite = out;
  });

  afterAll(() => {
    rmSync(next, { recursive: true, force: true });
  });

  it('ships the same kit files as the Vite starter (one kit, two starters)', () => {
    type Lock = { files: Record<string, string>; starter: string; target: string };
    expect(json<Lock>(next, 'kit.lock.json').files).toEqual(json<Lock>(vite, 'kit.lock.json').files);
    expect(json<Lock>(next, 'kit.lock.json')).toMatchObject({ starter: 'mohammadsafia/rsk-next-starter', target: 'next' });
  });

  it('is a Next app: next config and app/, no Vite entry, no React Router, Next scripts', () => {
    for (const file of ['next.config.ts', 'postcss.config.mjs', 'app/[lang]/layout.tsx', 'src/routes/routerAdapter.tsx'])
      expect(existsSync(path.join(next, file)), file).toBe(true);
    // Next would read src/pages as Pages Router routes: the shared screens live in src/screens (still @pages).
    expect(existsSync(path.join(next, 'src/pages'))).toBe(false);
    expect(existsSync(path.join(next, 'src/screens/auth/LoginPage.tsx'))).toBe(true);
    expect(readFileSync(path.join(next, 'src/routes/routerAdapter.tsx'), 'utf8')).toContain("from 'next/navigation'");
    for (const file of ['index.html', 'src/main.tsx', 'src/bootstrap.tsx', 'vercel.json', 'src/blocks/index.ts'])
      expect(existsSync(path.join(next, file)), file).toBe(false);
    const pkg = json<Pkg>(next, 'package.json');
    expect(pkg.dependencies.next).toMatch(/^\^16/);
    expect(pkg.dependencies['server-only']).toBeDefined();
    expect(pkg.dependencies['react-router']).toBeUndefined();
    expect(pkg.devDependencies['@tailwindcss/vite']).toBeUndefined();
    expect(pkg.devDependencies['@tailwindcss/postcss']).toBeDefined();
    expect(pkg.scripts).toMatchObject({ dev: 'next dev', build: 'next typegen && tsc -b && next build', start: 'next start' });
    expect(pkg.scripts['a11y:audit']).toBe(
      'node scripts/a11y/audit.mjs --base http://localhost:3000 --seed api --lang-in path --signed-out /login,/forgot-password',
    );
    for (const script of ['preview', 'build:dev', 'bundle:report']) expect(pkg.scripts[script], script).toBeUndefined();
    expect(pkg.sideEffects).toEqual(['*.css', './src/i18n.ts']);
  });

  it('keeps the Vite starter free of the Next packages', () => {
    const pkg = json<Pkg>(vite, 'package.json');
    for (const name of ['next', 'server-only', '@tailwindcss/postcss', 'postcss']) expect(pkg.devDependencies[name], name).toBeUndefined();
  });

  it('writes config in the form next build keeps, and CSS without the remote font import', () => {
    const tsconfig = readFileSync(path.join(next, 'tsconfig.app.json'), 'utf8');
    expect(tsconfig).toContain('"include": ["src", "app", "proxy.ts", "next-env.d.ts", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"]');
    expect(tsconfig).toContain('"exclude": ["node_modules"]');
    expect(tsconfig).toContain('"plugins": [{ "name": "next" }]');
    const css = readFileSync(path.join(next, 'src/index.css'), 'utf8');
    expect(css).not.toContain('fonts.googleapis');
    expect(css).toBe(readFileSync(path.join(vite, 'src/index.css'), 'utf8').split('\n').slice(1).join('\n').replace(/^\n+/, ''));
    const viteConfig = readFileSync(path.join(next, 'vite.config.ts'), 'utf8');
    expect(viteConfig).not.toContain('@tailwindcss/vite');
    expect(viteConfig).toContain("'.next/**'");
  });

  it('maps every locale namespace statically, with no Vite-only import.meta', () => {
    const locales = readFileSync(path.join(next, 'src/locales/index.ts'), 'utf8');
    expect(locales).not.toContain('import.meta');
    // In the formatter's own style, so the app's first vp check passes.
    expect(locales).toContain('  common: enCommon,');
    for (const lang of ['en', 'ar'])
      for (const file of readdirSync(path.join(next, 'src/locales', lang)).filter(
        (name) => name.endsWith('.json') && !name.startsWith('block-'),
      ))
        expect(locales, `${lang}/${file}`).toContain(`'./${lang}/${file}'`);
  });

  it('ships only what the app uses: no showcase API, docs-site code or one-off repo tooling, in either starter', () => {
    const read = (dir: string, file: string) => readFileSync(path.join(dir, file), 'utf8');
    for (const dir of [vite, next]) {
      for (const file of [
        'src/App.tsx',
        'src/api/handlers/doctors.ts',
        'src/api/handlers/lookup.ts',
        'src/assets/images',
        'src/types/rehype-pretty-code.d.ts',
        'scripts/design-system/codemods',
        'tests/design-system/codemods',
        'tests/design-system/migrate-classes.test.ts',
      ])
        expect(existsSync(path.join(dir, file)), `${path.basename(dir)}: ${file}`).toBe(false);
      expect(read(dir, 'src/api/handlers/index.ts')).toBe("export * from './auth';\n");
      expect(read(dir, 'src/index.css')).not.toContain('rehype-pretty-code');
      const { scripts } = json<Pkg>(dir, 'package.json');
      for (const script of ['ds:migrate', 'ds:classes']) expect(scripts[script], script).toBeUndefined();
    }
    expect(read(vite, 'src/api/config/ApiEndpoints.ts')).not.toContain('DOCTORS');
    expect(read(vite, 'src/types/global.d.ts')).not.toContain('material-react-table');
    // The server-rendering cache helper is the Next app's alone.
    expect(read(vite, 'src/api/config/QueryClient.ts')).not.toContain('getQueryClient');
    // A Next app's browser never holds the token, so it has no client that calls the backend with one (Phase 5's BFF
    // client calls /api instead).
    for (const file of [
      'src/api/config/ApiEndpoints.ts',
      'src/api/config/AxiosInstance.ts',
      'src/api/config/AxiosInstance.test.tsx',
      'src/api/config/HttpClient.ts',
      'src/api/config/HttpClient.test.ts',
      'src/types/global.d.ts',
    ])
      expect(existsSync(path.join(next, file)), file).toBe(false);
    expect(read(next, 'src/api/config/index.ts')).toBe("export * from './getQueryClient';\nexport * from './QueryClient';\n");
  });

  it('ships exactly the reviewed app files, in each starter (tests/starter/app-files.ts)', () => {
    const appFiles = (dir: string) => [
      ...new Set(
        walk(dir)
          .map((file) => path.relative(dir, file).split(path.sep).join('/'))
          // .git: an earlier test runs git init in the Vite starter.
          .filter((file) => !inScope(file) && !file.startsWith('registry/') && !file.startsWith('.git/'))
          .map((file) => (file.startsWith('scripts/cli/') ? 'scripts/cli/' : file)),
      ),
    ];
    expect(appFiles(vite).sort()).toEqual([...APP_FILES.vite].sort());
    expect(appFiles(next).sort()).toEqual([...APP_FILES.next].sort());
  });

  it('leaves no barrel pointing at a dropped file, and ships its own env template', () => {
    const barrels = walk(path.join(next, 'src')).filter((file) => file.endsWith('/index.ts'));
    const broken = barrels.flatMap((barrel) =>
      [...readFileSync(barrel, 'utf8').matchAll(/from '(\.[^']+)'/g)]
        .map((match) => path.resolve(path.dirname(barrel), match[1]))
        .filter((target) => !['', '.ts', '.tsx', '/index.ts', '/index.tsx', '.json'].some((ext) => existsSync(`${target}${ext}`)))
        .map((target) => `${path.relative(next, barrel)} → ${path.relative(next, target)}`),
    );
    expect(broken).toEqual([]);
    const env = readFileSync(path.join(next, '.env.example'), 'utf8');
    for (const key of ['NEXT_PUBLIC_SITE_URL', 'API_URL', 'SESSION_SECRET', 'AUTH_MOCK']) expect(env).toMatch(new RegExp(`^${key}=`, 'm'));
    expect(env).toMatch(/^SESSION_SECRET=$/m);
  });
});
