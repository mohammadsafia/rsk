import { describe, expect, it } from 'vite-plus/test';

import { devTarget, isTemporary } from '../../scripts/starter/dev-starter';

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
