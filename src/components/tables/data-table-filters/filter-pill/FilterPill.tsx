'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { type FC, type ReactNode, useRef } from 'react';

import { Combobox } from '@components/shared';
import { Conditional } from '@components/utils';

import { LEAVE_TIMING, useLeave } from '@hooks/motion';
import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronDown, Plus, X } from 'lucide-react';

export type FilterPillProps = {
  /** The filter's name, e.g. "Role". */
  label: string;
  /** Display labels of the applied values; empty means the filter is inactive. */
  values: string[];
  onClear: () => void;
  /** Wraps the summary text, e.g. to LTR-isolate numbers. @default the text itself */
  renderValues?: (text: string) => ReactNode;
};

/** The pill stays (it turns back into "+ Label"), so only what is being cleared fades: the values and this button. */
const fadeValues = (pill: HTMLElement) =>
  [...pill.querySelectorAll<HTMLElement>('[data-slot="filter-pill-values"], [data-slot="filter-pill-remove"]')].map((part) =>
    part.animate([{ opacity: 1 }, { opacity: 0 }], LEAVE_TIMING),
  );

const summarise = (values: string[]) => (values.length > 2 ? `${values[0]} +${values.length - 1}` : values.join(', '));

/**
 * The trigger of one table filter. Must sit inside the filter's Popover/Combobox root.
 * Inactive: a quiet dashed "+ Label" pill. Active: an accent-tinted "Label · values" pill with its own remove button.
 */
const FilterPill: FC<FilterPillProps> = ({ label, values, onClear, renderValues }) => {
  const { t } = useAppTranslation('common');
  const active = values.length > 0;
  const pillRef = useRef<HTMLDivElement>(null);
  const leave = useLeave(pillRef, fadeValues);

  return (
    <div ref={pillRef} data-slot="filter-pill" data-filter={label} data-active={active || undefined} className="inline-flex items-stretch">
      <Combobox.Trigger
        size="sm"
        className={cn(
          'w-auto gap-1.5 font-medium',
          active
            ? 'bg-accent-subtle border-accent/40 hover:not-disabled:not-aria-invalid:border-accent/60 rounded-e-none'
            : 'text-fg-muted hover:text-fg border-dashed',
        )}
      >
        <Conditional>
          <Conditional.If condition={active}>
            <span className="text-fg-muted font-normal">{label}</span>

            <span aria-hidden="true" className="text-fg-subtle">
              ·
            </span>

            <span data-slot="filter-pill-values" className="text-fg max-w-48 truncate">
              {renderValues ? renderValues(summarise(values)) : summarise(values)}
            </span>
          </Conditional.If>

          <Conditional.Else>
            <Plus aria-hidden="true" className="size-3.5" />
            {label}
          </Conditional.Else>
        </Conditional>

        <ChevronDown aria-hidden="true" className="text-fg-muted size-3.5" />
      </Combobox.Trigger>

      <Conditional.If condition={active}>
        <button
          type="button"
          data-slot="filter-pill-remove"
          aria-label={t('filterBar.remove', { label })}
          onClick={() => leave(onClear)}
          className="bg-accent-subtle border-accent/40 text-fg-muted hover:text-fg focus-visible:ring-ring h-control-sm -ms-px inline-flex items-center rounded-e-md border px-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      </Conditional.If>
    </div>
  );
};

FilterPill.displayName = 'FilterPill';

export default FilterPill;
