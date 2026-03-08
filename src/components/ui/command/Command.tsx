import { type ComponentPropsWithoutRef, type FC, type HTMLAttributes, type PropsWithChildren } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Dialog } from '@components/ui';

import { cn } from '@utils';

import { Search } from 'lucide-react';

type CommandInputProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Input>;

type CommandListProps = ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

type CommandEmptyProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>;

type CommandGroupProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;

type CommandSeparatorProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>;

type CommandItemProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;

type CommandShortcutProps = HTMLAttributes<HTMLSpanElement>;

type CommandDialogProps = PropsWithChildren<typeof Dialog>;

export type CommandProps = ComponentPropsWithoutRef<typeof CommandPrimitive>;

type CommandComponent = FC<CommandProps> & {
  Input: FC<CommandInputProps>;
  List: FC<CommandListProps>;
  Empty: FC<CommandEmptyProps>;
  Group: FC<CommandGroupProps>;
  Item: FC<CommandItemProps>;
  Separator: FC<CommandSeparatorProps>;
  Shortcut: FC<CommandShortcutProps>;
  Dialog: FC<CommandDialogProps>;
};

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <Dialog.Panel className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]: [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </Dialog.Panel>
    </Dialog>
  );
};

const Input = ({ className, ...props }: CommandInputProps) => (
  <div className="border-b-muted-200 flex items-center border-b px-1" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />

    <CommandPrimitive.Input
      data-slot="command-input"
      className={cn(
        'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  </div>
);

const List = ({ className, ...props }: CommandListProps) => (
  <CommandPrimitive.List
    data-slot="command-list"
    className={cn('flex max-h-96 flex-col overflow-x-hidden overflow-y-auto py-3', className)}
    {...props}
  />
);

const Empty = (props: CommandEmptyProps) => (
  <CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-sm" {...props} />
);

const Group = ({ className, ...props }: CommandGroupProps) => (
  <CommandPrimitive.Group
    data-slot="command-group"
    className={cn(
      'text-foreground [&_[cmdk-group-heading]]: overflow-hidden [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
      className,
    )}
    {...props}
  />
);

const Separator = ({ className, ...props }: CommandSeparatorProps) => (
  <CommandPrimitive.Separator data-slot="command-separator" className={cn('bg-muted-200 h-px w-full', className)} {...props} />
);

const Item = ({ className, disabled, ...props }: CommandItemProps) => (
  <CommandPrimitive.Item
    data-slot="command-item"
    className={cn(
      'relative flex w-full cursor-pointer items-center px-3 py-2 text-xs outline-none select-none',
      'border-muted-200 border-b transition-colors last:border-b-0',
      'hover:bg-muted-50',
      'focus:bg-muted-100 focus:text-foreground',
      'data-highlighted:bg-muted-100 data-highlighted:text-foreground',
      'aria-selected:bg-muted-100 aria-selected:text-foreground',
      '[&[data-highlighted="true"]]:bg-muted-100 [&[data-highlighted="true"]]:text-foreground',
      disabled && 'data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    {...props}
  />
);

const Shortcut = ({ className, ...props }: CommandShortcutProps) => {
  return <span className={cn('ml-auto text-xs tracking-widest', className)} {...props} />;
};

const Command: CommandComponent = ({ className, ...props }) => (
  <CommandPrimitive
    data-slot="command"
    className={cn('bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md px-2 shadow-xs', className)}
    {...props}
  />
);

Command.Input = Input;
Command.List = List;
Command.Empty = Empty;
Command.Group = Group;
Command.Separator = Separator;
Command.Item = Item;
Command.Shortcut = Shortcut;
Command.Dialog = CommandDialog;

export default Command;
