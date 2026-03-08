import { type ComponentPropsWithoutRef, forwardRef, type MouseEvent, type ReactNode } from 'react';

import { type FilterChipItem, FilterChipList } from '@components/tables';

import { cn } from '@utils';

import { ChevronDown } from 'lucide-react';

type FilterChipTriggerProps = ComponentPropsWithoutRef<'button'> & {
  label: ReactNode;
  chips: FilterChipItem[];
  maxVisibleChips?: number;
  onRemoveChip: (value: string, event: MouseEvent) => void;
};

const FilterChipTrigger = forwardRef<HTMLButtonElement, FilterChipTriggerProps>(
  ({ label, chips, onRemoveChip, maxVisibleChips, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'border-muted-200 bg-surface text-primary-900 hover:bg-muted-50 flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-normal transition-colors',
          className,
        )}
        {...props}
      >
        {label}

        <ChevronDown className="text-muted-400 size-4" />

        <FilterChipList chips={chips} onRemoveChip={onRemoveChip} maxVisibleChips={maxVisibleChips} />
      </button>
    );
  },
);

FilterChipTrigger.displayName = 'FilterChipTrigger';

export default FilterChipTrigger;
