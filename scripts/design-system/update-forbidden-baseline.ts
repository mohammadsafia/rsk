import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { nextBaseline, scanRepo, type Baseline } from '../../tests/design-system/forbidden-patterns';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const baselinePath = fileURLToPath(new URL('../../tests/design-system/forbidden-patterns.baseline.json', import.meta.url));

const allowIncrease = process.argv.includes('--allow-increase');
const committed = existsSync(baselinePath) ? (JSON.parse(readFileSync(baselinePath, 'utf8')) as Baseline) : {};

const { baseline, regressions } = nextBaseline(scanRepo(repoRoot), committed, { allowIncrease });

if (baseline === null) {
  console.error('Refusing to update the baseline — these counts would increase:');
  regressions.forEach((line) => console.error(`  ${line}`));
  console.error('Remove the new violations, or rerun with --allow-increase if the increase is intentional and reviewed.');
  process.exit(1);
}

const total = Object.values(baseline).reduce((sum, counts) => sum + Object.values(counts).reduce((a, b) => a + (b ?? 0), 0), 0);

writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
console.log(`Wrote ${Object.keys(baseline).length} files / ${total} violations to ${baselinePath}`);
