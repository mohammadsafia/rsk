// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PageHeader } from '@components/shared';
import { Badge, Tooltip } from '@components/ui';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(cleanup);

describe('PageHeader', () => {
  it('renders a level-1 title, description, breadcrumb and actions', () => {
    render(
      <MemoryKitRouter>
        <PageHeader title="Members" description="People with access to this workspace." breadcrumb={[{ title: 'Members' }]}>
          <PageHeader.Actions>
            <button type="button">Add member</button>
          </PageHeader.Actions>
        </PageHeader>
      </MemoryKitRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Members' })).toBeTruthy();
    expect(screen.getByText('People with access to this workspace.')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add member' }).closest('[data-slot="page-header-actions"]')).not.toBeNull();
  });

  it('labels the back link and mirrors its chevron', () => {
    render(
      <MemoryKitRouter>
        <PageHeader title="Sara Haddad" back="/members" />
      </MemoryKitRouter>,
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

describe('PageHeader media and meta', () => {
  it('renders media before the title and meta under it, keeping the h1', () => {
    render(
      <MemoryKitRouter>
        <PageHeader title="Sara Haddad" media={<span data-testid="avatar" />} meta={<Badge tone="success">Active</Badge>} />
      </MemoryKitRouter>,
    );
    const heading = screen.getByRole('heading', { level: 1, name: 'Sara Haddad' });
    const media = screen.getByTestId('avatar');
    expect(media.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector('[data-slot="page-header-meta"]')?.textContent).toBe('Active');
  });

  it('renders neither slot when not given', () => {
    render(<PageHeader title="Patients" />);
    expect(document.querySelector('[data-slot="page-header-media"]')).toBeNull();
    expect(document.querySelector('[data-slot="page-header-meta"]')).toBeNull();
  });
});
