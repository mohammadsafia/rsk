import { useEffect, useState } from 'react';

import type { Column } from '@tanstack/react-table';

import { Input, Popover } from '@components/ui';
import { FilterPill } from '@components/tables/data-table-filters/filter-pill';

import { useAppTranslation, useDebounce } from '@hooks/shared';

import type { TextFilterMeta } from '@app-types';

type TextFilterProps<TData> = { column: Column<TData>; filterMeta: TextFilterMeta };

function TextFilter<TData>({ column, filterMeta }: TextFilterProps<TData>) {
  const { t, direction } = useAppTranslation('common');
  const value = (column.getFilterValue() as string | undefined) ?? '';
  const [draft, setDraft] = useState(value);
  const debounced = useDebounce(draft, 300);

  useEffect(() => {
    if (debounced.trim() === value) return;
    column.setFilterValue(debounced.trim() || undefined);
  }, [debounced, value, column]);

  // A reset from outside (✕, Clear filters) empties the box too.
  useEffect(() => {
    if (!value) setDraft('');
  }, [value]);

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
          onChange={(event) => setDraft(event.target.value)}
          autoFocus
        />
      </Popover.Content>
    </Popover>
  );
}

export default TextFilter;
