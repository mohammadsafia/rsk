// An app updated by an older kit:update (which can't print what it doesn't know) hears here what it still has to wire:
// the same list the new kit:update prints under "To finish this update".
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { wiringGaps } from '../../scripts/kit/add';
import { adapterGaps } from '../../scripts/kit/gaps';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
// In the kit's own repository the starter's routes live in its overlay; in an app, in its own src/routes.
const SPLIT = path.join(ROOT, 'scripts/starter/overlay/vite');
const OVERLAY = existsSync(SPLIT) ? SPLIT : path.join(ROOT, 'scripts/starter/overlay');

describe('kit wiring', () => {
  it('the app wires everything the kit needs (src/routes/routerAdapter.tsx, block routes)', () => {
    const gaps = [...adapterGaps(ROOT), ...wiringGaps(existsSync(OVERLAY) ? OVERLAY : ROOT, ROOT)];
    expect(gaps, `To finish your kit update:\n${gaps.map((gap) => `  - ${gap}`).join('\n')}`).toEqual([]);
  });
});
