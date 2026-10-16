// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PageHeader } from '@components/shared';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('PageHeader', () => {
  it('renders a level-1 title, description, breadcrumb and actions', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Members" description="People with access to this workspace." breadcrumb={[{ title: 'Members' }]}>
          <PageHeader.Actions>
            <button type="button">Add member</button>
          </PageHeader.Actions>
        </PageHeader>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Members' })).toBeTruthy();
    expect(screen.getByText('People with access to this workspace.')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add member' }).closest('[data-slot="page-header-actions"]')).not.toBeNull();
  });

  it('labels the back link and mirrors its chevron', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Sara Haddad" back="/members" />
      </MemoryRouter>,
    );
    const back = screen.getByRole('link', { name: 'Back' });
    expect(back.getAttribute('href')).toBe('/members');
    expect(back.querySelector('svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
  });

  it('calls a back handler from a button', () => {
    const onBack = vi.fn();
    render(
      <Tooltip.Provider>
        <PageHeader title="Visit" back={onBack} />
      </Tooltip.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
