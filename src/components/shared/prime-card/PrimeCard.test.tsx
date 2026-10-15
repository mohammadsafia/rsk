// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { PrimeCard } from '@components/shared';
import { Tooltip } from '@components/ui';

import { countPatterns } from '../../../../tests/design-system/forbidden-patterns';

import { readFileSync } from 'node:fs';

import '../../../i18n';

afterEach(cleanup);

describe('PrimeCard', () => {
  it('gives the title room above a hairline divider', () => {
    render(
      <Tooltip.Provider>
        <PrimeCard title="With Description" description="CMS 1500 Box 33" tooltip="More">
          <PrimeCard.Content>Body</PrimeCard.Content>
        </PrimeCard>
      </Tooltip.Provider>,
    );
    const header = screen.getByText('With Description').closest('[data-slot="card-header"]') as HTMLElement;
    expect(header.className).toContain('pb-3');
    expect(header.className).toContain('border-border-subtle');
    expect(header.className).not.toMatch(/bg-background|border-primary/);
  });

  it('tints the whole card with design tokens per variant', () => {
    render(
      <PrimeCard title="Primary" variant="primary" data-testid="card">
        <PrimeCard.Content>Body</PrimeCard.Content>
      </PrimeCard>,
    );
    expect(screen.getByTestId('card').className).toContain('bg-accent-subtle');
  });

  it('uses no legacy colors', () => {
    const source = readFileSync('src/components/shared/prime-card/PrimeCard.tsx', 'utf8');
    // The component's own name trips 'prime-component'; only color patterns matter here.
    const { 'prime-component': _ownName, ...colorPatterns } = countPatterns(source);
    expect(colorPatterns).toEqual({});
  });
});
