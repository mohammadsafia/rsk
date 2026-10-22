'use client';

import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

import { Avatar, Card, Badge, IconButton, Tooltip } from '@components/ui';
// !Direct import is required and not by mistake to avoid circular dependencies (FileCard reads DropdownMenu statics at module load)
import DropdownMenu from '@components/ui/dropdown-menu/DropdownMenu';
import { Combobox, ComposedButton, FileIcon, type NormalizedExtension, ComposedDropdownItem } from '@components/shared';
import { Conditional } from '@components/utils';

import { type ComboboxOptionsParams, type DateInput, useAppTranslation, useComboboxOptions, useDate } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronDown, FileText, FolderOpen, MoreHorizontal } from 'lucide-react';

export type FileCardAccessors<TEntry> = {
  getId: (entry: TEntry) => string;
  getTitle: (entry: TEntry) => string;
  getFileType: (entry: TEntry) => NormalizedExtension;
  getDate: (entry: TEntry) => DateInput | null;
};

export type FileCardSlotChildren<TEntry> = (entry: TEntry) => ReactNode;

type FileCardContextValue<TEntry> = {
  entry: TEntry;
  accessors: FileCardAccessors<TEntry>;
};

type HeaderProps = ComponentPropsWithoutRef<typeof Card.Header>;
type TitleProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'>;
type ActionsProps<TEntry> = { children: FileCardSlotChildren<TEntry> } & Pick<ComponentProps<typeof DropdownMenu.Content>, 'align'>;
type PreviewProps<TEntry> = { children: FileCardSlotChildren<TEntry>; className?: string };
type FileShapeProps = ComponentPropsWithoutRef<'div'>;
type FolderShapeProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & { count: number };
type ApprovalPromptProps = ComponentPropsWithoutRef<'p'>;
type ApproveProps = ComponentProps<typeof ComposedButton>;
type RejectProps = ComponentProps<typeof ComposedButton>;
type StatusProps<TOption> = Omit<ComboboxOptionsParams<TOption>, 'open'> & {
  value: TOption | null;
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  getOptionDot?: (option: TOption) => string;
  getOptionDisabled?: (option: TOption) => boolean;
  placeholder?: string;
  disabled?: boolean;
  onChange: (option: TOption) => void;
};
type FooterProps = ComponentPropsWithoutRef<typeof Card.Footer>;
type AssigneeProps<TOption> = Omit<ComboboxOptionsParams<TOption>, 'open'> & {
  value: TOption | null;
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  getOptionAvatar?: (option: TOption) => string | undefined;
  placeholder?: string;
  clearTitle?: string;
  disabled?: boolean;
  onChange: (option: TOption | null) => void;
};
type DateProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'>;

type FileCardProps<TEntry> = Omit<ComponentPropsWithoutRef<'article'>, 'children' | 'onClick'> & {
  entry: TEntry;
  accessors: FileCardAccessors<TEntry>;
  onClick?: (entry: TEntry) => void;
  children: ReactNode;
};

type FileCardComponents = (<TEntry>(props: FileCardProps<TEntry>) => ReactNode) & {
  Header: FC<HeaderProps>;
  Title: FC<TitleProps>;
  Actions: <TEntry>(props: ActionsProps<TEntry>) => ReactNode;
  Item: typeof ComposedDropdownItem;
  Separator: typeof DropdownMenu.Separator;
  Preview: <TEntry>(props: PreviewProps<TEntry>) => ReactNode;
  FileShape: FC<FileShapeProps>;
  FolderShape: FC<FolderShapeProps>;
  StatusPill: typeof Badge;
  ApprovalPrompt: FC<ApprovalPromptProps>;
  Approve: FC<ApproveProps>;
  Reject: FC<RejectProps>;
  Status: <TOption>(props: StatusProps<TOption>) => ReactNode;
  Footer: FC<FooterProps>;
  Assignee: <TOption>(props: AssigneeProps<TOption>) => ReactNode;
  Date: FC<DateProps>;
};

const FileCardContext = createContext<FileCardContextValue<unknown> | null>(null);

