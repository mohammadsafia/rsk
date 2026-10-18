// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ColumnFiltersState, useTable } from '@tanstack/react-table';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { DataTable } from '@components/tables';
import { Tooltip } from '@components/ui';

import { booleanFilterFn, containsFilterFn, createFilterMeta, type KitColumnDef, kitFeatures, numberRangeFilterFn } from '@utils';

import i18n from '../../../i18n';

type Visit = { patient: string; insured: boolean; amount: number };

const columns: KitColumnDef<Visit>[] = [
  { accessorKey: 'patient', filterFn: containsFilterFn, meta: { filterMeta: createFilterMeta({ variant: 'text', label: 'Patient' }) } },
  {
    accessorKey: 'insured',
    filterFn: booleanFilterFn,
    meta: { filterMeta: createFilterMeta({ variant: 'boolean', label: 'Insured', trueLabel: 'Insured', falseLabel: 'Self-pay' }) },
  },
  {
    accessorKey: 'amount',
    filterFn: numberRangeFilterFn,
    meta: { filterMeta: createFilterMeta({ variant: 'numberRange', label: 'Amount' }) },
  },
];

const rows: Visit[] = [
  { patient: 'Sara Haddad', insured: true, amount: 120 },
  { patient: 'Omar Nasser', insured: false, amount: 40 },
];

function Harness({ filters = [] }: { filters?: ColumnFiltersState }) {
  const table = useTable({
    features: kitFeatures,
    data: rows,
    columns,
    initialState: { columnFilters: filters },
  });
  return (
    <DataTable table={table}>
      <DataTable.Toolbar totalCount={table.getFilteredRowModel().rows.length} />
    </DataTable>
  );
}

const renderBar = (filters?: ColumnFiltersState) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Tooltip.Provider>
        <Harness filters={filters} />
      </Tooltip.Provider>
    </QueryClientProvider>,
  );

const pill = (label: string) => document.querySelector(`[data-slot="filter-pill"][data-filter="${label}"]`) as HTMLElement;
const open = (label: string) => fireEvent.click(pill(label).querySelector('button') as HTMLElement);

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('boolean filter', () => {
  it('shows its custom labels and applies a choice', async () => {
    renderBar();
    open('Insured');
    fireEvent.click(await screen.findByRole('option', { name: 'Self-pay' }));
    await waitFor(() => expect(pill('Insured').textContent).toContain('Self-pay'));
    expect(pill('Insured').hasAttribute('data-active')).toBe(true);
  });
});

describe('text filter', () => {
  it('applies typed text after a short debounce and summarises it in quotes', async () => {
    renderBar();
    open('Patient');
    fireEvent.change(await screen.findByRole('textbox', { name: 'Patient' }), { target: { value: 'sara' } });
    await waitFor(() => expect(pill('Patient').textContent).toContain('"sara"'), { timeout: 1500 });
  });
});

describe('text filter clearing', () => {
  it('clears at once when its ✕ is clicked and does not come back after the debounce', async () => {
    renderBar([{ id: 'patient', value: 'sa' }]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Patient filter' }));
    // The values fade out first (a fast exit), then the filter clears, well before the debounce would fire.
    await vi.waitFor(() => expect(pill('Patient').hasAttribute('data-active')).toBe(false));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    });
    expect(pill('Patient').hasAttribute('data-active')).toBe(false);
  });
});

describe('number range filter', () => {
  it('summarises open and closed ranges with Western, LTR numbers', () => {
    renderBar([{ id: 'amount', value: { min: 0 } }]);
    const values = pill('Amount').querySelector('[data-slot="filter-pill-values"]') as HTMLElement;
    expect(values.textContent).toBe('≥ 0');
    expect(values.querySelector('[dir="ltr"]')).not.toBeNull();
  });

  it('swaps min and max when applied backwards', async () => {
    renderBar();
    open('Amount');
    fireEvent.change(await screen.findByRole('textbox', { name: 'Minimum' }), { target: { value: '300' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Maximum' }), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(pill('Amount').textContent).toContain('100 – 300'));
  });

  it('labels its fields in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderBar();
    open('Amount');
    expect(await screen.findByRole('textbox', { name: 'الحد الأدنى' })).toBeTruthy();
  });
});
