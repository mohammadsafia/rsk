// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Pagination, Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const renderPagination = () =>
  render(
    <Tooltip.Provider>
      <Pagination>
        <Pagination.List>
          <Pagination.Item>
            <Pagination.Previous />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.NavButton isActive>01</Pagination.NavButton>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.NavButton>02</Pagination.NavButton>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next />
          </Pagination.Item>
        </Pagination.List>
      </Pagination>
    </Tooltip.Provider>,
  );

describe('Pagination', () => {
  it('names the landmark and the previous/next controls', () => {
    renderPagination();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeTruthy();
    expect(screen.getByText('More pages').className).toContain('sr-only');
  });

  it('marks the current page with aria-current and the ink bar; the others stay unmarked ghosts', () => {
    renderPagination();
    const current = screen.getByRole('button', { name: '01' });
    const other = screen.getByRole('button', { name: '02' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.dataset.variant).toBe('ghost');
    expect(current.closest('ol')?.querySelector('[data-slot="ink-bar"]')).not.toBeNull();
    expect(other.getAttribute('aria-current')).toBeNull();
    expect(other.dataset.variant).toBe('ghost');
    // Only the current page carries a mark (the ink bar); the ghost hairline underline would make every number look like a link.
    expect(other.className).toContain('no-underline');
  });
});
