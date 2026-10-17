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

describe('badge rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.badge, 'x.tsx').output;

  it.each([
    ['<Badge variant="default">', '<Badge>'],
    ['<Badge variant="muted" size="xs">', '<Badge size="sm">'],
    ['<Badge variant="destructive" size="lg">', '<Badge tone="danger" size="md">'],
    ['<Badge variant="accent">', '<Badge tone="accent">'],
    ['<FileCard.StatusPill variant="success">', '<FileCard.StatusPill variant="soft" tone="success">'],
    ['<FileCard.StatusPill variant="destructive">', '<FileCard.StatusPill variant="soft" tone="danger">'],
    ['<FileCard.StatusPill variant="default">', '<FileCard.StatusPill variant="soft" tone="accent">'],
  ])('%s → %s', (input, expected) => {
    expect(run(input)).toBe(expected);
  });
});

describe('tag rules', () => {
  it('renames Chip to Tag with tones and sizes', () => {
    const source = 'import { Chip } from \'@components/ui\';\n<Chip variant="muted" size="xs">a</Chip>\n<Chip variant="default">b</Chip>';
    expect(migrateSource(source, RULE_SETS.tag).output).toBe(
      'import { Tag } from \'@components/ui\';\n<Tag size="sm">a</Tag>\n<Tag tone="accent">b</Tag>',
    );
  });
});

describe('alert rules', () => {
  it.each([
    ['<Alert variant="default">', '<Alert>'],
    ['<Alert variant="destructive">', '<Alert tone="danger">'],
    ['<Alert variant="outline">', '<Alert variant="outline">'],
    ['<Alert variant="outline-info">', '<Alert variant="outline" tone="info">'],
    ['<Alert variant="outline-destructive">', '<Alert variant="outline" tone="danger">'],
  ])('%s → %s', (input, expected) => {
    expect(migrateSource(input, RULE_SETS.alert).output).toBe(expected);
  });
});

describe('feedback rules', () => {
  it.each([
    ['<Progress value={30} variant="default" indicatorVariant="default"/>', '<Progress value={30}/>'],
    ['<Progress value={60} variant="success" indicatorVariant="success"/>', '<Progress tone="success" value={60}/>'],
    ['<Progress value={90} variant="destructive" size="lg"/>', '<Progress tone="danger" size="lg" value={90}/>'],
    ['<Skeleton shape="text" size="xs" />', '<Skeleton size="sm" />'],
    ['<Skeleton shape="avatar" size="xl" />', '<Skeleton shape="circle" size="lg" />'],
    ['<Skeleton shape="banner" size="md" variant="card" />', '<Skeleton shape="block" />'],
    ['<Switch variant="success" size="lg" />', '<Switch size="md" />'],
    ['<Checkbox variant="secondary" />', '<Checkbox />'],
  ])('%s → %s', (input, expected) => {
    expect(migrateSource(input, RULE_SETS.feedback).output.replace(/\s+/g, ' ')).toBe(expected);
  });
});

describe('menus rules', () => {
  it.each([
    ['<ToggleGroup type="single" variant="default" size="default">', '<ToggleGroup variant="ghost" type="single">'],
    ['<ToggleGroup type="single" variant="outline" size="lg">', '<ToggleGroup size="lg" type="single">'],
    ['<ToggleGroup.Item value="a" size="sm">', '<ToggleGroup.Item size="sm" value="a">'],
  ])('%s → %s', (input, expected) => {
    expect(migrateSource(input, RULE_SETS.menus).output.replace(/\s+/g, ' ')).toBe(expected);
  });
});
describe('card rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.card, 'x.tsx').output;

  it.each([
    ['<Card shadow="sm" className="x">', '<Card className="x">'],
    ['<Card shadow="none">', '<Card>'],
    ['<Card>', '<Card>'],
  ])('%s → %s', (input, expected) => {
    expect(run(input)).toBe(expected);
  });
});
describe('tabs rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.tabs, 'x.tsx').output;

  it.each([
    ['<Tabs.List>', '<Tabs.List variant="contained" fullWidth>'],
    ['<Tabs.List variant="default" className="x">', '<Tabs.List variant="contained" fullWidth className="x">'],
    ['<Tabs.List variant="compact">', '<Tabs.List variant="contained">'],
    ['<Tabs.List variant="plain">', '<Tabs.List fullWidth>'],
    ['<Tabs.List variant="compactPlain">', '<Tabs.List>'],
    ['<Tabs.Trigger value="a" variant="fitContent">', '<Tabs.Trigger value="a">'],
    ['<Tabs.Trigger value="a">', '<Tabs.Trigger value="a">'],
  ])('%s → %s', (input, expected) => {
    expect(run(input)).toBe(expected);
  });
});

describe('confirm rules', () => {
  const run = (source: string) => migrateSource(source, RULE_SETS.confirm, 'x.tsx').output;

  it.each([
    ['<ConfirmDialog variant="destructive" title="x">', '<ConfirmDialog tone="danger" title="x">'],
    ['<ConfirmDialog variant="warning">', '<ConfirmDialog tone="warning">'],
    ['<ConfirmDialog variant="success">', '<ConfirmDialog tone="success">'],
    ['<ConfirmDialog variant="info">', '<ConfirmDialog tone="info">'],
    ['<ConfirmDialog title="x">', '<ConfirmDialog title="x">'],
  ])('%s → %s', (input, expected) => {
    expect(run(input)).toBe(expected);
  });
});
