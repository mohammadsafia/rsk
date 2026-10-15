// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Table } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('Table', () => {
  it('end-aligns numeric cells in mono and keeps their digits in LTR order', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Table.Cell numeric>+962-79-555-0142</Table.Cell>
          </tr>
        </tbody>
      </table>,
    );
    const value = screen.getByText('+962-79-555-0142');
    const cell = value.closest('td')!;
    expect(cell.dataset.numeric).toBe('true');
    expect(cell.className).toContain('text-end');
    expect(cell.className).toContain('tabular-nums');
    expect(value.getAttribute('dir')).toBe('ltr');
    expect(cell.getAttribute('dir')).toBeNull();
  });

  it('marks selected rows with the accent tint', () => {
    render(
      <table>
        <tbody>
          <Table.Row data-state="selected" data-testid="row" />
        </tbody>
      </table>,
    );
    expect(screen.getByTestId('row').className).toContain('data-[state=selected]:bg-accent-subtle');
  });

  it('falls back to translated empty-state copy', () => {
    render(
      <table>
        <tbody>
          <Table.Empty when colSpan={3} />
        </tbody>
      </table>,
    );
    expect(screen.getByText('No Results Found')).toBeTruthy();
  });

  it('reports loading through aria-busy, not a stray DOM attribute', () => {
    render(<Table isLoading data-testid="table" />);
    const table = screen.getByTestId('table');
    expect(table.getAttribute('aria-busy')).toBe('true');
    expect(table.hasAttribute('isloading')).toBe(false);
  });
});
