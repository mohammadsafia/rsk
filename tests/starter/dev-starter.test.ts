import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { devTarget, isTemporary, syncChange } from '../../scripts/starter/dev-starter';

describe('devTarget: where a file changed in the repo goes in the dev Next app', () => {
  it('a kit file goes where it is', () => {
    expect(devTarget('src/components/ui/button/Button.tsx')).toBe('src/components/ui/button/Button.tsx');
    expect(devTarget('src/locales/ar/common.json')).toBe('src/locales/ar/common.json');
  });

  it("the overlays' files go to the app's root, their pages to src/screens", () => {
    expect(devTarget('scripts/starter/overlay/next/app/[lang]/layout.tsx')).toBe('app/[lang]/layout.tsx');
    expect(devTarget('scripts/starter/overlay/next/src/pages/members/MembersPage.tsx')).toBe('src/screens/members/MembersPage.tsx');
    expect(devTarget('scripts/starter/overlay/common/src/pages/dashboard/DashboardPage.tsx')).toBe(
      'src/screens/dashboard/DashboardPage.tsx',
    );
  });

  it("leaves out the Vite overlay, the docs and anything the Next app doesn't have", () => {
    for (const file of [
      'scripts/starter/overlay/vite/src/routes/router.tsx',
      'src/pages/docs/x.tsx',
      'src/component-docs/x.mdx',
      'README.md',
    ])
      expect(devTarget(file), file).toBeNull();
  });
});

describe('isTemporary', () => {
  it("knows editors' and tools' temporary files, so they never reach the app", () => {
    for (const file of ['src/locales/en/.!46700!auth.json', 'src/a/.#Button.tsx', 'src/a/Button.tsx.swp', 'src/a/Button.tsx~'])
      expect(isTemporary(file), file).toBe(true);
    for (const file of ['src/locales/en/auth.json', 'scripts/starter/overlay/next/.env.example'])
      expect(isTemporary(file), file).toBe(false);
  });
});

describe('devTarget: what the build rewrites or moves', () => {
  it('leaves out the files the build rewrites for the app (they need --fresh)', () => {
    for (const file of ['src/index.css', 'src/locales/en/nav.json', 'src/locales/ar/nav.json']) expect(devTarget(file), file).toBeNull();
  });

  it("sends a block's sources to the app's block catalogue, where kit:add reads them", () => {
    expect(devTarget('src/blocks/system-pages/NotFoundPage.tsx')).toBe(
      'registry/blocks/system-pages/files/src/blocks/system-pages/NotFoundPage.tsx',
    );
    expect(devTarget('src/blocks/system-pages/block.json')).toBe('registry/blocks/system-pages/block.json');
    expect(devTarget('src/locales/ar/block-system-pages.json')).toBe(
      'registry/blocks/system-pages/files/src/locales/ar/block-system-pages.json',
    );
  });
});

describe('syncChange', () => {
  const setup = () => {
    const root = mkdtempSync(path.join(tmpdir(), 'dev-root-'));
    const app = mkdtempSync(path.join(tmpdir(), 'dev-app-'));
    return { root, app };
  };

  it('copies a saved file, and a folder event is no error (its files come as their own events)', () => {
    const { root, app } = setup();
    mkdirSync(path.join(root, 'src/components/new-thing'), { recursive: true });
    expect(() => syncChange(root, app, 'src/components/new-thing')).not.toThrow();
    writeFileSync(path.join(root, 'src/components/new-thing/Thing.tsx'), 'export {};\n');
    syncChange(root, app, 'src/components/new-thing/Thing.tsx');
    expect(existsSync(path.join(app, 'src/components/new-thing/Thing.tsx'))).toBe(true);
  });

  it('deletes a deleted file or folder from the app', () => {
    const { root, app } = setup();
    mkdirSync(path.join(app, 'src/components/gone/inner'), { recursive: true });
    writeFileSync(path.join(app, 'src/components/gone/inner/A.tsx'), '');
    expect(() => syncChange(root, app, 'src/components/gone')).not.toThrow();
    expect(existsSync(path.join(app, 'src/components/gone'))).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });
});
