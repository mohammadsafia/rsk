// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Badge } from '@components/ui';

afterEach(cleanup);

describe('Badge', () => {
  it('defaults to a neutral dot badge', () => {
    render(<Badge>Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect([badge.dataset.variant, badge.dataset.tone]).toEqual(['dot', 'neutral']);
    expect(badge.querySelector('[data-slot="badge-dot"]')).not.toBeNull();
  });

  it('soft badges have no dot and carry their tone', () => {
    render(
      <Badge variant="soft" tone="danger">
        Overdue
      </Badge>,
    );
    const badge = screen.getByText('Overdue');
    expect(badge.dataset.tone).toBe('danger');
    expect(badge.querySelector('[data-slot="badge-dot"]')).toBeNull();
    expect(badge.className).toContain('bg-danger-subtle');
  });

  it('sizes map to the scale', () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small').className).toContain('h-5');
  });
});