const useFileCardContext = <TEntry,>(): FileCardContextValue<TEntry> => {
  const context = useContext(FileCardContext) as FileCardContextValue<TEntry> | null;

  if (!context) throw new Error('FileCard subcomponents must be used within <FileCard>');

  return context;
};

const Header: FC<HeaderProps> = ({ className, children, ...props }) => (
  <Card.Header className={cn('flex items-center justify-between gap-2 px-4 py-3', className)} {...props}>
    {children}
  </Card.Header>
);

const Title: FC<TitleProps> = ({ className, ...props }) => {
  const { entry, accessors } = useFileCardContext();

  return (
    <div data-slot="file-card-title" className={cn('flex min-w-0 items-center gap-2', className)} {...props}>
      <FileIcon extension={accessors.getFileType(entry)} variant="chip" size={20} />

      <Tooltip content={accessors.getTitle(entry)}>
        <span className="truncate text-sm font-bold">{accessors.getTitle(entry)}</span>
      </Tooltip>
    </div>
  );
};

const Actions = <TEntry,>({ children, align = 'end' }: ActionsProps<TEntry>): ReactNode => {
  const { entry } = useFileCardContext<TEntry>();

  const { t } = useAppTranslation('common');

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton size="sm" type="button" aria-label={t('actions')}>
          <MoreHorizontal size={16} />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align={align}>{children(entry)}</DropdownMenu.Content>
    </DropdownMenu>
  );
};

const Preview = <TEntry,>({ children, className }: PreviewProps<TEntry>): ReactNode => {
  const { entry } = useFileCardContext<TEntry>();

  return (
    <div data-slot="file-card-preview" className={cn('flex min-h-44 items-center justify-center px-4 py-2', className)}>
      {children(entry)}
    </div>
  );
};

const FileShape: FC<FileShapeProps> = ({ className, children, ...props }) => (
  <div
    data-slot="file-card-file-shape"
    className={cn('relative isolate flex min-h-40 w-full flex-col items-center justify-center gap-3 px-6 py-4', className)}
    {...props}
  >
    <FileText size={160} strokeWidth={1.25} className="text-border absolute inset-0 -z-10 m-auto" />

    <div className="flex flex-col items-center gap-3">{children}</div>
  </div>
);

const FolderShape: FC<FolderShapeProps> = ({ className, count, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <div
      data-slot="file-card-folder-shape"
      className={cn(
        'bg-surface-sunken relative flex min-h-40 w-full max-w-44 flex-col items-center justify-center gap-2 rounded-md px-4 py-6',
        className,
      )}
      {...props}
    >
      <FolderOpen size={36} aria-hidden="true" className="text-fg-subtle" />

      <span className="text-2xl font-bold tabular-nums">{count}</span>

      <span className="text-2xs text-fg-muted font-medium uppercase">{t('fileCard.documents', { count })}</span>
    </div>
  );
};

const ApprovalPrompt: FC<ApprovalPromptProps> = ({ className, children, ...props }) => (
  <p data-slot="file-card-approval-prompt" className={cn('text-fg-muted text-xs font-medium', className)} {...props}>
    {children}
  </p>
);

const Approve: FC<ApproveProps> = ({ children, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <ComposedButton variant="outline" size="lg" {...props}>
      {children ?? t('fileCard.approve')}
    </ComposedButton>
  );
};

const Reject: FC<RejectProps> = ({ children, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <ComposedButton variant="outline" tone="danger" size="lg" {...props}>
      {children ?? t('fileCard.reject')}
    </ComposedButton>
  );
};

