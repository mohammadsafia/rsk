import { describe, expect, it } from 'vite-plus/test';

import { menuLabelKey } from './menu';

/** The menu type of an app made before blocks: no labelKey. The kit's menu code must still accept it. */
type AppMenuBeforeBlocks = { id: string; path: string };

describe('menuLabelKey', () => {
  it('is the nav key by id, for the app’s own entries and apps from before blocks', () => {
    const entry: AppMenuBeforeBlocks = { id: 'dashboard', path: '/dashboard' };
    expect(menuLabelKey(entry)).toBe('dashboard');
  });

  it('is the block’s own key for a block’s entry', () => {
    expect(menuLabelKey({ id: 'status', labelKey: 'block-system-pages:nav.status' })).toBe('block-system-pages:nav.status');
  });
});
