// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { fieldVariants, Input } from '@components/ui';

afterEach(cleanup);

describe('Input', () => {
  it('invalid renders aria-invalid for assistive tech and the invalid style', () => {
    render(<Input aria-label="National ID" invalid />);
    expect(screen.getByLabelText('National ID').getAttribute('aria-invalid')).toBe('true');
  });

  it('size maps to control heights', () => {
    render(<Input aria-label="Search" size="sm" />);
    expect(screen.getByLabelText('Search').className).toContain('h-control-sm');
  });

  it('hover never overrides the invalid border', () => {
    expect(fieldVariants()).toContain('hover:not-disabled:not-aria-invalid:border-fg-muted');
  });

  it('lets the browser pick the direction of mixed values unless dir is given', () => {
    render(
      <>
        <Input data-testid="auto" />
        <Input data-testid="ltr" dir="ltr" />
      </>,
    );
    expect(screen.getByTestId('auto').getAttribute('dir')).toBe('auto');
    expect(screen.getByTestId('ltr').getAttribute('dir')).toBe('ltr');
  });
});
