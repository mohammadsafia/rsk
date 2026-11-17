/**
 * What a kit release asks of the app's own files. kit:update copies kit files only: a release that also changes an
 * app-owned file (package.json, vite.config.ts, src/index.css, the theme:accent script) reaches an existing app only as
 * a step it takes by hand. Each step is declared here once, as data: the files it concerns, the starters it applies to,
 * how to tell from the app's files that it is still to do, and what to do. kit:update ("To finish this update") and
 * kit:status list the steps still to do, so a step the app has taken is never listed again.
 *
 * A release that changes an app-owned file the starter ships adds its step here, with a test in tests/kit/gaps.test.ts.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { KitTarget } from './core';

/** The app as a step reads it. */
export type AppView = {
  target: KitTarget;
  /** The starter repository the app updates from (owner/repo), for links to the starter's version of a file. */
  starter: string;
  /** An app file's text, or null when the app has no such file. */
  read: (file: string) => string | null;
};

export type AppStep = {
  /** A stable name, for tests and for a release note to point at. */
  id: string;
  /** The starters whose apps need it. */
  targets: KitTarget[];
  /** The app-owned files it changes; the first names the step in kit:update's list. */
  files: string[];
  /** True while the app's files show the step is still to do. A file the app does not have means nothing to do. */
  pending: (app: AppView) => boolean;
  /** What to do, as kit:update prints it (the first line starts with the step's first file). */
  todo: (app: AppView) => string[];
};

const FONT_PACKAGES = ['schibsted-grotesk', 'noto-kufi-arabic', 'spline-sans-mono'].map((name) => `@fontsource-variable/${name}`);
const INSTALL_FONTS = `pnpm add ${FONT_PACKAGES.join(' ')}`;
const ACCENT_SCRIPT = 'scripts/design-system/theme-accent.ts';
const ACCENT_TEST = 'scripts/design-system/theme-accent-file.test.ts';
const ACCENT_FILE = 'src/app-config/accent.css';
const ACCENT_IMPORT = "@import './app-config/accent.css';";
const KIT_ACCEPT = 'tsx scripts/kit/kit.ts accept';

/** The starter's version of a file, to copy. */
const starterFile = (app: AppView, file: string) => `https://github.com/${app.starter}/blob/main/${file}`;

export const APP_STEPS: AppStep[] = [
  {
    // An app made before the kit served its own fonts fetches them from Google at run time; the kit's font check fails.
    id: 'self-hosted-fonts-vite',
    targets: ['vite'],
    files: ['src/index.css'],
    pending: (app) => /fonts\.googleapis\.com/.test(app.read('src/index.css') ?? ''),
    todo: () => [
      'src/index.css: replace the Google Fonts @import with the fonts served with the app:',
      `  ${INSTALL_FONTS}`,
      ...FONT_PACKAGES.map((name) => `  @import '${name}';`),
      "  and, after the @custom-variant line, :root { --font-brand-sans: 'Schibsted Grotesk Variable';",
      "  --font-brand-arabic: 'Noto Kufi Arabic Variable'; --font-brand-mono: 'Spline Sans Mono Variable'; }",
    ],
  },
  {
    // The Next app's equivalent: next/font/google fetches the fonts at build time.
    id: 'self-hosted-fonts-next',
    targets: ['next'],
    files: ['app/fonts.ts'],
    pending: (app) => /from\s+['"]next\/font\/google['"]/.test(app.read('app/fonts.ts') ?? ''),
    todo: () => [
      'app/fonts.ts: load the fonts with next/font/local from the @fontsource-variable files instead of next/font/google',
      `  (${INSTALL_FONTS}; the starter's app/fonts.ts shows the three calls). next build then fetches nothing.`,
    ],
  },
  {
    // theme:accent wrote the brand accent into the kit's tokens.css, so every kit:update had to merge the app's brand.
    id: 'accent-file',
    targets: ['vite', 'next'],
    files: [ACCENT_SCRIPT, ACCENT_TEST, ACCENT_FILE, 'src/index.css'],
    pending: (app) => {
      const script = app.read(ACCENT_SCRIPT);
      if (script === null) return false;
      const index = app.read('src/index.css');
      // The new test checks src/index.css imports the accent file, so the step is done only once it does.
      return !script.includes(ACCENT_FILE) || app.read(ACCENT_TEST) === null || (index !== null && !index.includes(ACCENT_IMPORT));
    },
    todo: (app) => [
      `${ACCENT_SCRIPT} and ${ACCENT_TEST}: take the starter's versions (theme:accent now writes your accent to`,
      `  ${ACCENT_FILE}, imported by src/index.css, instead of the kit's src/styles/tokens.css):`,
      `  ${starterFile(app, ACCENT_SCRIPT)}`,
      `  ${starterFile(app, ACCENT_TEST)}`,
      '  then run pnpm theme:accent "<your brand colour>" again: it writes the accent file and adds',
      `  ${ACCENT_IMPORT} after the tokens.css import in src/index.css, so kit:update takes the kit’s tokens.css as it`,
      `  is. An app on the kit's own accent instead takes the starter's ${ACCENT_FILE} and adds that @import line itself.`,
    ],
  },
  {
    // kit:accept records a kit file the app changes or deletes on purpose; the script is only in newer package.json.
    id: 'kit-accept-script',
    targets: ['vite', 'next'],
    files: ['package.json'],
    pending: (app) => {
      const manifest = app.read('package.json');
      if (manifest === null) return false;
      const { scripts = {} } = JSON.parse(manifest) as { scripts?: Record<string, string> };
      return !scripts['kit:accept'];
    },
    todo: () => [
      `package.json: add the kit:accept script beside kit:status and kit:update: "kit:accept": "${KIT_ACCEPT}"`,
      '  (it records a kit file you change or delete on purpose, with the reason, so kit:status explains it).',
    ],
  },
  {
    // The dev server's port and API proxy come from the environment (scripts/lib/dev-server.ts, a kit file), so two
    // copies of an app can run side by side.
    id: 'dev-server',
    targets: ['vite'],
    files: ['vite.config.ts'],
    pending: (app) => {
      const config = app.read('vite.config.ts');
      return config !== null && !/\bdevServer\(/.test(config);
    },
    todo: () => [
      "vite.config.ts: import { devServer } from './scripts/lib/dev-server'; and set server: devServer() in place of",
      '  server: { port: 3000, open: true }. Port 3000 stays the default; FRONTEND_PORT and API_PROXY_TARGET change it.',
    ],
  },
];

/** The steps the app at `appDir` still has to take, each as one kit:update list entry. */
export function appStepGaps(appDir: string, target: KitTarget, starter: string): string[] {
  const read = (file: string) => (existsSync(path.join(appDir, file)) ? readFileSync(path.join(appDir, file), 'utf8') : null);
  const app: AppView = { target, starter, read };
  return APP_STEPS.filter((step) => step.targets.includes(target) && step.pending(app)).map((step) => step.todo(app).join('\n'));
}
