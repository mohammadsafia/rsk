'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC, type PropsWithChildren, useId } from 'react';

import { Command, type CommandProps, fieldVariants, type FieldVariants, Popover } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronsUpDownIcon, Loader2Icon, XIcon } from 'lucide-react';

type ComboboxTriggerProps = ComponentProps<typeof Popover.Trigger> & FieldVariants & { invalid?: boolean };

type ComboboxValueProps = ComponentPropsWithoutRef<'span'> & { placeholder?: string };

type ComboboxClearProps = {
  when: boolean;
  title?: string;
  onClear: () => void;
};

type ComboboxIconProps = ComponentPropsWithoutRef<'span'>;

type ComboboxContentProps = ComponentPropsWithoutRef<typeof Popover.Content> & Pick<CommandProps, 'shouldFilter'>;

type ComboboxInputProps = ComponentPropsWithoutRef<typeof Command.Input>;

type ComboboxLoaderProps = {
  when: boolean;
  message?: string;
  className?: string;
};

type ComboboxListProps = ComponentPropsWithoutRef<typeof Command.List>;

type ComboboxEmptyProps = ComponentPropsWithoutRef<typeof Command.Empty>;

type ComboboxItemProps = ComponentPropsWithoutRef<typeof Command.Item>;

type ComboboxIndicatorProps = ComponentPropsWithoutRef<typeof Command.Indicator>;

export type ComboboxProps = PropsWithChildren<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

type ComboboxComponent = FC<ComboboxProps> & {
  Trigger: FC<ComboboxTriggerProps>;
  Value: FC<ComboboxValueProps>;
  Clear: FC<ComboboxClearProps>;
  Icon: FC<ComboboxIconProps>;
  Content: FC<ComboboxContentProps>;
  Input: FC<ComboboxInputProps>;
  Loader: FC<ComboboxLoaderProps>;
  List: FC<ComboboxListProps>;
  Empty: FC<ComboboxEmptyProps>;
  Item: FC<ComboboxItemProps>;
  Indicator: FC<ComboboxIndicatorProps>;
};

const ComboboxTrigger: FC<ComboboxTriggerProps> = ({ className, size, invalid, children, ...props }) => {
  // role="combobox" isn't named by its content (a self-reference would read its empty value), so without a label it
  // would be announced as nameless: label it with its own visible text, wrapped in a layout-neutral span.
  const textId = useId();
  const labelledBy = props['aria-labelledby'] ?? (props['aria-label'] ? undefined : textId);

  return (
    <Popover.Trigger
      data-slot="combobox-trigger"
      role="combobox"
      aria-invalid={invalid || undefined}
      className={cn(
        fieldVariants({ size }),
        'group/combobox-trigger data-[state=open]:border-accent cursor-pointer gap-2 text-start',
        className,
      )}
      {...props}
      aria-labelledby={labelledBy}
    >
      <span id={textId} className="contents">
        {children}
      </span>
    </Popover.Trigger>
  );
};

const ComboboxValue: FC<ComboboxValueProps> = ({ placeholder, children, className, ...props }) => (
  <span data-slot="combobox-value" className={cn('flex-1 truncate text-start', !children && 'text-fg-muted', className)} {...props}>
    {children ?? placeholder}
  </span>
);

const ComboboxClear: FC<ComboboxClearProps> = ({ when, title, onClear }) => {
  const { t } = useAppTranslation('common');

  if (!when) return null;

  return (
    <XIcon
      size={16}
      role="button"
      aria-label={title ?? t('clear')}
      className="text-fg-muted hover:text-danger shrink-0 cursor-pointer"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onClear();
      }}
    />
  );
};

const ComboboxIcon: FC<ComboboxIconProps> = ({ className, children, ...props }) => (
  <span data-slot="combobox-icon" {...props}>
    {children ?? (
      <ChevronsUpDownIcon
        aria-hidden="true"
        className={cn(
          'text-fg-muted size-4 shrink-0 transition-colors',
          'group-data-[state=open]/combobox-trigger:text-accent group-disabled/combobox-trigger:text-fg-subtle',
          className,
        )}
      />
    )}
  </span>
);

const ComboboxContent: FC<ComboboxContentProps> = ({ children, className, shouldFilter, align = 'start', onOpenAutoFocus, ...props }) => (
  <Popover.Content
    align={align}
    className={cn('w-(--radix-popover-trigger-width) p-0', className)}
    onOpenAutoFocus={(event) => {
      onOpenAutoFocus?.(event);
      if (event.defaultPrevented) return;

      // Land in the search field so typing filters straight away; without one, keep Radix's default focus.
      const search = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLInputElement>('[cmdk-input]');
      if (!search) return;

      event.preventDefault();
      search.focus();
    }}
    {...props}
  >
    <Command shouldFilter={shouldFilter}>{children}</Command>
  </Popover.Content>
);

const ComboboxInput: FC<ComboboxInputProps> = (props) => <Command.Input {...props} />;

const ComboboxLoader: FC<ComboboxLoaderProps> = ({ when, message, className }) => {
  if (!when) return null;

  if (!message) return <Loader2Icon size={20} className={cn('text-fg-muted animate-spin', className)} />;

  return (
    <div className={cn('text-fg-muted flex items-center justify-center gap-2 py-2', className)}>
      <Loader2Icon size={16} className="animate-spin" />

      <span className="text-xs">{message}</span>
    </div>
  );
};

const ComboboxList: FC<ComboboxListProps> = (props) => <Command.List {...props} />;

const ComboboxEmpty: FC<ComboboxEmptyProps> = (props) => <Command.Empty {...props} />;

const ComboboxItem: FC<ComboboxItemProps> = (props) => <Command.Item {...props} />;

const ComboboxIndicator: FC<ComboboxIndicatorProps> = (props) => <Command.Indicator {...props} />;

const Combobox: ComboboxComponent = ({ open, onOpenChange, children }: ComboboxProps) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    {children as ComponentPropsWithoutRef<typeof Popover>['children']}
  </Popover>
);

Combobox.Trigger = ComboboxTrigger;
Combobox.Value = ComboboxValue;
Combobox.Clear = ComboboxClear;
Combobox.Icon = ComboboxIcon;
Combobox.Content = ComboboxContent;
Combobox.Input = ComboboxInput;
Combobox.Loader = ComboboxLoader;
Combobox.List = ComboboxList;
Combobox.Empty = ComboboxEmpty;
Combobox.Item = ComboboxItem;
Combobox.Indicator = ComboboxIndicator;

Combobox.Trigger.displayName = 'ComboboxTrigger';
ComboboxValue.displayName = 'ComboboxValue';
ComboboxClear.displayName = 'ComboboxClear';
ComboboxIcon.displayName = 'ComboboxIcon';
ComboboxContent.displayName = 'ComboboxContent';
ComboboxInput.displayName = 'ComboboxInput';
ComboboxLoader.displayName = 'ComboboxLoader';
ComboboxList.displayName = 'ComboboxList';
ComboboxEmpty.displayName = 'ComboboxEmpty';
ComboboxItem.displayName = 'ComboboxItem';
ComboboxIndicator.displayName = 'ComboboxIndicator';
Combobox.displayName = 'Combobox';

export default Combobox;
