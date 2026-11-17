// tests/kit/kit.test.ts — kit:status / kit:update, on throwaway app, upstream and base folders.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  acceptChanges,
  applyUpdate,
  checkUpstream,
  classify,
  dependencyChanges,
  hashFile,
  inScope,
  parseArgs,
  parseLock,
  EXTENSION_POINTS,
  readTree,
  stageUpstream,
  statusReport,
  writeLock,
} from '../../scripts/kit/core';

const dir = () => mkdtempSync(path.join(tmpdir(), 'kit-'));
const put = (root: string, file: string, text: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), text);
};
const read = (root: string, file: string) => readFileSync(path.join(root, file), 'utf8');

const BUTTON = 'src/components/ui/button/Button.tsx';
const CARD = 'src/components/ui/card/Card.tsx';
const OLD = 'src/components/ui/old/Old.tsx';
const NEW = 'src/components/ui/new/New.tsx';
const MINE = 'src/components/ui/button/MyButton.tsx';
const PAGE = 'src/pages/dashboard/DashboardPage.tsx';

/** base = the version the app took; app = base + its own edits; upstream = the kit now. */
const scenario = () => {
  const base = dir();
  put(base, BUTTON, 'one\ntwo\nthree\n');
  put(base, CARD, 'card v1\n');
  put(base, OLD, 'old\n');
  put(base, PAGE, 'page\n');
  put(base, 'src/components/ui/tag/Tag.tsx', 'a\nb\nc\nd\ne\n');

  const app = dir();
  for (const file of [BUTTON, CARD, OLD, PAGE, 'src/components/ui/tag/Tag.tsx']) put(app, file, read(base, file));
  writeLock(app, 'aaaaaaa', readTree(app));
  put(app, CARD, 'card v1 with my tweak\n'); // changed locally only
  put(app, MINE, 'mine\n'); // the app's own file
  put(app, 'src/components/ui/tag/Tag.tsx', 'A\nb\nc\nd\ne\n'); // both sides change, different lines
  put(app, PAGE, 'my page\n'); // app-owned: never in scope

  const upstream = dir();
  put(upstream, BUTTON, 'one\ntwo\nthree\nfour\n'); // updated upstream only
  put(upstream, CARD, 'card v1\n');
  put(upstream, NEW, 'new\n'); // added upstream; OLD removed upstream
  put(upstream, 'src/components/ui/tag/Tag.tsx', 'a\nb\nc\nd\nE\n');
  put(upstream, PAGE, 'their page\n');
  return { base, app, upstream };
};

const statusOf = (rows: { path: string; status: string }[], file: string) => rows.find((row) => row.path === file)?.status;

describe('kit scope', () => {
  it('owns components, hooks, utils, styles and the gates; never pages, routes, layouts, api or locales', () => {
    expect(inScope(BUTTON)).toBe(true);
    expect(inScope('src/lib/hooks/shared/useDate.ts')).toBe(true);
    expect(inScope('scripts/bundle/first-load.mjs')).toBe(true);
    for (const file of [
      PAGE,
      'src/routes/router.tsx',
      'src/layouts/app-layout/AppLayout.tsx',
      'src/api/x.ts',
      'src/locales/en/common.json',
      'package.json',
      // A Next app's own routes, proxy and router adapter.
      'app/[lang]/layout.tsx',
      'app/[lang]/(app)/dashboard/page.tsx',
      'proxy.ts',
      'src/routes/routerAdapter.tsx',
    ])
      expect(inScope(file)).toBe(false);
  });
});

describe('kit:status', () => {
  it('sorts every kit file: updated, added, removed, changed locally, changed on both sides; ignores the app’s own', () => {
    const { app, upstream } = scenario();
    const lock = parseLock(read(app, 'kit.lock.json'));
    const rows = classify(lock, readTree(app), readTree(upstream));
    expect(statusOf(rows, BUTTON)).toBe('updated');
    expect(statusOf(rows, NEW)).toBe('added');
    expect(statusOf(rows, OLD)).toBe('removed');
    expect(statusOf(rows, CARD)).toBe('modified');
    expect(statusOf(rows, 'src/components/ui/tag/Tag.tsx')).toBe('conflict');
    expect(statusOf(rows, MINE)).toBeUndefined();
    expect(statusOf(rows, PAGE)).toBeUndefined();
  });

  it('calls a file the app removed but upstream changed a conflict, never a silent re-add', () => {
    const { app, upstream } = scenario();
    const lock = parseLock(read(app, 'kit.lock.json'));
    const local = readTree(app);
    local.delete(BUTTON);
    expect(statusOf(classify(lock, local, readTree(upstream)), BUTTON)).toBe('conflict');
  });
});

