import { type Control, useController } from 'react-hook-form';

import { Badge, Button, Command, Divider, Popover } from '@components/ui';
import { Conditional } from '@components/utils';
import { FormDateRange, FormInput } from '@components/forms';
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
            <PlusIcon className="mr-2 h-4 w-4" />

            {title}

            <Conditional.If condition={selectedCount > 0}>
              <Divider orientation="vertical" className="mx-2 h-4" />

              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedCount}
              </Badge>

              <div className="hidden space-x-1 lg:flex">
                <Conditional>
                  <Conditional.If condition={selectedCount < 3}>
                    {filterOptions
                      .filter((opt) => selectedValues.includes(opt.value))
                      .map((opt) => (
                        <Badge key={opt.value} variant="secondary" className="rounded-sm px-1 font-normal">
                          {opt.label}
                        </Badge>
                      ))}
                  </Conditional.If>

                  <Conditional.Else>
                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                      {selectedCount} selected
                    </Badge>
                  </Conditional.Else>
                </Conditional>
              </div>
            </Conditional.If>
          </Button>
        </Popover.Trigger>

        <Popover.Content className="w-[200px] p-0" align="start">
          <Command>
            <Command.Input placeholder={title} />

            <Command.List>
              <Command.Empty>No results found.</Command.Empty>

              <Command.Group>
                {filterOptions.map((opt) => {
                  const isSelected = selectedValues.includes(opt.value);

                  return (
                    <Command.Item key={opt.value} onSelect={() => onSelect(opt.value)}>
                      <div
                        className={cn('border-primary mr-2 flex h-4 w-4 items-center justify-center border', {
                          'bg-primary text-primary-foreground': isSelected,
                          'opacity-50 [&_svg]:invisible': !isSelected,
                          'rounded-sm': multiSelect,
                          'rounded-full': !multiSelect,
                        })}
                      >
                        <CheckIcon size={16} />
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
                    Clear filters
                  </Command.Item>
                </Command.Group>
              </Conditional.If>
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover>
    );
  }

  return <FormInput name={name} placeholder={title ?? 'Search'} className="m-0 mr-0 h-[36px] w-[150px] lg:w-[250px]" />;
}

export default FacetedFilter;
