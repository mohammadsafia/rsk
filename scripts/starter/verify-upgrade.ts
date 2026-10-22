/**
 * Proves an app made from the starter before this kit updates cleanly: builds the starter as it was published
 * (`git merge-base HEAD main`), adds a block, runs the app's own kit:update (the old updater) onto the new starter,
 * expects its type check to pass before any wiring, runs kit:update again (now the new updater, which names the
 * missing router adapter), wires the adapter as it says (bootstrap and the app's memory-router tests), and expects the
 * type check, lint, tests and build to pass.
 *
 * Run by starter:verify with the starter it just built; on its own: tsx scripts/starter/verify-upgrade.ts <new-starter>
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { installArgs } from './install';

const ROOT = path.resolve(import.meta.dirname, '../..');
const pnpm = ['pnpm@10.34.7'];

const run = (cwd: string, args: string[], capture = false): string => {
  console.log(`\n$ (${path.basename(cwd)}) corepack ${[...pnpm, ...args].join(' ')}`);
  const output = execFileSync('corepack', [...pnpm, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: { ...process.env, CI: '1' },
  });
  if (capture) process.stdout.write(output);
  return output ?? '';
};

const edit = (file: string, find: string, replace: string) => {
  const source = readFileSync(file, 'utf8');
  if (!source.includes(find)) throw new Error(`verify-upgrade: "${find}" not found in ${file}`);
  writeFileSync(file, source.replace(find, replace));
};

const testFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? testFiles(full) : /\.test\.tsx$/.test(name) ? [full] : [];
  });

/** As kit:update says: the app's own tests that render under a memory router get the adapter around it too. */
const wrapRouterTests = (app: string): string[] =>
  testFiles(path.join(app, 'src')).flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    const wrapped = source
      .replace(/<MemoryRouter\b/g, '<ReactRouterKitProvider><MemoryRouter')
      .replaceAll('</MemoryRouter>', '</MemoryRouter></ReactRouterKitProvider>')
      .replace(/<RouterProvider\b([^>]*?)\/>/g, '<ReactRouterKitProvider><RouterProvider$1/></ReactRouterKitProvider>');
    if (wrapped === source) return [];
    let adapter = path.relative(path.dirname(file), path.join(app, 'src/routes/routerAdapter')).split(path.sep).join('/');
    if (!adapter.startsWith('.')) adapter = `./${adapter}`;
    // After the header comments: `// @vitest-environment` must stay first.
    const lines = wrapped.split('\n');
    const at = lines.findIndex((line) => !line.startsWith('//'));
    lines.splice(at, 0, `import { ReactRouterKitProvider } from '${adapter}';`);
    writeFileSync(file, lines.join('\n'));
    return [path.relative(app, file)];
  });

export function verifyUpgrade(newStarter: string) {
  const scratch = mkdtempSync(path.join(os.tmpdir(), 'rsk-upgrade-'));
  const oldTree = path.join(scratch, 'kit');
  const app = path.join(scratch, 'app');
  const base = execFileSync('git', ['merge-base', 'HEAD', 'main'], { cwd: ROOT, encoding: 'utf8' }).trim();
  try {
    // 1. The starter as it was published before this branch, and an app made from it that added a block.
    execFileSync('git', ['worktree', 'add', '--detach', oldTree, base], { cwd: ROOT, stdio: 'inherit' });
    run(oldTree, installArgs());
    run(oldTree, ['exec', 'tsx', 'scripts/starter/build-starter.ts', app]);
    run(app, installArgs());
    run(app, ['exec', 'tsx', 'scripts/kit/add.ts', 'add', 'system-pages', '--from', '.']);

    // 2. The app's own (old) kit:update onto the new starter: the type check passes before the app wires anything.
    run(app, ['exec', 'tsx', 'scripts/kit/kit.ts', 'update', '--from', newStarter]);
    run(app, ['exec', 'tsc', '-b']);

    // 3. kit:update again, now the new updater: it names the router adapter the app still lacks.
    const output = run(app, ['exec', 'tsx', 'scripts/kit/kit.ts', 'update', '--from', newStarter], true);
    if (!/To finish this update:[\s\S]*KitRouterProvider/.test(output))
      throw new Error('verify-upgrade: the second kit:update did not name the missing KitRouterProvider');

    // 4. Wire it as the message says, then the app checks, tests and builds.
    copyFileSync(path.join(newStarter, 'src/routes/routerAdapter.tsx'), path.join(app, 'src/routes/routerAdapter.tsx'));
    const bootstrap = path.join(app, 'src/bootstrap.tsx');
    edit(
      bootstrap,
      "import { ROUTER } from '@routes';",
      "import { ROUTER } from '@routes';\nimport { ReactRouterKitProvider } from './routes/routerAdapter';",
    );
    edit(
      bootstrap,
      '<RouterProvider router={ROUTER} />',
      '<ReactRouterKitProvider>\n                      <RouterProvider router={ROUTER} />\n                    </ReactRouterKitProvider>',
    );
    const tests = wrapRouterTests(app);
    run(app, ['exec', 'tsx', 'scripts/kit/kit.ts', 'status', '--from', newStarter]);
    run(app, ['exec', 'tsc', '-b']);
    run(app, ['exec', 'vp', 'fmt', 'src/bootstrap.tsx', ...tests]);
    run(app, ['exec', 'vp', 'check']);
    run(app, ['exec', 'vp', 'test', '--run']);
    run(app, ['exec', 'vp', 'build']);
    console.log(`\nUpgrade verified: an app from rsk@${base.slice(0, 7)} updates onto this kit.`);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', oldTree], { cwd: ROOT, stdio: 'ignore' });
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) verifyUpgrade(path.resolve(process.argv[2] ?? '.starter'));
