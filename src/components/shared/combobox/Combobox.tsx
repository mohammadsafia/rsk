import {
  Children,
  type ComponentPropsWithoutRef,
  createContext,
  type FC,
  isValidElement,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type UIEvent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Command as CommandPrimitive } from 'cmdk';

import { Command, type CommandProps, Popover } from '@components/ui';
import { Conditional } from '@components/utils';
import { TooltipButton } from '@components/shared';

import { cn } from '@utils';

import { type AsyncOptionsFn, useAsyncOptionsInfiniteQuery, useDebounce, useInfiniteScroll } from '@hooks/shared';

import { CheckIcon, ChevronsUpDown, Loader2, Search, XIcon } from 'lucide-react';

import type { FormSelectOption } from '@app-types';

type ComboboxContextValue<TOption = FormSelectOption> = {
  displayValue: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  value: string | null;
  handleClear: () => void;
  handleItemSelect: (selectedLabelOrValue: string) => void;
  mappedOptions: TOption[];
  infiniteQuery: ReturnType<typeof useAsyncOptionsInfiniteQuery>;
  handleScroll: (e: UIEvent<HTMLDivElement>) => void;
  isAsyncOptions: boolean;
  placeholder: string;
  noOptionsText: string;
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  getOptionDisabled?: (option: TOption) => boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  findOptionByValue: (val: string | null) => TOption | undefined;
  debouncedSearch: string;
  hasValue: boolean;
};

export type ComboboxProps<TOption = FormSelectOption> = Omit<CommandProps, 'value' | 'onChange'> & {
  /**
   * Controlled value. Can be a string ID (when valueType='flat') or an option object (when valueType='contain').
   * If provided, the component is controlled.
   */
  value?: string | null;
  /**
   * Default value for uncontrolled mode. Can be a string ID (when valueType='flat') or an option object (when valueType='contain').
   */
  defaultValue?: string | null;
  /**
   * Callback fired when the value changes. Receives the new value.
   * For 'flat' type, receives string | null. For 'contain' type, receives TOption | null.
   */
  onChange?: (value: string | null) => void;
  /**
   * Callback fired when the value changes in 'contain' mode. Receives the full selected option object.
   * Only used when valueType='contain'.
   */
  onOptionChange?: (option: TOption | null) => void;
  /**
   * Options to display. Can be a static array of options or an async function that fetches options.
   * For async options, the function should return a Promise<PaginatedDataTable<TOption>>.
   */
  options: TOption[] | AsyncOptionsFn<TOption>;
  /**
   * Placeholder text displayed when no option is selected.
   * @default 'Select'
   */
  placeholder?: string;
  /**
   * Text displayed when no options are available.
   * @default 'No options'
   */
  noOptionsText?: string;
  /**
   * Determines how values are stored and passed to onChange.
   * - 'flat': Values are stored as string IDs, onChange receives string | null
   * - 'contain': Values are stored as full option objects, onChange receives TOption | null
   * @default 'flat'
   */
  valueType?: 'flat' | 'contain';
  /**
   * Function to extract the display label from an option object.
   */
  getOptionLabel(option: TOption): string;
  /**
   * Function to extract the unique value/ID from an option object.
   */
  getOptionValue(option: TOption): string;
  /**
   * Optional function to determine if an option should be disabled.
   */
  getOptionDisabled?(option: TOption): boolean;
  /**
   * Optional function to transform/map options before they are displayed.
   * Useful for adding computed properties or filtering options.
   */
  optionMapper?(option: TOption): TOption;
  /**
   * Additional URL search parameters to include in async option requests.
   * Can be a URLSearchParams object or a string.
   */
  urlSearchParams?: URLSearchParams | string;
  /**
   * Debounce delay in milliseconds for search input when using async options.
   * @default 500
   */
  debounceMs?: number;
  /**
   * Number of items to fetch per page for async options with infinite scroll.
   * @default 20
   */
  pageSize?: number;
  /**
   * Whether the combobox is disabled.
   */
  disabled?: boolean;
  /**
   * Additional CSS classes to apply to the trigger button.
   */
  className?: string;
  /**
   * HTML id attribute for the trigger button.
   */
  id?: string;
  /**
   * Query key identifier for React Query cache (used for async options).
   * Should be unique per field/instance.
   * @default 'combobox'
   */
  queryKey?: string;
  /**
   * Children for composition mode. If provided, renders in composition mode.
   */
  children?: ReactNode;
};

type ComboboxComponents = (<TOption = FormSelectOption>(props: ComboboxProps<TOption>) => ReactElement) & {
  Trigger: typeof ComboboxTrigger;
  Clear: typeof ComboboxClear;
  Content: typeof ComboboxContent;
  Empty: typeof ComboboxEmpty;
  Loader: typeof ComboboxLoader;
};

type ComboboxClearProps = {
  onClear?: () => void;
  disabled?: boolean;
  hasValue?: boolean;
};

type ComboboxContentProps = ComponentPropsWithoutRef<typeof Popover.Content> & {
  children?: ReactNode;
};

