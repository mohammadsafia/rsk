import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { APP_STEPS } from '../../scripts/kit/app-steps';
import { needsSelfUpdate, updateGaps } from '../../scripts/kit/gaps';

/** A Vite app from before the router adapter: its bootstrap renders React Router straight away. */
const viteApp = (bootstrap = 'root.render(<RouterProvider router={ROUTER} />);'): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'kit-gaps-'));
  mkdirSync(path.join(dir, 'src/routes'), { recursive: true });
  writeFileSync(path.join(dir, 'kit.lock.json'), JSON.stringify({ kit: 'aaaaaaa', files: {} }));
  writeFileSync(path.join(dir, 'src/bootstrap.tsx'), bootstrap);
  // Wired for blocks already, so only the adapter is missing.
  writeFileSync(path.join(dir, 'src/routes/router.tsx'), 'appBlockRoutes bareBlockRoutes BlockErrorElement');
  writeFileSync(path.join(dir, 'src/routes/routes.ts'), 'blockNav');
  writeFileSync(path.join(dir, 'tsconfig.app.json'), '"@blocks/*" "@locales/*"');
  mkdirSync(path.join(dir, 'src/locales'));
  writeFileSync(path.join(dir, 'src/locales/index.ts'), "'!./{en,ar}/block-*.json'");
  return dir;
};

