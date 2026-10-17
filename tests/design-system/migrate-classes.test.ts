import { describe, expect, it } from 'vite-plus/test';

import { migrateClasses } from '../../scripts/design-system/codemods/migrate-classes';

describe('migrateClasses', () => {
  it('maps colour names behind any prefix and variant chain, keeping opacity', () => {
    const { output, changes } = migrateClasses(
      `<div className="bg-background text-foreground hover:text-muted-foreground dark:bg-primary/10 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground" />`,
    );
    expect(output).toBe(
      `<div className="bg-canvas text-fg hover:text-fg-muted dark:bg-accent/10 data-[active=true]:bg-accent data-[active=true]:text-accent-fg" />`,
    );
    expect(changes).toBe(6);
  });

  it('applies ramps and prefix overrides', () => {
    expect(
      migrateClasses('text-muted-400 bg-muted-50 border-muted-200 bg-muted-200 border-primary-100 text-primary-900 text-muted bg-muted')
        .output,
    ).toBe('text-fg-muted bg-surface-sunken border-border bg-surface-sunken border-border text-accent text-fg-muted bg-surface-sunken');
    expect(migrateClasses('bg-destructive-200 text-destructive-400 bg-success-300 text-warning-400').output).toBe(
      'bg-danger-subtle text-danger bg-success-subtle text-warning',
    );
  });

  it('maps legacy shadows and leaves tokens and unrelated words alone', () => {
    expect(migrateClasses('shadow-spread shadow-boundary rounded-xl').output).toBe('shadow-raised shadow-raised rounded-xl');
    const untouched = 'bg-surface text-fg-muted text-accent background: primary colours, a muted tone';
    expect(migrateClasses(untouched).output).toBe(untouched);
  });

  it('keeps indentation and removes shadow-inner without leaving a double space', () => {
    expect(migrateClasses('      <div className="rounded shadow-inner border">\n').output).toBe('      <div className="rounded border">\n');
  });

  it('reports names it cannot map', () => {
    expect(migrateClasses('text-primary-1000 bg-secondary-450').unmapped).toEqual(['text-primary-1000', 'bg-secondary-450']);
  });
});