describe('kit:update', () => {
  it('takes safe changes, merges both-sides edits three ways, keeps the app’s edits and own files, refreshes the lock', () => {
    const { base, app, upstream } = scenario();
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
    expect(read(app, BUTTON)).toBe('one\ntwo\nthree\nfour\n');
    expect(read(app, NEW)).toBe('new\n');
    expect(existsSync(path.join(app, OLD))).toBe(false);
    expect(read(app, CARD)).toBe('card v1 with my tweak\n');
    expect(read(app, 'src/components/ui/tag/Tag.tsx')).toBe('A\nb\nc\nd\nE\n');
    expect(read(app, MINE)).toBe('mine\n');
    expect(read(app, PAGE)).toBe('my page\n');
    expect(result.merged).toEqual(['src/components/ui/tag/Tag.tsx']);
    expect(result.conflicts).toEqual([]);
    const lock = parseLock(read(app, 'kit.lock.json'));
    expect(lock.kit).toBe('bbbbbbb');
    expect(lock.files[BUTTON]).toBe(hashFile(path.join(upstream, BUTTON)));
    expect(lock.files[OLD]).toBeUndefined();
    // A file the app keeps changed stays "changed locally" next time, not "updated".
    expect(statusOf(classify(lock, readTree(app), readTree(upstream)), CARD)).toBe('modified');
  });

  it('marks colliding edits with conflict markers and lists them', () => {
    const { base, app, upstream } = scenario();
    put(app, 'src/components/ui/tag/Tag.tsx', 'a\nb\nc\nd\nmine\n');
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
    expect(result.conflicts).toEqual(['src/components/ui/tag/Tag.tsx']);
    expect(read(app, 'src/components/ui/tag/Tag.tsx')).toMatch(/<<<<<<< yours[\s\S]*mine[\s\S]*=======[\s\S]*E[\s\S]*>>>>>>> kit/);
  });

  it('without a base, keeps the app’s file and writes the kit’s version beside it', () => {
    const { app, upstream } = scenario();
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, kit: 'bbbbbbb' });
    expect(read(app, 'src/components/ui/tag/Tag.tsx')).toBe('A\nb\nc\nd\ne\n');
    expect(read(app, 'src/components/ui/tag/Tag.tsx.upstream')).toBe('a\nb\nc\nd\nE\n');
    expect(result.conflicts).toEqual(['src/components/ui/tag/Tag.tsx']);
  });

  it('--dry-run writes nothing', () => {
    const { base, app, upstream } = scenario();
    const before = read(app, 'kit.lock.json');
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb', dryRun: true });
    expect(result.updated).toContain(BUTTON);
    expect(read(app, BUTTON)).toBe('one\ntwo\nthree\n');
    expect(read(app, 'kit.lock.json')).toBe(before);
  });

  it('only touches the paths asked for', () => {
    const { base, app, upstream } = scenario();
    applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb', only: ['src/components/ui/new/'] });
    expect(read(app, NEW)).toBe('new\n');
    expect(read(app, BUTTON)).toBe('one\ntwo\nthree\n');
  });
});

describe('dependency changes', () => {
  it('lists added and changed upstream dependencies as one pnpm add line, and nothing when they match', () => {
    const local = { dependencies: { react: '^19.2.0', zod: '^4.0.0' }, devDependencies: { vitest: '1.0.0' } };
    const upstream = {
      dependencies: { react: '^19.3.0', zod: '^4.0.0', clsx: '^2.1.0' },
      devDependencies: { vitest: '1.0.0', playwright: '1.50.0' },
    };
    expect(dependencyChanges(local, upstream)).toBe('pnpm add clsx@^2.1.0 react@^19.3.0 && pnpm add -D playwright@1.50.0');
    expect(dependencyChanges(local, local)).toBeNull();
  });
});

