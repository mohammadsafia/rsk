'use client';

import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  useEffect,
  useEffectEvent,
  useId,
  useState,
} from 'react';

import { floatingSurfaceClassName, Input, Spinner } from '@components/ui';

import { Conditional } from '@components/utils';

import { useBlockTranslation, useDebounce } from '@hooks/shared';

import { cn } from '@utils';

import { SearchIcon } from 'lucide-react';

import { LOCALE } from './locale';

export type SearchFieldProps<T> = {
  /** The visible label, also the input's accessible name. */
  label: string;
  placeholder?: string;
  /** Finds the suggestions for a query (at least `minLength` characters, after `debounceMs`). */
  onSearch: (query: string) => Promise<T[]> | T[];
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  onSelect: (item: T) => void;
  /** @default 2 */
  minLength?: number;
  /** @default 250 */
  debounceMs?: number;
  className?: string;
};

type SearchState<T> = { query: string; status: 'done' | 'failed'; results: T[] };

/**
 * A search input with suggestions (the ARIA 1.2 combobox with a list): typing searches after a pause, the arrow keys
 * move through the suggestions, Enter picks one and Escape closes them. Every state is announced through one live
 * region, so screen readers hear "Searching…", the number of results or that nothing matched.
 */
function SearchField<T>({
  label,
  placeholder,
  onSearch,
  getLabel,
  getKey,
  onSelect,
  minLength = 2,
  debounceMs = 250,
  className,
}: SearchFieldProps<T>): ReactElement {
  const id = useId();

  const { t } = useBlockTranslation('block-search-field', LOCALE);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // The label of the suggestion just picked: the input shows it, and it isn't searched again.
  const [picked, setPicked] = useState<string | null>(null);
  const [search, setSearch] = useState<SearchState<T> | null>(null);

  const debouncedQuery = useDebounce(query.trim(), debounceMs);

  const searchable = debouncedQuery.length >= minLength && debouncedQuery !== picked;
  // A search for an older query is still the previous answer: until the current one arrives, it is loading.
  const current = search?.query === debouncedQuery ? search : null;
  const results = current?.status === 'done' ? current.results : [];
  const expanded = open && searchable;
  const listShown = expanded && results.length > 0;
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const announce = (): string => {
    if (!searchable) return '';
    if (!current) return t('searching');
    if (current.status === 'failed') return t('failed');
    return results.length ? t('results', { count: results.length }) : t('empty', { query: debouncedQuery });
  };
  const announcement = announce();

  const runSearch = useEffectEvent((text: string) => onSearch(text));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setPicked(null);
    setActiveIndex(-1);
    setOpen(true);
  };

  const handleSelect = (item: T) => {
    const text = getLabel(item);
    setQuery(text);
    setPicked(text);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(item);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!results.length) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index < 0 && step < 0 ? results.length - 1 : (index + step + results.length) % results.length));
    } else if (event.key === 'Enter' && listShown && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (event.key === 'Escape') {
      // Closes the suggestions; a second Escape clears the field.
      if (expanded) setOpen(false);
      else setQuery('');
      setActiveIndex(-1);
    }
  };

  const handleBlur = () => setOpen(false);

  // A click on a suggestion must not take the focus from the input (that would close the list first).
  const handleListMouseDown = (event: MouseEvent<HTMLUListElement>) => event.preventDefault();

  useEffect(() => {
    if (!searchable) return;
    let latest = true;
    Promise.resolve()
      .then(() => runSearch(debouncedQuery))
      .then(
        (found) => {
          if (latest) setSearch({ query: debouncedQuery, status: 'done', results: found });
        },
        () => {
          // Shown to the user as "The search didn't work", never as "no results".
          if (latest) setSearch({ query: debouncedQuery, status: 'failed', results: [] });
        },
      );
    return () => {
      latest = false;
    };
  }, [debouncedQuery, searchable]);

  // The Escape that closes the suggestions stays here: a dialog around the field (Radix listens on the document, in the
  // capture phase) must not close with it. Only while the suggestions show; the next Escape goes through.
  useEffect(() => {
    if (!expanded) return;
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || (event.target as HTMLElement | null)?.id !== `${id}-input`) return;
      event.stopPropagation();
      setOpen(false);
      setActiveIndex(-1);
    };
    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [expanded, id]);
  return (
    <div data-slot="search-field" className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={`${id}-input`} className="text-fg text-sm font-medium">
        {label}
      </label>

      <div className="relative">
        <SearchIcon aria-hidden="true" className="text-fg-muted pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />

        <Input
          id={`${id}-input`}
          type="search"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={listShown}
          aria-controls={listId}
          aria-activedescendant={listShown && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          placeholder={placeholder}
          value={query}
          className="ps-9"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />

        <div
          data-slot="search-field-panel"
          hidden={!expanded}
          className={cn(floatingSurfaceClassName, 'border-border absolute inset-x-0 top-full mt-1 border p-1')}
        >
          <Conditional>
            <Conditional.If condition={listShown}>
              <ul id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto" onMouseDown={handleListMouseDown}>
                {results.map((item, index) => (
                  <li
                    key={getKey(item)}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    // Highlighted (keyboard), like a hover: the kit marks a chosen item with ink, never a fill.
                    data-highlighted={index === activeIndex || undefined}
                    className="min-h-control-sm data-highlighted:bg-hover hover:bg-hover flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm"
                    onClick={() => handleSelect(item)}
                  >
                    {getLabel(item)}
                  </li>
                ))}
              </ul>
            </Conditional.If>

            <Conditional.Else>
              {/* The live region below says the same thing to screen readers. */}
              <div aria-hidden="true" className="text-fg-muted flex items-center gap-2 px-2 py-1.5 text-sm">
                <Conditional.If condition={!current}>
                  <Spinner size="sm" />
                </Conditional.If>
                {announcement}
              </div>

              {/* aria-controls must name an element that exists, even while there is nothing to list. */}
              <ul id={listId} role="listbox" aria-label={label} hidden />
            </Conditional.Else>
          </Conditional>
        </div>
      </div>

      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}

export default SearchField;
