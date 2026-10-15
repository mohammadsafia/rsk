import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { scanRepo } from '../../tests/design-system/forbidden-patterns';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const baselinePath = fileURLToPath(new URL('../../tests/design-system/forbidden-patterns.baseline.json', import.meta.url));

const baseline = scanRepo(repoRoot);
const total = Object.values(baseline).reduce((sum, counts) => sum + Object.values(counts).reduce((a, b) => a + (b ?? 0), 0), 0);

writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
console.log(`Wrote ${Object.keys(baseline).length} files / ${total} violations to ${baselinePath}`);