describe('kit:update safety', () => {
  it('a partial update keeps the lock’s kit version, so a later full update still merges against the right base', () => {
    const { base, app, upstream } = scenario();
    applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb', only: ['src/components/ui/new/'] });
    const lock = parseLock(read(app, 'kit.lock.json'));
    expect(lock.kit).toBe('aaaaaaa');
    expect(lock.files[NEW]).toBe(hashFile(path.join(upstream, NEW)));
  });

  it('accepts ./ and backslash paths, and refuses a path that matches no kit file', () => {
    const { base, app, upstream } = scenario();
    applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb', only: ['./src\\components\\ui\\new'] });
    expect(read(app, NEW)).toBe('new\n');
    expect(() => applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb', only: ['src/componnets/'] })).toThrow(
      /matches no kit file/,
    );
  });

  it('never empties a binary file it cannot merge: the app’s copy stays and the kit’s goes beside it', () => {
    const { base, app, upstream } = scenario();
    const ICON = 'src/assets/icons/logo.png';
    const bytes = (tail: number) => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, tail]);
    for (const root of [base, app]) {
      mkdirSync(path.join(root, 'src/assets/icons'), { recursive: true });
      writeFileSync(path.join(root, ICON), bytes(1));
    }
    writeLock(app, 'aaaaaaa', readTree(base));
    writeFileSync(path.join(app, ICON), bytes(2));
    mkdirSync(path.join(upstream, 'src/assets/icons'), { recursive: true });
    writeFileSync(path.join(upstream, ICON), bytes(3));
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
    expect(result.conflicts).toContain(ICON);
    expect(readFileSync(path.join(app, ICON))).toEqual(bytes(2));
    expect(readFileSync(path.join(app, `${ICON}.upstream`))).toEqual(bytes(3));
  });

  it('reads a CRLF checkout (Windows) as the same file, not a local edit', () => {
    const root = dir();
    put(root, 'a.css', 'a {\n  color: red;\n}\n');
    put(root, 'b.css', 'a {\r\n  color: red;\r\n}\r\n');
    expect(hashFile(path.join(root, 'b.css'))).toBe(hashFile(path.join(root, 'a.css')));
  });

  it('refuses a starter folder with no kit.lock.json (it can’t tell what the kit removed)', () => {
    expect(() => checkUpstream(null)).toThrow(/kit\.lock\.json/);
    expect(() => checkUpstream({ kit: 'bbbbbbb', files: {} })).not.toThrow();
  });
});

describe('kit CLI arguments', () => {
  it('reads --flag value and --flag=value, keeps paths, and refuses unknown or valueless flags', () => {
    expect(parseArgs(['update', 'src/components/', '--from', '../s', '--base=../b', '--dry-run'])).toEqual({
      command: 'update',
      paths: ['src/components/'],
      from: '../s',
      base: '../b',
      dryRun: true,
    });
    expect(parseArgs([])).toMatchObject({ command: 'status', paths: [] });
    expect(() => parseArgs(['update', '--from'])).toThrow(/--from needs a value/);
    expect(() => parseArgs(['update', '--force'])).toThrow(/Unknown option --force/);
    expect(() => parseArgs(['upgrade'])).toThrow(/usage/);
  });
});

