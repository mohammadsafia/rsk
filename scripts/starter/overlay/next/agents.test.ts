// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { hasCurrentAgentRules } from 'next/dist/server/lib/generate-agent-files.js';
import { describe, expect, it } from 'vite-plus/test';

describe('AGENTS.md', () => {
  it("already holds this Next version's own block, so next dev leaves the file (and the git tree) alone", () => {
    expect(hasCurrentAgentRules(process.cwd())).toBe(true);
  });

  it('says which kit skills write Vite code and what to do here instead', () => {
    const text = readFileSync(path.join(process.cwd(), 'AGENTS.md'), 'utf8');
    const skills = text.slice(text.indexOf('## Vite-only skills'));
    for (const skill of ['forge:create-page', 'forge:create-api', 'forge:debug-build']) expect(skills).toContain(skill);
  });
});
