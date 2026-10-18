import { describe, expect, it } from 'vite-plus/test';

import { readProjectFile } from './css-tokens';

/**
 * Radix Dialog.Portal wraps each direct child in Presence, which reads that child's DOM node to wait for its exit
 * animation. A context-only wrapper (no DOM node) as the direct child makes Presence unmount at once, so the overlay
 * and the panel lose their exit animation. Keep the Radix parts as the portal's direct children.
 */
describe('portal children keep their exit animations', () => {
  for (const file of ['src/components/ui/dialog/Dialog.tsx', 'src/components/ui/sheet/Sheet.tsx']) {
    it(`${file}: Overlay is the portal's first direct child`, () => {
      expect(readProjectFile(file)).toMatch(/<DialogPrimitive\.Portal>\s*<DialogPrimitive\.Overlay/);
    });
  }
});
