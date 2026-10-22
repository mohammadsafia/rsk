'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC, type HTMLAttributes, useLayoutEffect, useRef } from 'react';

import { Command as CommandPrimitive, useCommandState } from 'cmdk';
import { Dialog } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { cn, mergeRefs } from '@utils';

import { CheckIcon, Search } from 'lucide-react';

type CommandInputProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Input>;

type CommandListProps = ComponentProps<typeof CommandPrimitive.List>;

type CommandEmptyProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & { when?: boolean };

type CommandGroupProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;

type CommandItemProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;

type CommandIndicatorProps = ComponentPropsWithoutRef<'span'>;

type CommandShortcutProps = HTMLAttributes<HTMLSpanElement>;

type CommandSeparatorProps = ComponentProps<typeof CommandPrimitive.Separator>;

type CommandDialogProps = ComponentPropsWithoutRef<typeof Dialog> & {
  title: string;
  /** Custom ranking (cmdk `filter`), e.g. to ignore diacritics. */
  filter?: ComponentPropsWithoutRef<typeof CommandPrimitive>['filter'];
};

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
  <div className="border-border-subtle flex items-center gap-2 border-b px-3" data-cmdk-input-wrapper="">
    <Search size={16} className="text-fg-muted shrink-0" />

    <CommandPrimitive.Input
      data-slot="command-input"
      className={cn(
        'placeholder:text-fg-muted flex h-control-lg w-full bg-transparent text-sm outline-none disabled:pointer-events-none',
        className,
      )}
      {...props}
    />

    {children}
  </div>
);

const CommandList: FC<CommandListProps> = ({ ref, className, ...props }) => {
  const { t } = useAppTranslation('common');
  // A listbox must hold options: while nothing matches, the list is announced as a plain region (its Empty text).
  // cmdk hard-codes role="listbox" after our props, so the role is set on the element; React leaves it alone because
  // cmdk's own prop never changes.
  const matches = useCommandState((state) => state.filtered.count);
  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    listRef.current?.setAttribute('role', matches === 0 ? 'region' : 'listbox');
  }, [matches]);

  return (
    <CommandPrimitive.List
      ref={mergeRefs(ref, listRef)}
      data-slot="command-list"
      label={t('command.suggestions')}
      className={cn('flex max-h-96 flex-col overflow-x-hidden overflow-y-auto', className)}
      {...props}
    />
  );
};

const CommandEmpty: FC<CommandEmptyProps> = ({ when, ...props }) => {
  if (!when) return null;

  return <CommandPrimitive.Empty data-slot="command-empty" className="text-fg-muted py-6 text-center text-sm" {...props} />;
};

const CommandGroup: FC<CommandGroupProps> = ({ className, ...props }) => (
  <CommandPrimitive.Group
    data-slot="command-group"
    className={cn(
      'text-fg p-1 **:[[cmdk-group-heading]]:overflow-hidden',
      '**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-fg-muted',
      className,
    )}
    {...props}
  />
);

const CommandItem: FC<CommandItemProps> = ({ className, ...props }) => (
  <CommandPrimitive.Item
    data-slot="command-item"
    className={cn(
      'group/command-item relative flex min-h-control-sm w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none',
      'data-[selected=true]:bg-hover data-[checked=true]:ink',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:text-fg-subtle',
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
    {children ?? <CheckIcon className="text-fg-muted size-4" />}
  </span>
);

const CommandShortcut: FC<CommandShortcutProps> = ({ className, ...props }) => (
  <span className={cn('text-fg-muted ms-auto font-mono text-2xs', className)} {...props} />
);

/** A listbox may only hold options and groups, so the divider is decorative (cmdk hard-codes role="separator"). */
const decorative = (node: HTMLDivElement | null) => node?.setAttribute('role', 'none');

const CommandItemSeparator: FC<CommandSeparatorProps> = ({ ref, className, ...props }) => (
  <CommandPrimitive.Separator
    ref={mergeRefs(ref, decorative)}
    data-slot="command-separator"
    className={cn('bg-border-subtle -mx-1 my-1 h-px', className)}
    {...props}
  />
);

const CommandDialog: FC<CommandDialogProps> = ({ title, filter, children, ...props }) => (
  <Dialog {...props}>
    <Dialog.Content title={title} hideTitle className="gap-0 overflow-hidden p-0">
      <Command
        label={title}
        filter={filter}
        className={cn(
          '**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium',
          '[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[data-cmdk-input-wrapper]_svg]:h-5',
          '[&_[data-cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 **:[[cmdk-group]]:px-2',
          '**:[[cmdk-input]]:h-12 **:[[cmdk-item]]:p-3 **:[[data-cmdk-input-wrapper]]:pe-12',
        )}
      >
        {children}
      </Command>
    </Dialog.Content>
  </Dialog>
);

const Command: CommandComponent = ({ className, ...props }) => (
  <CommandPrimitive
    data-slot="command"
    className={cn('bg-surface-raised text-fg flex h-full w-full flex-col overflow-hidden rounded-lg', className)}
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