type ComboboxTriggerProps = ComponentPropsWithoutRef<'button'> & {
  children?: ReactNode;
};

type ComboboxLoaderProps = {
  isLoading: boolean;
};

type ComboboxEmptyProps = {
  when: boolean;
  message?: string;
  error?: boolean;
};

const ComboboxContext = createContext<ComboboxContextValue<any> | null>(null);

export const useComboboxContext = <TOption = FormSelectOption,>(): ComboboxContextValue<TOption> => {
  const context = useContext(ComboboxContext);

  if (!context) throw new Error('Combobox components must be used within Combobox');

  return context;
};

const ComboboxClear: FC<ComboboxClearProps> = ({ onClear, disabled, hasValue }) => {
  const context = useComboboxContext();
  const shouldShow = (hasValue ?? context.hasValue) && !(disabled ?? context.disabled) && (onClear || context.handleClear);

  if (!shouldShow) return null;

  const handleClear = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (onClear || context.handleClear)();
  };

  return (
    <TooltipButton
      title="Clear"
      variant="ghost-muted-destructive"
      size="unstyled"
      onClick={handleClear}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClear(e);
        }
      }}
    >
      <XIcon size={16} />
    </TooltipButton>
  );
};

const ComboboxTrigger: FC<ComboboxTriggerProps> = ({ className, children, id, disabled, ...props }) => {
  const context = useComboboxContext();
  const finalId = id ?? context.id;
  const finalDisabled = disabled ?? context.disabled;
  const finalClassName = className ?? context.className;

  // Separate Combobox.Clear from other children
  const childrenArray = Children.toArray(children);
  const clearComponent = childrenArray.find((child) => isValidElement(child) && child.type === ComboboxClear);
  const otherChildren = childrenArray.filter((child) => !(isValidElement(child) && child.type === ComboboxClear));

  return (
    <Popover.Trigger asChild>
      <button
        id={finalId}
        type="button"
        role="combobox"
        disabled={finalDisabled}
        data-slot="input"
        className={cn(
          'file:text-foreground text-primary-900 placeholder:text-muted selection:bg-primary selection:text-primary-foreground cursor-pointer',
          'border-muted-200 h-12 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-1',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          'flex items-center justify-between',
          finalClassName,
        )}
        {...props}
      >
        {otherChildren.length > 0 ? (
          <span className="truncate">{otherChildren}</span>
        ) : (
          <span className="truncate">{context.displayValue}</span>
        )}
        <div className="flex items-center gap-2">
          {clearComponent}
          <ChevronsUpDown size={16} className="hover:bg-destructive/10 opacity-50" />
        </div>
      </button>
    </Popover.Trigger>
  );
};

