// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Spinner } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('Spinner', () => {
  it('is a status with translated hidden text and stops spinning under reduced motion', () => {
    render(<Spinner />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Loading…');
    expect(status.querySelector('svg')?.getAttribute('class')).toContain('motion-reduce:animate-none');
  });

  it('accepts a custom label and sizes', () => {
    render(<Spinner size="lg" label="Saving visit" />);
    expect(screen.getByRole('status').textContent).toBe('Saving visit');
    expect(screen.getByRole('status').querySelector('svg')?.getAttribute('class')).toContain('size-8');
  });

  it('overlays its parent, or the viewport when fixed', () => {
    render(
      <>
        <Spinner overlay data-testid="local" />
        <Spinner overlay fixed data-testid="page" />
      </>,
    );
    expect(screen.getByTestId('local').className).toMatch(/(^|\s)absolute(\s|$)/);
    expect(screen.getByTestId('local').className).toContain('inset-0');
    expect(screen.getByTestId('page').className).toMatch(/(^|\s)fixed(\s|$)/);
  });
});
