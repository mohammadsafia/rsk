// The hosted docs site: the kit with its docs (Vercel serves it at the root; see vercel.json). An app's `vp build`
// never includes the docs; this build turns them on with mode "docs".
//
//   pnpm docs:build                       # → dist-docs/
//   pnpm docs:build --outDir out --base /kit/   # served under a path
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import path from 'node:path';

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};
const outDir = path.resolve(arg('outDir', 'dist-docs'));
const base = arg('base', '/');

execFileSync('corepack', ['pnpm@10.34.7', 'exec', 'vp', 'build', '--mode', 'docs', '--base', base, '--outDir', outDir], {
  stdio: 'inherit',
});
// Hosts that answer an unknown path with 404.html (GitHub Pages, Netlify…): make it the app, so a deep link
// opens the page instead of an error.
copyFileSync(path.join(outDir, 'index.html'), path.join(outDir, '404.html'));
console.log(`Docs site built in ${path.relative(process.cwd(), outDir)}/ (base ${base}).`);
