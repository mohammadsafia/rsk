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

  it('shows the Ledger 0 figure for empty kinds, and keeps the icon for errors', () => {
    const { unmount } = render(<EmptyState kind="no-results" />);
    const glyph = document.querySelector<HTMLElement>('[data-slot="empty-state-icon"]')!;
    expect(glyph.textContent).toBe('0');
    expect(glyph.className).toContain('figure');
    expect(glyph.className).toContain('rule-top');
    unmount();
    render(<EmptyState kind="error" />);
    expect(document.querySelector('[data-slot="empty-state-icon"] svg')).not.toBeNull();
  });

  it('a custom icon still replaces the glyph', () => {
    render(<EmptyState kind="first-use" icon={<svg data-testid="custom" />} />);
    expect(screen.getByTestId('custom')).toBeTruthy();
  });

  it('fades in when it replaces content', () => {
    const { container } = render(<EmptyState kind="no-results" />);
    const className = container.querySelector('[data-slot="empty-state"]')!.className;
    for (const name of ['animate-in', 'fade-in-0', 'duration-base', 'motion-reduce:animate-none']) expect(className).toContain(name);
  });
});
