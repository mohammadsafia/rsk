import { type MouseEvent } from 'react';

import { Divider } from '@components/ui';
import { Conditional } from '@components/utils';

import { MinusCircle } from 'lucide-react';

export type FilterChipItem = {
  value: string;
  label: string;
};

type FilterChipListProps = {
  chips: FilterChipItem[];
  maxVisibleChips?: number;
  onRemoveChip: (value: string, event: MouseEvent) => void;
};

const MAX_VISIBLE_CHIPS = 2;

function FilterChipList({ chips, onRemoveChip, maxVisibleChips = MAX_VISIBLE_CHIPS }: FilterChipListProps) {
  if (chips.length === 0) return null;

  const visibleChips = chips.slice(0, maxVisibleChips);
  const overflowCount = chips.length - maxVisibleChips;

  return (
    <>
      <Divider orientation="vertical" className="mx-0.5 h-4" />

      <div className="flex items-center gap-2">
        {visibleChips.map((chip) => (
          <span key={chip.value} className="text-2xs text-muted-400 flex items-center gap-0.5 font-normal">
            {chip.label}

            <MinusCircle
              className="text-muted-400 hover:text-error-500 size-4 cursor-pointer"
              onClick={(e) => onRemoveChip(chip.value, e)}
            />
          </span>
        ))}

        <Conditional.If condition={overflowCount > 0}>
          <span className="text-2xs text-primary-900 font-normal">+{overflowCount}</span>
        </Conditional.If>
      </div>
    </>
  );
}

export default FilterChipList;
