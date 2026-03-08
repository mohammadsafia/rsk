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
  useMemo,
  useState,
} from 'react';
import { Command as CommandPrimitive } from 'cmdk';

import { Badge, Command, type CommandProps, Popover } from '@components/ui';
import { Conditional } from '@components/utils';
import { TooltipButton } from '@components/shared';

import { type AsyncOptionsFn, useAsyncOptionsInfiniteQuery, useDebounce, useInfiniteScroll } from '@hooks/shared';

import { cn } from '@utils';

import { CheckIcon, ChevronsUpDown, Loader2, Search, XIcon } from 'lucide-react';

import type { FormSelectOption } from '@app-types';

export type MultiComboboxProps<TOption = FormSelectOption> = Omit<CommandProps, 'value' | 'onChange'> & {
  /**
   * Controlled value. Can be an array of string IDs (when valueType='flat') or an array of option objects (when valueType='contain').
   * If provided, the component is controlled.
   */
  value?: string[] | TOption[];
  /**
   * Default value for uncontrolled mode. Can be an array of string IDs (when valueType='flat') or an array of option objects (when valueType='contain').
   */
  defaultValue?: string[] | TOption[];
  /**
   * Callback fired when the value changes. Receives the new value array.
   * For 'flat' type, receives string[]. For 'contain' type, receives TOption[].
   */
  onChange?: (value: string[] | TOption[]) => void;
  /**
   * Callback fired when the value changes in 'contain' mode. Receives the full array of selected option objects.
   * Only used when valueType='contain'.
   */
  onOptionChange?: (options: TOption[]) => void;
  /**
   * Options to display. Can be a static array of options or an async function that fetches options.
   * For async options, the function should return a Promise<PaginatedDataTable<TOption>>.
   */
  options: TOption[] | AsyncOptionsFn<TOption>;
  /**
   * Placeholder text displayed when no options are selected.
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
   * - 'flat': Values are stored as string IDs, onChange receives string[]
   * - 'contain': Values are stored as full option objects, onChange receives TOption[]
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
   * @default 'multi-combobox'
   */
  queryKey?: string;
  /**
   * Children for composition mode. If provided, renders in composition mode.
   */
  children?: ReactNode;
};

type MultiComboboxContextValue<TOption = FormSelectOption> = {
  selectedValues: Set<string>;
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
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
  findOptionByValue: (val: string) => TOption | undefined;
  disabled?: boolean;
  id?: string;
  className?: string;
  debouncedSearch: string;
  hasValue: boolean;
};

type MultiComboboxComponents = (<TOption = FormSelectOption>(props: MultiComboboxProps<TOption>) => ReactElement) & {
  Trigger: typeof MultiComboboxTrigger;
  Clear: typeof MultiComboboxClear;
  Content: typeof MultiComboboxContent;
  Empty: typeof MultiComboboxEmpty;
  Loader: typeof MultiComboboxLoader;
  displayName?: string;
};

type MultiComboboxClearProps = {
  onClear?: () => void;
  disabled?: boolean;
  hasValue?: boolean;
};

type MultiComboboxTriggerProps = ComponentPropsWithoutRef<'button'> & {
  children?: ReactNode;
};

type MultiComboboxContentProps = ComponentPropsWithoutRef<typeof Popover.Content> & {
  children?: ReactNode;
};

type MultiComboboxEmptyProps = {
  when: boolean;
  message?: string;
  error?: boolean;
};

type MultiComboboxLoaderProps = {
  isLoading: boolean;
};

const MultiComboboxContext = createContext<MultiComboboxContextValue<any> | null>(null);

export const useMultiComboboxContext = <TOption = FormSelectOption,>(): MultiComboboxContextValue<TOption> => {
  const context = useContext(MultiComboboxContext);

  if (!context) throw new Error('MultiCombobox components must be used within MultiCombobox');

  return context;
};