const ComboboxContent: FC<ComboboxContentProps> = ({ className, children, ...props }) => {
  const context = useComboboxContext();

  return (
    <Popover.Content className={cn('w-(--radix-popover-trigger-width) p-0', className)} align="start" {...props}>
      <Command shouldFilter={!context.isAsyncOptions}>
        <div className="border-b-muted-200 flex items-center border-b px-1" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandPrimitive.Input
            data-slot="command-input"
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={context.placeholder}
            value={context.search}
            onValueChange={context.setSearch}
          />
          <ComboboxLoader
            isLoading={context.isAsyncOptions && (context.search !== context.debouncedSearch || context.infiniteQuery.isFetching)}
          />
        </div>

        <Command.List onScroll={context.handleScroll}>
          {children || (
            <>
              <ComboboxEmpty when={!context.isAsyncOptions && context.mappedOptions.length === 0} />
              <ComboboxEmpty when={context.isAsyncOptions && context.mappedOptions.length === 0 && !context.infiniteQuery.isFetching} />
              <ComboboxEmpty
                when={context.isAsyncOptions && context.infiniteQuery.isError}
                message="Error loading options. Please try again."
                error
              />

              <Command.Group>
                {context.mappedOptions.map((option) => (
                  <Command.Item
                    key={context.getOptionValue(option)}
                    value={context.getOptionLabel(option)}
                    disabled={context.getOptionDisabled?.(option)}
                    onSelect={context.handleItemSelect}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <Conditional.If condition={context.value === context.getOptionValue(option)}>
                        <CheckIcon className="text-muted-400 h-4 w-4" />
                      </Conditional.If>
                    </span>
                    <span className="flex-1">{context.getOptionLabel(option)}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Conditional.If condition={context.isAsyncOptions && context.infiniteQuery.isFetchingNextPage}>
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="text-muted-400 h-4 w-4 animate-spin" />
                  <span className="text-muted-400 ml-2 text-xs">Loading more...</span>
                </div>
              </Conditional.If>
            </>
          )}
        </Command.List>
      </Command>
    </Popover.Content>
  );
};

const ComboboxEmpty: FC<ComboboxEmptyProps> = ({ when, message, error }) => {
  const context = useComboboxContext();
  if (!when) return null;

  const displayMessage = message ?? context.noOptionsText;

  return <Command.Empty>{error ? <div className="text-destructive">{displayMessage}</div> : displayMessage}</Command.Empty>;
};

const ComboboxLoader: FC<ComboboxLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;
  return <Loader2 className="text-muted-400 mr-2 h-4 w-4 shrink-0 animate-spin" />;
};

const Combobox: ComboboxComponents = function <TOption = FormSelectOption>({
  value: controlledValue,
  defaultValue,
  onChange,
  onOptionChange,
  options,
  placeholder = 'Select',
  noOptionsText = 'No options',
  valueType = 'flat',
  getOptionLabel,
  getOptionValue,
  getOptionDisabled,
  optionMapper,
  urlSearchParams,
  debounceMs = 500,
  pageSize = 20,
  disabled,
  className,
  id,
  queryKey = 'combobox',
  children,
  ...props
}: ComboboxProps<TOption>) {
  const isControlled = controlledValue !== undefined;
  const isAsyncOptions = typeof options === 'function';
  const fetchOptions = isAsyncOptions ? options : undefined;

  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  const value = isControlled ? controlledValue : internalValue;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, debounceMs);

  // Extract selected items IDs for API calls
  const selectedItemsIds = useMemo(() => {
    if (!value) return [];

    return [value].filter(Boolean);
  }, [value]);

  // Async options handling
  const infiniteQuery = useAsyncOptionsInfiniteQuery({
    fetchOptions: fetchOptions!,
    queryKey,
    searchTerm: debouncedSearch,
    selectedItemsIds,
    urlSearchParams,
    pageSize,
    enabled: isAsyncOptions && open,
  });

  const { handleScroll } = useInfiniteScroll({
    infiniteQuery,
    enabled: isAsyncOptions,
  });

  const allOptions = useMemo(() => {
    if (isAsyncOptions) return infiniteQuery.data?.pages.flatMap((page) => page.data) ?? [];

    return (options as TOption[]) ?? [];
  }, [isAsyncOptions, infiniteQuery.data, options]);

  const mappedOptions = useMemo(() => {
    return allOptions.map((option) => (optionMapper ? optionMapper(option) : option));
  }, [allOptions, optionMapper]);

  const findOptionByValue = (val: string | null): TOption | undefined => allOptions.find((option) => getOptionValue(option) === val);

  const selectedOption = value ? findOptionByValue(value) : undefined;

  const displayValue = selectedOption
    ? getOptionLabel(selectedOption)
    : value && isAsyncOptions && infiniteQuery.isFetching
      ? value
      : placeholder;

  const onValueChange = (selectedValue: string | null) => {
    if (!selectedValue) {
      handleChange(null);
      if (valueType === 'contain' && onOptionChange) {
        onOptionChange(null);
      }
      setOpen(false);
      return;
    }

    if (value === selectedValue) {
      handleChange(null);
      if (valueType === 'contain' && onOptionChange) {
        onOptionChange(null);
      }
    } else {
      handleChange(selectedValue);
      if (valueType === 'contain' && onOptionChange && selectedValue) {
        const option = findOptionByValue(selectedValue);
        onOptionChange(option || null);
      }
    }

    setOpen(false);
  };

  const handleItemSelect = (selectedLabelOrValue: string) => {
    const optionByLabel = allOptions.find((option) => getOptionLabel(option) === selectedLabelOrValue);
    if (optionByLabel) {
      onValueChange(getOptionValue(optionByLabel));
      return;
    }
    onValueChange(selectedLabelOrValue);
  };

  const handleClear = () => {
    onValueChange(null);
  };

  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternalValue(defaultValue ?? null);
    }
  }, [defaultValue, isControlled]);

  const handleChange = (newValue: string | null) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const contextValue: ComboboxContextValue<TOption> = {
    displayValue,
    open,
    setOpen,
    search,
    setSearch,
    value,
    handleClear,
    handleItemSelect,
    mappedOptions,
    infiniteQuery,
    handleScroll,
    isAsyncOptions,
    placeholder,
    noOptionsText,
    getOptionLabel,
    getOptionValue,
    getOptionDisabled,
    disabled,
    id,
    className,
    findOptionByValue,
    debouncedSearch,
    hasValue: !!value,
  };

  const isCompositionMode = !!children;

  return (
    <ComboboxContext.Provider value={contextValue}>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          {isCompositionMode ? (
            (children as any)
          ) : (
            <>
              <ComboboxTrigger id={id} disabled={disabled} className={className}>
                <ComboboxClear />
              </ComboboxTrigger>
              <ComboboxContent {...props} />
            </>
          )}
        </Popover>
      </div>
    </ComboboxContext.Provider>
  );
};

Combobox.Trigger = ComboboxTrigger;
Combobox.Clear = ComboboxClear;
Combobox.Content = ComboboxContent;
Combobox.Empty = ComboboxEmpty;
Combobox.Loader = ComboboxLoader;

ComboboxContent.displayName = 'ComboboxContent';
ComboboxLoader.displayName = 'ComboboxLoader';
ComboboxEmpty.displayName = 'ComboboxEmpty';
ComboboxTrigger.displayName = 'ComboboxTrigger';
ComboboxClear.displayName = 'ComboboxClear';

export default Combobox;
