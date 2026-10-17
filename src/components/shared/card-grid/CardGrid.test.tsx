// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CardGrid } from '@components/shared';

afterEach(cleanup);

const grid = () => document.querySelector('[data-slot="card-grid"]') as HTMLElement;

describe('CardGrid', () => {
  it('takes a fixed column count', () => {
    render(<CardGrid columns={3} gap="lg" />);
    expect(grid().className).toContain('grid-cols-3');
    expect(grid().className).toContain('gap-6');
  });

  it('takes responsive columns and defaults to 1 / 2 / 4', () => {
    render(
      <>
        <CardGrid columns={{ base: 1, md: 2, xl: 5 }} />
        <CardGrid data-testid="default" />
      </>,
    );
    expect(grid().className).toMatch(/grid-cols-1 .*md:grid-cols-2 .*xl:grid-cols-5/);
    const fallback = document.querySelector('[data-testid="default"]') as HTMLElement;
    expect(fallback.className).toMatch(/grid-cols-1 .*sm:grid-cols-2 .*lg:grid-cols-4/);
    expect(fallback.className).toContain('gap-4');
  });
});