const MultiComboboxClear: FC<MultiComboboxClearProps> = ({ onClear, disabled, hasValue }) => {
  const context = useMultiComboboxContext();

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

const MultiComboboxTrigger: FC<MultiComboboxTriggerProps> = ({ className, children, id, disabled, ...props }) => {
  const context = useMultiComboboxContext();
  const finalId = id ?? context.id;
  const finalDisabled = disabled ?? context.disabled;
  const finalClassName = className ?? context.className;

  // Separate MultiCombobox.Clear from other children
  const childrenArray = Children.toArray(children);
  const clearComponent = childrenArray.find((child) => isValidElement(child) && child.type === MultiComboboxClear);
  const otherChildren = childrenArray.filter((child) => !(isValidElement(child) && child.type === MultiComboboxClear));

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
        <div className="line-clamp-1 truncate">
          {otherChildren.length > 0 ? (
            otherChildren
          ) : (
            <Conditional>
              <Conditional.If condition={context.selectedValues.size > 0}>
                {Array.from(context.selectedValues).map((selectedVal) => {
                  const option = context.findOptionByValue(selectedVal);
                  return (
                    <Badge key={selectedVal} className="me-1">
                      {option ? context.getOptionLabel(option) : selectedVal}
                    </Badge>
                  );
                })}
              </Conditional.If>
              <Conditional.Else>{context.placeholder}</Conditional.Else>
            </Conditional>
          )}
        </div>

        <div className="flex items-center gap-2">
          {clearComponent}
          <ChevronsUpDown size={16} className="opacity-50" />
        </div>
      </button>
    </Popover.Trigger>
  );
};

