'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { useEffect, useRef, useState } from 'react';

import { Input, Popover } from '@components/ui';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation } from '@hooks/shared';

import type { TextFilterMeta } from '@app-types';
import { type KitColumn } from '@utils';
import type { RowData } from '@tanstack/react-table';

type TextFilterProps<TData extends RowData> = { column: KitColumn<TData>; filterMeta: TextFilterMeta };

const COMMIT_DELAY = 300;

function TextFilter<TData extends RowData>({ column, filterMeta }: TextFilterProps<TData>) {
  const { t, direction } = useAppTranslation('common');
  const value = (column.getFilterValue() as string | undefined) ?? '';
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Only typing commits, after a short pause, so an outside clear can never be undone by a stale debounce.
  const onChange = (text: string) => {
    setDraft(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => column.setFilterValue(text.trim() || undefined), COMMIT_DELAY);
  };

  // A clear from outside (✕, Clear filters) empties the box (picked up while rendering) and cancels any pending commit.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (!value) setDraft('');
  }
  useEffect(() => {
    if (!value) clearTimeout(timer.current);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Popover>
      <FilterPill label={filterMeta.label} values={value ? [`"${value}"`] : []} onClear={() => column.setFilterValue(undefined)} />

      <Popover.Content align="start" className="w-64 p-2">
        <Input
          size="sm"
          dir={direction}
          aria-label={filterMeta.label}
          placeholder={filterMeta.placeholder ?? t('filterBar.textPlaceholder')}
          value={draft}
          onChange={(event) => onChange(event.target.value)}
          autoFocus
        />
      </Popover.Content>
    </Popover>
  );
}

export default TextFilter;