describe('kit:update with added blocks', () => {
  const BLOCK = 'src/blocks/search-field/SearchField.tsx';
  const LOCALE = 'src/locales/en/block-search-field.json';
  /** A starter whose registry has search-field, and an app that added it. */
  const setup = () => {
    const starter = dir();
    put(starter, 'registry/blocks/search-field/block.json', '{"id":"search-field"}');
    put(starter, `registry/blocks/search-field/files/${BLOCK}`, 'v2\n');
    put(starter, `registry/blocks/search-field/files/${LOCALE}`, '{"v":2}\n');
    put(starter, BUTTON, 'one\ntwo\nthree\n');
    const app = dir();
    put(app, BUTTON, 'one\ntwo\nthree\n');
    put(app, BLOCK, 'v1\n');
    put(app, LOCALE, '{"v":1}\n');
    put(app, 'src/blocks/index.ts', '// generated\n');
    writeLock(app, 'aaaaaaa', readTree(app), ['search-field']);
    return { starter, app };
  };

  it('counts block files and their locale files as kit files, but not the generated index', () => {
    expect(inScope(BLOCK)).toBe(true);
    expect(inScope(LOCALE)).toBe(true);
    expect(inScope('src/locales/en/common.json')).toBe(false);
    expect(inScope('src/blocks/index.ts')).toBe(false);
  });

  it('updates an added block from the registry instead of deleting it as "removed"', () => {
    const { starter, app } = setup();
    const view = stageUpstream(starter, ['search-field']);
    const result = applyUpdate({ appDir: app, upstreamDir: view, kit: 'bbbbbbb' });
    expect(result.removed).toEqual([]);
    expect(read(app, BLOCK)).toBe('v2\n');
    expect(read(app, LOCALE)).toBe('{"v":2}\n');
    expect(parseLock(read(app, 'kit.lock.json')).blocks).toEqual(['search-field']);
  });

  it('never adds a block the app didn’t add', () => {
    const { starter, app } = setup();
    put(starter, 'registry/blocks/other/files/src/blocks/other/Other.tsx', 'x\n');
    applyUpdate({ appDir: app, upstreamDir: stageUpstream(starter, ['search-field']), kit: 'bbbbbbb' });
    expect(existsSync(path.join(app, 'src/blocks/other'))).toBe(false);
  });
});

describe('kit:update and the block index', () => {
  const META = (routes: { path: string; component: string; layout: 'app' | 'bare' }[]) =>
    JSON.stringify({
      id: 'pages',
      title: 'Pages',
      level: 'template',
      family: 'x',
      description: 'x',
      tags: [],
      dependsOn: [],
      packages: {},
      routes,
      nav: [],
    });

  it('keeps a block the kit no longer offers, as the app’s own, instead of deleting it', () => {
    const app = dir();
    const starter = dir();
    put(starter, 'registry/index.json', '[]');
    put(app, 'src/blocks/pages/block.json', META([]));
    put(app, 'src/blocks/pages/index.ts', 'export {};\n');
    put(app, 'src/locales/en/block-pages.json', '{}\n');
    writeLock(app, 'aaaaaaa', readTree(app), ['pages']);
    const result = applyUpdate({ appDir: app, upstreamDir: stageUpstream(starter, ['pages']), kit: 'bbbbbbb' });
    expect(result.removed).toEqual([]);
    expect(result.released).toEqual(['pages']);
    expect(existsSync(path.join(app, 'src/blocks/pages/index.ts'))).toBe(true);
    const lock = parseLock(read(app, 'kit.lock.json'));
    expect(lock.blocks).toEqual([]);
    expect(Object.keys(lock.files).some((file) => file.includes('pages'))).toBe(false);
  });

  it('regenerates src/blocks/index.ts when an update changes a block’s routes', () => {
    const app = dir();
    const starter = dir();
    put(app, 'src/blocks/pages/block.json', META([]));
    put(app, 'src/blocks/pages/index.ts', 'export {};\n');
    put(app, 'src/blocks/index.ts', '// stale\n');
    writeLock(app, 'aaaaaaa', readTree(app), ['pages']);
    put(starter, 'registry/blocks/pages/files/src/blocks/pages/block.json', META([{ path: '/new', component: 'NewPage', layout: 'app' }]));
    put(starter, 'registry/blocks/pages/files/src/blocks/pages/index.ts', 'export const NewPage = () => null;\n');
    applyUpdate({ appDir: app, upstreamDir: stageUpstream(starter, ['pages']), kit: 'bbbbbbb' });
    expect(read(app, 'src/blocks/index.ts')).toContain("import('./pages')).NewPage");
  });
});