const Status = <TOption,>({
  options,
  value,
  getOptionLabel,
  getOptionValue,
  getOptionDot,
  getOptionDisabled,
  queryKey = 'file-card-status-options',
  urlSearchParams,
  placeholder,
  disabled,
  onChange,
}: StatusProps<TOption>): ReactNode => {
  const { t } = useAppTranslation('common');

  const [open, setOpen] = useState(false);

  const { search, setSearch, allOptions, isAsync, onScroll, isLoading, isFetchingNextPage } = useComboboxOptions<TOption>({
    options,
    open,
    queryKey,
    urlSearchParams,
  });

  const selectedValue = value ? getOptionValue(value) : null;

  const onSelect = (option: TOption) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div data-slot="file-card-status" className="px-4 py-3">
      <Combobox open={open} onOpenChange={setOpen}>
        <Combobox.Trigger size="sm" className="bg-surface-sunken rounded-full border-none px-4 shadow-none" disabled={disabled}>
          <Conditional.If condition={!!value && !!getOptionDot}>
            <span className={cn('size-3 rounded-full', value && getOptionDot?.(value))} />
          </Conditional.If>

          <Combobox.Value className="text-sm font-bold">
            {value ? getOptionLabel(value) : (placeholder ?? t('fileCard.selectStatus'))}
          </Combobox.Value>

          <Combobox.Icon />
        </Combobox.Trigger>

        <Combobox.Content shouldFilter={!isAsync}>
          <Combobox.Input placeholder={t('searchPlaceholder')} {...(isAsync && { value: search, onValueChange: setSearch })}>
            <Combobox.Loader when={isLoading} />
          </Combobox.Input>

          <Combobox.List onScroll={onScroll}>
            <Combobox.Empty when={!isLoading && allOptions.length === 0}>{t('fileCard.noOptions')}</Combobox.Empty>

            {allOptions.map((option) => {
              const optValue = getOptionValue(option);

              return (
                <Combobox.Item
                  key={optValue}
                  value={getOptionLabel(option)}
                  disabled={getOptionDisabled?.(option)}
                  data-checked={selectedValue === optValue || undefined}
                  onSelect={() => onSelect(option)}
                >
                  <Combobox.Indicator />

                  <Conditional.If condition={!!getOptionDot}>
                    <span className={cn('size-3 rounded-full', getOptionDot?.(option))} />
                  </Conditional.If>

                  {getOptionLabel(option)}
                </Combobox.Item>
              );
            })}

            <Combobox.Loader when={isFetchingNextPage} message={t('loadingMore')} />
          </Combobox.List>
        </Combobox.Content>
      </Combobox>
    </div>
  );
};

const Footer: FC<FooterProps> = ({ className, children, ...props }) => (
  <Card.Footer className={cn('flex items-center justify-between gap-2 px-4 py-3', className)} {...props}>
    {children}
  </Card.Footer>
);

const Assignee = <TOption,>({
  options,
  value,
  getOptionLabel,
  getOptionValue,
  getOptionAvatar,
  queryKey = 'file-card-assignee-options',
  urlSearchParams,
  placeholder,
  clearTitle,
  disabled,
  onChange,
}: AssigneeProps<TOption>): ReactNode => {
  const { t } = useAppTranslation('common');

  const [open, setOpen] = useState(false);

  const { search, setSearch, allOptions, isAsync, onScroll, isLoading, isFetchingNextPage } = useComboboxOptions<TOption>({
    options,
    open,
    queryKey,
    urlSearchParams,
    selectedItemsIds: value ? [getOptionValue(value)] : undefined,
  });

  const selectedValue = value ? getOptionValue(value) : null;
  const selectedLabel = value ? getOptionLabel(value) : (placeholder ?? t('fileCard.unassigned'));
  const selectedAvatarUrl = value ? getOptionAvatar?.(value) : undefined;
  const selectedInitials = value ? getOptionLabel(value).slice(0, 2).toUpperCase() : '?';

  const onSelect = (option: TOption) => {
    onChange(option);
    setOpen(false);
  };

  const onClear = () => onChange(null);

  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <Combobox.Trigger
        className={cn(
          'w-auto max-w-3/4 rounded-none border-0 bg-transparent p-0 shadow-none ring-0',
          'hover:not-disabled:border-transparent hover:not-disabled:ring-0',
          'focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none',
          'data-[state=open]:border-transparent data-[state=open]:ring-0',
        )}
        disabled={disabled}
      >
        <Avatar size="sm" className="text-2xs ring-surface shrink-0 font-bold ring-2">
          <Avatar.Image src={selectedAvatarUrl} alt={selectedLabel} />

          <Avatar.Fallback className="bg-fg text-fg-inverse">{selectedInitials}</Avatar.Fallback>
        </Avatar>

        <Tooltip content={selectedLabel}>
          <span className="truncate text-sm font-medium">{selectedLabel}</span>
        </Tooltip>

        <Combobox.Clear when={!!value && !disabled} title={clearTitle} onClear={onClear} />

        <ChevronDown size={14} aria-hidden="true" className="text-fg-muted shrink-0" />
      </Combobox.Trigger>

      {/* A comfortable list width, capped by the room the screen has (a narrow phone). */}
      <Combobox.Content className="w-72 max-w-(--radix-popover-content-available-width)" shouldFilter={!isAsync}>
        <Combobox.Input placeholder={t('searchPlaceholder')} {...(isAsync && { value: search, onValueChange: setSearch })}>
          <Combobox.Loader when={isLoading} />
        </Combobox.Input>

        <Combobox.List onScroll={onScroll}>
          <Combobox.Empty when={!isLoading && allOptions.length === 0}>{t('fileCard.noAssignees')}</Combobox.Empty>

          {allOptions.map((option) => {
            const optValue = getOptionValue(option);

            return (
              <Combobox.Item
                key={optValue}
                value={getOptionLabel(option)}
                data-checked={selectedValue === optValue || undefined}
                onSelect={() => onSelect(option)}
              >
                <Combobox.Indicator />

                <Avatar size="sm" className="text-2xs ring-surface font-bold ring-2">
                  <Avatar.Image src={getOptionAvatar?.(option)} alt={getOptionLabel(option)} />

                  <Avatar.Fallback className="bg-fg text-fg-inverse">{getOptionLabel(option).slice(0, 2).toUpperCase()}</Avatar.Fallback>
                </Avatar>

                {getOptionLabel(option)}
              </Combobox.Item>
            );
          })}

          <Combobox.Loader when={isFetchingNextPage} message={t('loadingMore')} />
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
};