describe('kit:update wiring gaps', () => {
  it('reports a Vite app without the KitRouterProvider, and nothing once it has one', () => {
    expect(updateGaps(viteApp()).join('\n')).toMatch(/KitRouterProvider/);
    expect(updateGaps(viteApp('<ReactRouterKitProvider><RouterProvider router={ROUTER} /></ReactRouterKitProvider>'))).toEqual([]);
  });

  it('still reports it when the adapter file was copied but nothing renders it', () => {
    const dir = viteApp();
    writeFileSync(
      path.join(dir, 'src/routes/routerAdapter.tsx'),
      'export const ReactRouterKitProvider = ({ children }) => <KitRouterProvider router={adapter}>{children}</KitRouterProvider>;',
    );
    expect(updateGaps(dir).join('\n')).toMatch(/KitRouterProvider/);
  });

  it('names the adapter file to copy from the starter it updated from', () => {
    const starter = viteApp();
    writeFileSync(path.join(starter, 'src/routes/routerAdapter.tsx'), 'export const reactRouterKitAdapter = {};');
    expect(updateGaps(viteApp(), starter).join('\n')).toContain('export const reactRouterKitAdapter = {};');
  });

  it('asks a Vite app still fetching Google Fonts to serve the fonts itself, and says nothing once it does', () => {
    const dir = viteApp('<ReactRouterKitProvider><RouterProvider router={ROUTER} /></ReactRouterKitProvider>');
    writeFileSync(path.join(dir, 'src/index.css'), "@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk');\n");
    expect(updateGaps(dir).join('\n')).toMatch(
      /src\/index\.css: replace the Google Fonts @import[\s\S]*@fontsource-variable\/schibsted-grotesk/,
    );
    writeFileSync(path.join(dir, 'src/index.css'), "@import '@fontsource-variable/schibsted-grotesk';\n");
    expect(updateGaps(dir)).toEqual([]);
  });

  // A release also changes files the app owns (its package.json, vite.config.ts, the theme:accent script), which
  // kit:update never copies. "To finish this update" named only the font change, so an existing app never learned it
  // needed the others. Each step is detected from the app's own files and listed until it is done.
  describe('release steps for the app’s own files', () => {
    const WIRED = '<ReactRouterKitProvider><RouterProvider router={ROUTER} /></ReactRouterKitProvider>';
    const OLD_ACCENT = "writeFileSync(file, applyAccent(css, theme));\nconsole.log('Wrote src/styles/tokens.css.');\n";
    const NEW_ACCENT =
      "export const ACCENT_FILE = 'src/app-config/accent.css';\nwriteFileSync(path.resolve(ACCENT_FILE), accentCss(theme));\n";
    const OLD_VITE = 'export default defineConfig({\n  server: {\n    port: 3000,\n    open: true,\n  },\n});\n';
    const NEW_VITE = "import { devServer } from './scripts/lib/dev-server';\nexport default defineConfig({\n  server: devServer(),\n});\n";
    const scripts = (extra: Record<string, string> = {}) =>
      JSON.stringify({
        scripts: { 'kit:status': 'tsx scripts/kit/kit.ts status', 'kit:update': 'tsx scripts/kit/kit.ts update', ...extra },
      });
    /** A wired Vite app whose own files are as a release before these steps left them. */
    const olderApp = () => {
      const dir = viteApp(WIRED);
      mkdirSync(path.join(dir, 'scripts/design-system'), { recursive: true });
      writeFileSync(path.join(dir, 'scripts/design-system/theme-accent.ts'), OLD_ACCENT);
      writeFileSync(path.join(dir, 'package.json'), scripts());
      writeFileSync(path.join(dir, 'vite.config.ts'), OLD_VITE);
      return dir;
    };
    const gapFor = (dir: string, file: string) => updateGaps(dir).find((gap) => gap.startsWith(file)) ?? '';

    it('asks for the starter’s theme:accent script and its test, then a fresh pnpm theme:accent, while it still edits tokens.css', () => {
      const gap = gapFor(olderApp(), 'scripts/design-system/theme-accent.ts');
      expect(gap).toContain('scripts/design-system/theme-accent-file.test.ts');
      expect(gap).toContain('src/app-config/accent.css');
      expect(gap).toMatch(/pnpm theme:accent/);
    });

    it('asks for the kit:accept script while package.json has none', () => {
      expect(gapFor(olderApp(), 'package.json')).toContain('"kit:accept": "tsx scripts/kit/kit.ts accept"');
    });

    it('asks a Vite app for server: devServer() while vite.config.ts sets the port by hand', () => {
      const gap = gapFor(olderApp(), 'vite.config.ts');
      expect(gap).toContain('server: devServer()');
      expect(gap).toContain("import { devServer } from './scripts/lib/dev-server';");
    });

    it('lists no step the app has already taken', () => {
      const dir = olderApp();
      writeFileSync(path.join(dir, 'scripts/design-system/theme-accent.ts'), NEW_ACCENT);
      writeFileSync(path.join(dir, 'scripts/design-system/theme-accent-file.test.ts'), '// the accent file tests\n');
      writeFileSync(path.join(dir, 'package.json'), scripts({ 'kit:accept': 'tsx scripts/kit/kit.ts accept' }));
      writeFileSync(path.join(dir, 'vite.config.ts'), NEW_VITE);
      expect(updateGaps(dir)).toEqual([]);
    });

    it('declares each step once, as data: what it is for, which app files, and how to tell it is still to do', () => {
      expect(APP_STEPS.length).toBeGreaterThan(0);
      const ids = APP_STEPS.map((step) => step.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const step of APP_STEPS) {
        expect(step.files.length, step.id).toBeGreaterThan(0);
        expect(step.targets.length, step.id).toBeGreaterThan(0);
      }
    });

    it('a Next app is not asked for the Vite dev server', () => {
      const dir = olderApp();
      writeFileSync(path.join(dir, 'kit.lock.json'), JSON.stringify({ kit: 'aaaaaaa', target: 'next', files: {} }));
      expect(gapFor(dir, 'vite.config.ts')).toBe('');
      expect(gapFor(dir, 'package.json')).not.toBe('');
    });
  });

  it('asks for a self-update only when the kit updater itself changed', () => {
    expect(needsSelfUpdate([{ path: 'scripts/kit/kit.ts', status: 'updated' }])).toBe(true);
    expect(needsSelfUpdate([{ path: 'scripts/kit/gaps.ts', status: 'added' }])).toBe(true);
    expect(needsSelfUpdate([{ path: 'scripts/kit/kit.ts', status: 'modified' }])).toBe(false);
    expect(needsSelfUpdate([{ path: 'src/components/ui/button/Button.tsx', status: 'updated' }])).toBe(false);
  });
});
