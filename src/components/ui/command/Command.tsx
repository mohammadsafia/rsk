import { type ComponentPropsWithoutRef, type FC, type HTMLAttributes } from 'react';

import { Command as CommandPrimitive } from 'cmdk';
import { Dialog } from '@components/ui';

import { cn } from '@utils';

import { CheckIcon, Search } from 'lucide-react';

type CommandInputProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Input>;

type CommandListProps = ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

type CommandEmptyProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & { when?: boolean };

type CommandGroupProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;

type CommandItemProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;

type CommandIndicatorProps = ComponentPropsWithoutRef<'span'>;

type CommandShortcutProps = HTMLAttributes<HTMLSpanElement>;

type CommandSeparatorProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>;

type CommandDialogProps = ComponentPropsWithoutRef<typeof Dialog>;

export type CommandProps = ComponentPropsWithoutRef<typeof CommandPrimitive>;

type CommandComponent = FC<CommandProps> & {
  Input: FC<CommandInputProps>;
  List: FC<CommandListProps>;
  Empty: FC<CommandEmptyProps>;
  Group: FC<CommandGroupProps>;
  Item: FC<CommandItemProps>;
  Indicator: FC<CommandIndicatorProps>;
  Shortcut: FC<CommandShortcutProps>;
  Separator: FC<CommandSeparatorProps>;
  Dialog: FC<CommandDialogProps>;
};

const CommandInput: FC<CommandInputProps> = ({ className, children, ...props }) => (
  <div className="border-b-muted-200 flex items-center gap-2 border-b px-3" cmdk-input-wrapper="">
    <Search size={16} className="text-muted shrink-0" />

    <CommandPrimitive.Input
      data-slot="command-input"
      className={cn('flex w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:pointer-events-none', className)}
      {...props}
    />

    {children}
  </div>
);

const CommandList: FC<CommandListProps> = ({ className, ...props }) => (
  <CommandPrimitive.List
    data-slot="command-list"
    className={cn('flex max-h-96 flex-col overflow-x-hidden overflow-y-auto', className)}
    {...props}
  />
);

const CommandEmpty: FC<CommandEmptyProps> = ({ when, ...props }) => {
  if (!when) return null;

  return <CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-sm" {...props} />;
};

const CommandGroup: FC<CommandGroupProps> = ({ className, ...props }) => (
  <CommandPrimitive.Group
    data-slot="command-group"
    className={cn(
      'text-foreground **:[[cmdk-group-heading]]:overflow-hidden',
      '**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium',
      className,
    )}
    {...props}
  />
);

const CommandItem: FC<CommandItemProps> = ({ className, ...props }) => (
  <CommandPrimitive.Item
    data-slot="command-item"
    className={cn(
      'group/command-item bg-background border-muted-200 flex w-full items-center gap-2 px-3 py-2 text-sm',
      'relative cursor-pointer leading-none transition-colors outline-none select-none not-last:border-b',
      'hover:bg-primary-15',
      'data-[checked=true]:bg-primary-25 data-[checked=true]:text-primary-900 data-[checked=true]:border-b-muted-50',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className,
    )}
    {...props}
  />
);

const CommandItemIndicator: FC<CommandIndicatorProps> = ({ className, children, ...props }) => (
  <span
    data-slot="command-item-indicator"
    className={cn(
      'flex shrink-0',
      !children && 'opacity-0 transition-opacity group-data-[checked=true]/command-item:opacity-100',
      className,
    )}
    {...props}
  >
    {children ?? <CheckIcon size={16} />}
  </span>
);

const CommandShortcut: FC<CommandShortcutProps> = ({ className, ...props }) => (
  <span className={cn('ms-auto text-xs tracking-widest', className)} {...props} />
);

const CommandItemSeparator: FC<CommandSeparatorProps> = ({ className, ...props }) => (
  <CommandPrimitive.Separator data-slot="command-separator" className={cn('bg-muted-200 h-px w-full', className)} {...props} />
);

const CommandDialog: FC<CommandDialogProps> = ({ children, ...props }) => (
  <Dialog {...props}>
    <Dialog.Panel className="overflow-hidden p-0">
      <Command
        className={cn(
          '**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium',
          '[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5',
          '[&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 **:[[cmdk-group]]:px-2',
          '**:[[cmdk-input]]:h-12 **:[[cmdk-item]]:p-3',
        )}
      >
        {children}
      </Command>
    </Dialog.Panel>
  </Dialog>
);

const Command: CommandComponent = ({ className, ...props }) => (
  <CommandPrimitive
    data-slot="command"
    className={cn('bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md shadow-xs', className)}
    {...props}
  />
);

Command.Input = CommandInput;
Command.List = CommandList;
Command.Empty = CommandEmpty;
Command.Group = CommandGroup;
Command.Item = CommandItem;
Command.Indicator = CommandItemIndicator;
Command.Shortcut = CommandShortcut;
Command.Separator = CommandItemSeparator;
Command.Dialog = CommandDialog;

CommandInput.displayName = 'CommandInput';
CommandList.displayName = 'CommandList';
CommandEmpty.displayName = 'CommandEmpty';
CommandGroup.displayName = 'CommandGroup';
CommandItem.displayName = 'CommandItem';
CommandItemIndicator.displayName = 'CommandIndicator';
CommandShortcut.displayName = 'CommandShortcut';
CommandItemSeparator.displayName = 'CommandSeparator';
CommandDialog.displayName = 'CommandDialog';
Command.displayName = 'Command';

export default Command;
