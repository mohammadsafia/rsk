import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef, type PropsWithChildren } from 'react';

import { Command, type CommandProps, Popover } from '@components/ui';
import { TooltipButton } from '@components/shared';

import { cn } from '@utils';

import { ChevronsUpDownIcon, Loader2Icon, XIcon } from 'lucide-react';

type ComboboxTriggerProps = ComponentProps<typeof Popover.Trigger>;

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

const ComboboxTrigger: FC<ComboboxTriggerProps> = ({ className, children, ...props }) => (
  <Popover.Trigger
    data-slot="combobox-trigger"
    role="combobox"
    className={cn(
      'group/combobox-trigger bg-background relative flex w-full cursor-pointer items-center gap-2 rounded-md border p-3 text-sm shadow-xs',
      'text-muted-foreground border-muted-200 transition-[color,box-shadow]',
      'data-[state=open]:border-primary data-[state=open]:ring-primary data-[state=open]:ring',
      'hover:not-disabled:border-primary hover:not-disabled:ring-primary hover:not-disabled:ring',
      'focus-visible:ring-primary focus-visible:border-primary focus-visible:ring focus-visible:outline-none',
      'disabled:bg-muted-50 disabled:text-muted-300 disabled:pointer-events-none',
      className,
    )}
    {...props}
  >
    {children}
  </Popover.Trigger>
);

const ComboboxValue: FC<ComboboxValueProps> = ({ placeholder, children, className, ...props }) => (
  <span data-slot="combobox-value" className={cn('flex-1 truncate text-start', className)} {...props}>
    {children ?? placeholder}
  </span>
);

const ComboboxClear: FC<ComboboxClearProps> = ({ when, title = 'Clear', onClear }) => {
  if (!when) return null;

  return (
    <TooltipButton
      asChild
      title={title}
      variant="ghost-muted-destructive"
      size="unstyled"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClear();
      }}
    >
      <XIcon size={16} />
    </TooltipButton>
  );
};

const ComboboxIcon: FC<ComboboxIconProps> = ({ className, children, ...props }) => (
  <span data-slot="combobox-icon" {...props}>
    {children ?? (
      <ChevronsUpDownIcon
        size={20}
        className={cn(
          'text-muted-400 shrink-0 transition-colors',
          'group-data-[state=open]/combobox-trigger:text-primary',
          'group-disabled/combobox-trigger:text-muted-300',
          className,
        )}
      />
    )}
  </span>
);

const ComboboxContent: FC<ComboboxContentProps> = ({ children, className, shouldFilter, align = 'start', ...props }) => (
  <Popover.Content
    align={align}
    className={cn('w-(--radix-popover-trigger-width) p-0', className)}
    onOpenAutoFocus={(e) => e.preventDefault()}
    {...props}
  >
    <Command shouldFilter={shouldFilter}>{children}</Command>
  </Popover.Content>
);

const ComboboxInput: FC<ComboboxInputProps> = (props) => <Command.Input {...props} />;

const ComboboxLoader: FC<ComboboxLoaderProps> = ({ when, message, className }) => {
  if (!when) return null;

  if (!message) return <Loader2Icon size={20} className={cn('text-muted-400 animate-spin', className)} />;

  return (
    <div className={cn('text-muted-400 flex items-center justify-center gap-2 py-2', className)}>
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

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
Combobox.Trigger = forwardRef<HTMLButtonElement, ComboboxTriggerProps>((props, ref) => ComboboxTrigger({ ...props, ref }));
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
