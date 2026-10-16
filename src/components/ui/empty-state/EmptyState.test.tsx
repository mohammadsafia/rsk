// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EmptyState, Table } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('EmptyState', () => {
  it('uses the kind for its default copy and icon', () => {
    render(<EmptyState kind="no-results" />);
    expect(screen.getByRole('heading', { name: 'No results' })).toBeTruthy();
    expect(document.querySelector('[data-slot="empty-state"]')?.getAttribute('data-kind')).toBe('no-results');
  });

  it('announces errors and renders actions', () => {
    render(
      <EmptyState kind="error" title="Couldn't load visits">
        <EmptyState.Actions>
          <button type="button">Try again</button>
        </EmptyState.Actions>
      </EmptyState>,
    );
    expect(screen.getByRole('alert').textContent).toContain("Couldn't load visits");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('renders the title at the requested heading level', () => {
    render(<EmptyState titleAs="h1" title="Page not found" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
  });

  it('is what Table.Empty renders', () => {
    render(
      <table>
        <tbody>
          <Table.Empty when colSpan={3} title="No members yet" />
        </tbody>
      </table>,
    );
    expect(screen.getByRole('heading', { name: 'No members yet' }).closest('[data-slot="empty-state"]')).not.toBeNull();
  });
});
