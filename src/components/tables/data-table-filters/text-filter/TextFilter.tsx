// TanStack Table v8 hands out one mutable table object, so compiled memoization would render stale rows;
// opted out of the React Compiler until Table 9 (compiler-compatible).
'use no memo';

import { useEffect, useRef, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Input, Popover } from '@components/ui';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation } from '@hooks/shared';

import type { TextFilterMeta } from '@app-types';

type TextFilterProps<TData> = { column: Column<TData>; filterMeta: TextFilterMeta };

const COMMIT_DELAY = 300;

function TextFilter<TData>({ column, filterMeta }: TextFilterProps<TData>) {
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
