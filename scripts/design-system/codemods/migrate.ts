import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listSourceFiles } from '../../../tests/design-system/forbidden-patterns';
import { migrateSource } from './migrate-props';
import { RULE_SETS } from './rules';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const setName = process.argv[2] ?? '';
const rules = RULE_SETS[setName];

if (!rules) {
  console.error(`Unknown rule set "${setName}". Known: ${Object.keys(RULE_SETS).join(', ') || '(none)'}`);
  process.exit(1);
}

let changedTags = 0;
let changedFiles = 0;
const manual: string[] = [];

for (const file of listSourceFiles(repoRoot)) {
  const path = join(repoRoot, file);
  const source = readFileSync(path, 'utf8');
  const result = migrateSource(source, rules, file);
  manual.push(...result.manual);
  if (result.output !== source) {
    writeFileSync(path, result.output);
    changedTags += result.changed;
    changedFiles++;
  }
}

console.log(`changed ${changedTags} tags in ${changedFiles} files`);
manual.forEach((entry) => console.log(`MANUAL ${entry}`));