const FileDate: FC<DateProps> = ({ className, ...props }) => {
  const { entry, accessors } = useFileCardContext();
  const { formatNullableDate, constants } = useDate();

  return (
    <span data-slot="file-card-date" dir="ltr" className={cn('text-fg-muted text-xs font-medium tabular-nums', className)} {...props}>
      {formatNullableDate(accessors.getDate(entry), constants.DateFormats.US_DATE, '')}
    </span>
  );
};

function FileCardRoot<TEntry>({ entry, accessors, onClick, className, children, ...props }: FileCardProps<TEntry>): ReactNode {
  const contextValue = useMemo<FileCardContextValue<TEntry>>(() => ({ entry, accessors }), [entry, accessors]);

  return (
    <FileCardContext.Provider value={contextValue as FileCardContextValue<unknown>}>
      <Card
        className={cn(
          'border-border flex flex-col border transition-transform motion-reduce:transition-none',
          onClick && 'cursor-pointer hover:-translate-y-1',
          className,
        )}
        onClick={onClick ? () => onClick(entry) : undefined}
        {...props}
      >
        {children}
      </Card>
    </FileCardContext.Provider>
  );
}

const FileCard = FileCardRoot as FileCardComponents;

FileCard.Header = Header;
FileCard.Title = Title;
FileCard.Actions = Actions;
FileCard.Item = ComposedDropdownItem;
FileCard.Separator = DropdownMenu.Separator;
FileCard.Preview = Preview;
FileCard.FileShape = FileShape;
FileCard.FolderShape = FolderShape;
FileCard.StatusPill = Badge;
FileCard.ApprovalPrompt = ApprovalPrompt;
FileCard.Approve = Approve;
FileCard.Reject = Reject;
FileCard.Status = Status;
FileCard.Footer = Footer;
FileCard.Assignee = Assignee;
FileCard.Date = FileDate;

Header.displayName = 'FileCardHeader';
Title.displayName = 'FileCardTitle';
Preview.displayName = 'FileCardPreview';
FileShape.displayName = 'FileCardFileShape';
FolderShape.displayName = 'FileCardFolderShape';
ApprovalPrompt.displayName = 'FileCardApprovalPrompt';
FileCard.Approve.displayName = 'FileCardApprove';
FileCard.Reject.displayName = 'FileCardReject';
Footer.displayName = 'FileCardFooter';
FileDate.displayName = 'FileCardDate';

export default FileCard;
