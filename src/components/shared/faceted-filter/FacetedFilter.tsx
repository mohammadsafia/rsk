import { type Control, useController } from 'react-hook-form';

import { Badge, Button, Command, Divider, Popover } from '@components/ui';
import { Conditional } from '@components/utils';
import { FormDateRange, FormInput } from '@components/forms';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { CheckIcon, PlusIcon } from 'lucide-react';

export type FacetedColumn = {
  title?: string;
  name: string;
  filterVariant?: 'select' | 'multi-select' | 'date' | 'date-range' | 'text';
  filterOptions?: Array<{ label: string; value: string }>;
};

export type FacetedFilterProps = FacetedColumn & {
  control?: Control<any>;
};

function FacetedFilter({ title, name, control, filterVariant = 'text', filterOptions = [] }: FacetedFilterProps) {
  const { t } = useAppTranslation('common');

  const {
    field: { value, onChange },
  } = useController({ name, control });

  const multiSelect = filterVariant === 'multi-select';

  const selectedValues: string[] = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];
  const selectedCount = selectedValues.length;

  const onSelect = (val: string) => {
    if (!multiSelect) {
      onChange(value === val ? undefined : val);

      return;
    }

    const newValues = selectedValues.includes(val) ? selectedValues.filter((v) => v !== val) : [...selectedValues, val];
    onChange(newValues.length ? newValues : undefined);
  };

  if (filterVariant === 'date-range') return <FormDateRange name={name} />;

  if (filterVariant === 'select' || filterVariant === 'multi-select') {
    return (
      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline" size="sm" className="border-dashed">
            <PlusIcon aria-hidden="true" />

            {title}

            <Conditional.If condition={selectedCount > 0}>
              <Divider orientation="vertical" className="mx-1 h-4" />

              <Badge className="rounded-sm px-1 font-normal lg:hidden">{selectedCount}</Badge>

              <div className="hidden gap-1 lg:flex">
                <Conditional>
                  <Conditional.If condition={selectedCount < 3}>
                    {filterOptions
                      .filter((opt) => selectedValues.includes(opt.value))
                      .map((opt) => (
                        <Badge key={opt.value} className="rounded-sm px-1 font-normal">
                          {opt.label}
                        </Badge>
                      ))}
                  </Conditional.If>

                  <Conditional.Else>
                    <Badge className="rounded-sm px-1 font-normal">{t('selectedCount', { count: selectedCount })}</Badge>
                  </Conditional.Else>
                </Conditional>
              </div>
            </Conditional.If>
          </Button>
        </Popover.Trigger>

        <Popover.Content className="w-56 p-0" align="start">
          <Command>
            <Command.Input placeholder={title} />

            <Command.List>
              <Command.Empty>{t('noResults')}</Command.Empty>

              <Command.Group>
                {filterOptions.map((opt) => {
                  const isSelected = selectedValues.includes(opt.value);

                  return (
                    <Command.Item key={opt.value} onSelect={() => onSelect(opt.value)}>
                      <div
                        className={cn('border-border-strong me-2 flex size-4 items-center justify-center border', {
                          'bg-accent border-accent text-accent-fg': isSelected,
                          'opacity-50 [&_svg]:invisible': !isSelected,
                          'rounded-sm': multiSelect,
                          'rounded-full': !multiSelect,
                        })}
                      >
                        <CheckIcon aria-hidden="true" className="size-3" />
                      </div>

                      <span>{opt.label}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>

              <Conditional.If condition={selectedCount > 0}>
                <Command.Separator />

                <Command.Group>
                  <Command.Item onSelect={() => onChange(undefined)} className="justify-center text-center">
                    {t('clearFilters')}
                  </Command.Item>
                </Command.Group>
              </Conditional.If>
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover>
    );
  }

  return <FormInput name={name} placeholder={title ?? t('search')} className="w-40 lg:w-64" />;
}

export default FacetedFilter;
