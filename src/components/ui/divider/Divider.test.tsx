// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Divider } from '@components/ui';

afterEach(cleanup);

describe('Divider', () => {
  it('announces its orientation and uses the border token', () => {
    render(<Divider orientation="vertical" />);
    const divider = screen.getByRole('separator');
    expect(divider.getAttribute('aria-orientation')).toBe('vertical');
    expect(divider.className).toContain('bg-border');
  });
});