const MultiComboboxContent: FC<MultiComboboxContentProps> = ({ className, children, ...props }) => {
  const context = useMultiComboboxContext();

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
          <MultiComboboxLoader
            isLoading={context.isAsyncOptions && (context.search !== context.debouncedSearch || context.infiniteQuery.isFetching)}
          />
        </div>

        <Command.List onScroll={context.handleScroll}>
          {children || (
            <>
              <MultiComboboxEmpty when={!context.isAsyncOptions && context.mappedOptions.length === 0} />
              <MultiComboboxEmpty
                when={context.isAsyncOptions && context.mappedOptions.length === 0 && !context.infiniteQuery.isFetching}
              />
              <MultiComboboxEmpty
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
                      <Conditional.If condition={context.selectedValues.has(context.getOptionValue(option))}>
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

const MultiComboboxEmpty: FC<MultiComboboxEmptyProps> = ({ when, message, error }) => {
  const context = useMultiComboboxContext();
  if (!when) return null;

  const displayMessage = message ?? context.noOptionsText;

  return <Command.Empty>{error ? <div className="text-destructive">{displayMessage}</div> : displayMessage}</Command.Empty>;
};

const MultiComboboxLoader: FC<MultiComboboxLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return <Loader2 className="text-muted-400 mr-2 h-4 w-4 shrink-0 animate-spin" />;
};

const MultiCombobox: MultiComboboxComponents = function <TOption = FormSelectOption>({
  id,
  className,
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
  queryKey = 'multi-combobox',
  children,
  ...props
}: MultiComboboxProps<TOption>) {
  const isControlled = controlledValue !== undefined;

  const convertToStringArray = (val: string[] | TOption[] | undefined): string[] => {
    if (!val || !Array.isArray(val) || val.length === 0) return [];

    if (valueType === 'contain') return (val as TOption[]).map((option: TOption) => getOptionValue(option));

    return val as string[];
  };

  const [internalValue, setInternalValue] = useState<string[]>(convertToStringArray(defaultValue));
  const stringValue = isControlled ? convertToStringArray(controlledValue) : internalValue;

  const handleChange = (newValue: string[]) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    // For 'flat' type, pass string array directly
    if (valueType === 'flat') {
      onChange?.(newValue);
    }
  };

  const isAsyncOptions = typeof options === 'function';
  const fetchOptions = isAsyncOptions ? options : undefined;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, debounceMs);

  // Extract selected items IDs for API calls
  const selectedItemsIds = useMemo(() => {
    if (!stringValue || stringValue.length === 0) return [];
    return stringValue.filter(Boolean);
  }, [stringValue]);

  // Fetch when dropdown is open OR when there are selected values that need label resolution
  const needsLabelResolution = selectedItemsIds.length > 0;

  const infiniteQuery = useAsyncOptionsInfiniteQuery({
    fetchOptions: fetchOptions!,
    queryKey,
    searchTerm: debouncedSearch,
    selectedItemsIds,
    urlSearchParams,
    pageSize,
    enabled: isAsyncOptions && (open || needsLabelResolution),
  });

  const { handleScroll } = useInfiniteScroll({
    infiniteQuery,
    enabled: isAsyncOptions,
  });

  const allOptions = useMemo(() => {
    if (isAsyncOptions) {
      return infiniteQuery.data?.pages.flatMap((page) => page.data) ?? [];
    }
    return (!isAsyncOptions ? (options as TOption[]) : []) ?? [];
  }, [isAsyncOptions, infiniteQuery.data, options]);

  const mappedOptions = useMemo(() => {
    return allOptions.map((option) => (optionMapper ? optionMapper(option) : option));
  }, [allOptions, optionMapper]);

  const findOptionByValue = (val: string): TOption | undefined => {
    return allOptions.find((option) => getOptionValue(option) === val);
  };

  const selectedValues = useMemo(() => new Set<string>(stringValue), [stringValue]);

  const onValueChange = (selectedValue: string) => {
    const currentSelectedValues = new Set<string>(stringValue);
    const newSelectedValues = new Set(currentSelectedValues);

    if (newSelectedValues.has(selectedValue)) {
      newSelectedValues.delete(selectedValue);
    } else {
      newSelectedValues.add(selectedValue);
    }

    const stringArray = Array.from(newSelectedValues);

    if (valueType === 'contain' && onOptionChange) {
      const optionsArray = stringArray.map(findOptionByValue).filter(Boolean) as TOption[];
      onOptionChange(optionsArray);
    } else {
      handleChange(stringArray);
    }
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
    if (valueType === 'contain' && onOptionChange) {
      onOptionChange([]);
    } else {
      handleChange([]);
    }
  };

  const isCompositionMode = !!children;

  const contextValue: MultiComboboxContextValue<TOption> = {
    selectedValues,
    open,
    setOpen,
    search,
    setSearch,
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
    findOptionByValue,
    disabled,
    id,
    className,
    debouncedSearch,
    hasValue: selectedValues.size > 0,
  };

  return (
    <MultiComboboxContext.Provider value={contextValue}>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <Conditional.If condition={isCompositionMode}>{children}</Conditional.If>

          <Conditional.If condition={!isCompositionMode}>
            <MultiComboboxTrigger id={id} disabled={disabled} className={className}>
              <MultiComboboxClear />
            </MultiComboboxTrigger>

            <MultiComboboxContent {...props} />
          </Conditional.If>
        </Popover>
      </div>
    </MultiComboboxContext.Provider>
  );
};

MultiCombobox.Trigger = MultiComboboxTrigger;
MultiCombobox.Clear = MultiComboboxClear;
MultiCombobox.Content = MultiComboboxContent;
MultiCombobox.Empty = MultiComboboxEmpty;
MultiCombobox.Loader = MultiComboboxLoader;

MultiComboboxClear.displayName = 'MultiComboboxClear';
MultiComboboxTrigger.displayName = 'MultiComboboxTrigger';
MultiComboboxContent.displayName = 'MultiComboboxContent';
MultiComboboxEmpty.displayName = 'MultiComboboxEmpty';
MultiComboboxLoader.displayName = 'MultiComboboxLoader';

export default MultiCombobox;