describe('kit.lock.json on disk', () => {
  // A scanner's generic rule reads `"…/auth.ts": "<64 random characters>"` as a credential assignment, and a new
  // app's first push then fails its secret scan. Each hash is written as `sha256:<hex>`, which no longer has that shape.
  const SENSITIVE = /(access|auth|api|client|credential|creds|key|passw|secret|token)/i;
  const BARE_VALUE = /["']?\s*[:=,]\s*["']([\w.=-]{10,150})["']/;

  it('writes every hash with the digest prefix, and never a sensitive-looking path beside a bare long value', () => {
    const app = dir();
    for (const file of [
      'src/lib/utils/auth.ts',
      'src/lib/constants/StorageKeys.ts',
      'src/styles/tokens.css',
      'src/components/ui/button/Button.tsx',
    ])
      put(app, file, `// ${file}\n`);
    writeLock(app, 'aaaaaaa', readTree(app), [], {
      generated: { 'app/token/page.tsx': hashFile(path.join(app, 'src/lib/utils/auth.ts')) },
    });

    const text = read(app, 'kit.lock.json');
    const raw = JSON.parse(text) as { files: Record<string, string>; generated: Record<string, string> };
    for (const value of [...Object.values(raw.files), ...Object.values(raw.generated)]) expect(value).toMatch(/^sha256:[0-9a-f]{64}$/);
    for (const line of text.split('\n').filter((each) => SENSITIVE.test(each))) expect(line, line).not.toMatch(BARE_VALUE);
  });

  it('reads hashes as bare hex whether the lock has the prefix or was written before it', () => {
    const app = dir();
    put(app, 'src/lib/utils/auth.ts', 'export const a = 1;\n');
    const hash = hashFile(path.join(app, 'src/lib/utils/auth.ts'));
    writeLock(app, 'aaaaaaa', readTree(app), []);
    expect(parseLock(read(app, 'kit.lock.json')).files['src/lib/utils/auth.ts']).toBe(hash);

    const older = JSON.stringify({ kit: 'aaaaaaa', blocks: [], files: { 'src/lib/utils/auth.ts': hash } });
    expect(parseLock(older).files['src/lib/utils/auth.ts']).toBe(hash);
    // An app made before the prefix is still "unchanged" against the same kit.
    expect(classify(parseLock(older), readTree(app), readTree(app)).every((row) => row.status === 'same')).toBe(true);
  });
});

describe('kit:update reports lock-only changes', () => {
  // An app that already holds the kit's new version of a file (copied by hand, or taken in an earlier partial update)
  // still has the old hash in its lock. kit:update rewrote that hash and listed nothing, so the lock changed in the
  // pull request with no line saying why.
  it('lists a file whose lock record changes although the file itself needs nothing', () => {
    const { base, app, upstream } = scenario();
    put(app, BUTTON, read(upstream, BUTTON)); // the app already has the kit's new Button
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
    expect(result.updated).not.toContain(BUTTON);
    expect(result.relocked).toEqual([BUTTON]);
    expect(parseLock(read(app, 'kit.lock.json')).files[BUTTON]).toBe(hashFile(path.join(upstream, BUTTON)));
  });

  it('lists nothing as lock-only when the lock already matches', () => {
    const { base, app, upstream } = scenario();
    const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
    expect(result.relocked).toEqual([]);
  });

  it('kit:status names the lock-only files too', () => {
    const { app, upstream } = scenario();
    put(app, BUTTON, read(upstream, BUTTON));
    const lock = parseLock(read(app, 'kit.lock.json'));
    const local = readTree(app);
    const report = statusReport(lock, local, readTree(upstream)).join('\n');
    expect(report).toMatch(/only the lock changes \(1\):\n {2}src\/components\/ui\/button\/Button\.tsx/);
  });
});

