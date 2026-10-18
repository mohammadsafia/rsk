// tests/design-system/shell-weight.test.ts — the app shell's first load doesn't drag in components it only names.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const read = (file: string) => readFileSync(fileURLToPath(new URL(`../../src/${file}`, import.meta.url)), 'utf8');

describe('shell weight', () => {
  it('the floating-surface class names live apart from the Popover component, so reading them never loads Radix Popover', () => {
    expect(read('components/ui/popover/index.ts')).toMatch(/floatingMotionClassName, floatingSurfaceClassName \} from '\.\/floating'/);
    expect(read('components/ui/popover/floating.ts')).toMatch(/export const floatingSurfaceClassName/);
    expect(read('components/ui/toast/Toast.tsx')).not.toMatch(/popover\/Popover'/);
  });
});
