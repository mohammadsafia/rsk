import { describe, expect, it } from 'vite-plus/test';

import { migrateSource, type TagRule } from '../../../scripts/design-system/codemods/migrate-props';
import { RULE_SETS } from '../../../scripts/design-system/codemods/rules';

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

describe('button rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.button, 'x.tsx');

  it.each([
    ['<Button variant="default">', '<Button>'],
    ['<Button variant="destructive">', '<Button tone="danger">'],
    ['<Button variant="outline">', '<Button variant="outline">'],
    ['<Button variant="secondary">', '<Button variant="outline">'],
    ['<Button variant="ghost-muted-primary">', '<Button variant="ghost" tone="accent">'],
    ['<Button variant="outline-destructive">', '<Button variant="outline" tone="danger">'],
    ['<Button variant="link">', '<Button variant="link" tone="accent">'],
    ['<Button size="xs">', '<Button size="sm">'],
    ['<Button size="default">', '<Button>'],
    ['<Button size="full">', '<Button fullWidth>'],
    ['<LoadingButton variant="muted" loading>', '<Button variant="outline" loading>'],
  ])('%s → %s', (input, expected) => {
    expect(run(input).output).toBe(expected);
  });

  it('reports icon sizes and unstyled for manual migration', () => {
    expect(run('<Button size="icon">').manual).toHaveLength(1);
    expect(run('<Button variant="unstyled">').manual).toHaveLength(1);
  });

  it('fails loudly on unknown variants', () => {
    expect(() => run('<Button variant="sparkly">')).toThrow('Unknown Button variant "sparkly"');
  });
});
