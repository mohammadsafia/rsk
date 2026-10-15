import { describe, expect, it } from 'vite-plus/test';

import { migrateSource, type TagRule } from '../../../scripts/design-system/codemods/migrate-props';

const pillRule: TagRule = {
  tag: 'Pill',
  keys: ['variant', 'size'],
  transform: (attrs) => {
    if (attrs.variant === 'weird') return 'manual';
    const out: Record<string, string | true> = {};
    if (attrs.variant === 'loud') out.tone = 'danger';
    if (attrs.size === 'full') out.fullWidth = true;
    return out;
  },
};

describe('migrateSource', () => {
  it('rewrites literal props and keeps everything else', () => {
    const { output, changed } = migrateSource('<Pill variant="loud" size="full" onClick={() => go(a > b)}>Hi</Pill>', [pillRule]);
    expect(output).toBe('<Pill tone="danger" fullWidth onClick={() => go(a > b)}>Hi</Pill>');
    expect(changed).toBe(1);
  });

  it('handles multi-line tags whose class strings contain ">"', () => {
    const source = '<Pill\n  className="[&>svg]:size-4"\n  variant="loud"\n/>';
    // The removed attribute leaves one stray space; `vp fmt` normalizes whitespace after every migration.
    expect(migrateSource(source, [pillRule]).output).toBe('<Pill tone="danger"\n  className="[&>svg]:size-4"\n \n/>');
  });

  it('does not touch tags with a longer name', () => {
    expect(migrateSource('<PillGroup variant="loud" />', [pillRule]).changed).toBe(0);
  });

  it('reports expression-valued managed props as manual', () => {
    const result = migrateSource('<Pill variant={on ? "loud" : "soft"} />', [pillRule], 'a.tsx');
    expect(result.changed).toBe(0);
    expect(result.manual).toEqual(['a.tsx:1 <Pill variant={on ? "loud" : "soft"} />']);
  });

  it('reports transforms that return manual', () => {
    expect(migrateSource('<Pill variant="weird" />', [pillRule], 'b.tsx').manual).toHaveLength(1);
  });

  it('renames tags and imports', () => {
    const rule: TagRule = {
      ...pillRule,
      tag: 'Chip',
      renameTo: 'Tag',
      importRename: { source: '@components/ui', from: 'Chip', to: 'Tag' },
    };
    const source = 'import { Button, Chip } from \'@components/ui\';\n<Chip variant="loud">x</Chip>';
    expect(migrateSource(source, [rule]).output).toBe('import { Button, Tag } from \'@components/ui\';\n<Tag tone="danger">x</Tag>');
  });
});