describe('kit:status accepted app changes', () => {
  it('reports a changed kit file as unexplained until the app accepts it with a reason', () => {
    const { app, upstream } = scenario();
    const before = statusReport(parseLock(read(app, 'kit.lock.json')), readTree(app), readTree(upstream)).join('\n');
    expect(before).toMatch(/changed by you \(kept\) \(1\):\n {2}src\/components\/ui\/card\/Card\.tsx/);
    expect(before).toMatch(/Unexplained changes to kit files: 1/);

    acceptChanges(app, [CARD], 'DEMO-12: the card keeps a tighter padding until the kit has a density option');
    const lock = parseLock(read(app, 'kit.lock.json'));
    expect(lock.accepted?.[CARD]).toEqual({
      reason: 'DEMO-12: the card keeps a tighter padding until the kit has a density option',
      hash: hashFile(path.join(app, CARD)),
    });
    const after = statusReport(lock, readTree(app), readTree(upstream)).join('\n');
    expect(after).toMatch(/changed by you, accepted \(1\):\n {2}src\/components\/ui\/card\/Card\.tsx: DEMO-12/);
    expect(after).toMatch(/Unexplained changes to kit files: none/);
    expect(after).not.toMatch(/changed by you \(kept\)/);
  });

  it('an accepted file changed again is unexplained again', () => {
    const { app, upstream } = scenario();
    acceptChanges(app, [CARD], 'DEMO-12: tighter padding');
    put(app, CARD, 'card v1 with another tweak\n');
    const report = statusReport(parseLock(read(app, 'kit.lock.json')), readTree(app), readTree(upstream)).join('\n');
    expect(report).toMatch(/changed by you \(kept\) \(1\):\n {2}src\/components\/ui\/card\/Card\.tsx \(changed since it was accepted\)/);
    expect(report).toMatch(/Unexplained changes to kit files: 1/);
  });

  it('refuses an empty reason, a file that is not the kit’s, and a kit file the app has not changed', () => {
    const { app } = scenario();
    expect(() => acceptChanges(app, [CARD], '  ')).toThrow(/reason/);
    expect(() => acceptChanges(app, [PAGE], 'mine')).toThrow(/not a kit file/);
    expect(() => acceptChanges(app, [BUTTON], 'why')).toThrow(/same as the kit/);
  });

  it('kit:update keeps an acceptance while the change stands, and drops it once the file matches the kit', () => {
    const { base, app, upstream } = scenario();
    acceptChanges(app, [CARD], 'DEMO-12: tighter padding');
    applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
    expect(parseLock(read(app, 'kit.lock.json')).accepted?.[CARD]?.reason).toBe('DEMO-12: tighter padding');

    put(app, CARD, read(upstream, CARD)); // the app goes back to the kit's version
    applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
    expect(parseLock(read(app, 'kit.lock.json')).accepted).toBeUndefined();
  });

  it('writes the accepted hash with the digest prefix, like every other hash', () => {
    const { app } = scenario();
    acceptChanges(app, [CARD], 'DEMO-12: tighter padding');
    const raw = JSON.parse(read(app, 'kit.lock.json')) as { accepted: Record<string, { hash: string }> };
    expect(raw.accepted[CARD].hash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  // An app deletes a kit file on purpose (a test of the starter's mock sign-in, once a real API signs users in).
  // kit:accept refused it ("an accepted change is a changed file, not a deleted one"), so kit:status could never
  // reach "Unexplained changes to kit files: none" for that app.
  describe('a kit file the app deleted on purpose', () => {
    const DEMO = 'tests/a11y/demo-session.test.ts';
    const REASON = 'DEMO-31: the app signs in through its own API, so the mock sign-in and its test are gone';
    /** The scenario plus a kit test the app took and then deleted. */
    const deleted = () => {
      const { base, app, upstream } = scenario();
      for (const root of [base, app, upstream]) put(root, DEMO, 'demo session\n');
      writeLock(app, 'aaaaaaa', readTree(base));
      put(app, CARD, 'card v1 with my tweak\n');
      rmSync(path.join(app, DEMO));
      return { base, app, upstream };
    };

    it('records the deletion with its reason, and kit:status lists it as accepted and deleted', () => {
      const { app, upstream } = deleted();
      const before = statusReport(parseLock(read(app, 'kit.lock.json')), readTree(app), readTree(upstream)).join('\n');
      expect(before).toMatch(/changed by you \(kept\) \(2\):[\s\S]*tests\/a11y\/demo-session\.test\.ts/);

      acceptChanges(app, [CARD], 'DEMO-12: tighter padding');
      expect(acceptChanges(app, [DEMO], REASON)).toEqual([{ file: DEMO, deleted: true }]);
      const lock = parseLock(read(app, 'kit.lock.json'));
      expect(lock.accepted?.[DEMO]).toEqual({ reason: REASON, deleted: true, hash: hashFile(path.join(upstream, DEMO)) });
      const raw = JSON.parse(read(app, 'kit.lock.json')) as { accepted: Record<string, { hash: string; deleted?: boolean }> };
      expect(raw.accepted[DEMO]).toMatchObject({ deleted: true, hash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/) });

      const after = statusReport(lock, readTree(app), readTree(upstream)).join('\n');
      expect(after).toMatch(/changed by you, accepted \(2\):[\s\S]*\n {2}tests\/a11y\/demo-session\.test\.ts \(deleted\): DEMO-31/);
      expect(after).toMatch(/Unexplained changes to kit files: none/);
    });

    it('lapses when the file reappears', () => {
      const { app, upstream } = deleted();
      acceptChanges(app, [DEMO], REASON);
      put(app, DEMO, 'demo session, back with my edit\n');
      const report = statusReport(parseLock(read(app, 'kit.lock.json')), readTree(app), readTree(upstream)).join('\n');
      expect(report).toMatch(
        /changed by you \(kept\) \([12]\):[\s\S]*tests\/a11y\/demo-session\.test\.ts \(changed since it was accepted\)/,
      );
      expect(report).not.toMatch(/demo-session\.test\.ts \(deleted\)/);
    });

    it('kit:update does not re-create it, says it skipped it, and keeps the acceptance', () => {
      const { base, app, upstream } = deleted();
      acceptChanges(app, [DEMO], REASON);
      const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
      expect(existsSync(path.join(app, DEMO))).toBe(false);
      expect(result.skipped).toEqual([DEMO]);
      expect(result.kept).not.toContain(DEMO);
      expect(parseLock(read(app, 'kit.lock.json')).accepted?.[DEMO]).toMatchObject({ reason: REASON, deleted: true });
    });

    it('lapses when the kit changes the file: kit:status shows it changed on both sides, kit:update drops the acceptance', () => {
      const { base, app, upstream } = deleted();
      acceptChanges(app, [DEMO], REASON);
      put(upstream, DEMO, 'demo session v2\n');
      const report = statusReport(parseLock(read(app, 'kit.lock.json')), readTree(app), readTree(upstream)).join('\n');
      expect(report).toMatch(/changed on both sides \(2\):[\s\S]*tests\/a11y\/demo-session\.test\.ts/);
      expect(report).not.toMatch(/demo-session\.test\.ts \(deleted\)/);

      const result = applyUpdate({ appDir: app, upstreamDir: upstream, baseDir: base, kit: 'bbbbbbb' });
      expect(result.skipped).toEqual([]);
      expect(result.conflicts).toContain(DEMO);
      expect(parseLock(read(app, 'kit.lock.json')).accepted?.[DEMO]).toBeUndefined();
    });
  });

  it('reads `accept <paths> --reason <text>`', () => {
    expect(parseArgs(['accept', CARD, '--reason', 'DEMO-12: why'])).toMatchObject({
      command: 'accept',
      paths: [CARD],
      reason: 'DEMO-12: why',
    });
    expect(() => parseArgs(['accept', CARD])).toThrow(/--reason/);
  });
});

describe('kit files an app is expected to change', () => {
  it('lists an extension point the app filled (its query hooks barrel) as expected, not unexplained', () => {
    const QUERIES = 'src/lib/hooks/queries/index.ts';
    expect(EXTENSION_POINTS).toContain(QUERIES);
    const app = dir();
    put(app, QUERIES, 'export {};\n');
    writeLock(app, 'aaaaaaa', readTree(app));
    const upstream = dir();
    put(upstream, QUERIES, 'export {};\n');
    put(app, QUERIES, "export * from './useVisits';\n");
    const report = statusReport(parseLock(read(app, 'kit.lock.json')), readTree(app), readTree(upstream)).join('\n');
    expect(report).toMatch(
      /changed by you, expected \(the app adds its own exports there\) \(1\):\n {2}src\/lib\/hooks\/queries\/index\.ts/,
    );
    expect(report).toMatch(/Unexplained changes to kit files: none/);
  });

  it('every extension point is a kit file', () => {
    for (const file of EXTENSION_POINTS) expect(inScope(file), file).toBe(true);
  });
});
