/**
 * Searchable checkbox prompt — Type-to-filter multi-select with persistent selections.
 *
 * Combines a text input for real-time substring filtering with a checkbox list.
 * Selections persist across filter changes so users can search "Case", select some,
 * then search "Report", select more — all accumulating.
 */

import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useMemo,
  useRef,
  makeTheme,
  isUpKey,
  isDownKey,
  isSpaceKey,
  isEnterKey,
} from '@inquirer/core';
import type { Theme, Status } from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import { cursorHide } from '@inquirer/ansi';
import chalk from 'chalk';
import figures from '@inquirer/figures';

// ── Types ──────────────────────────────────────────────────────────

type SearchableCheckboxTheme = {
  icon: {
    checked: string;
    unchecked: string;
    cursor: string;
  };
  style: {
    searchTerm: (text: string) => string;
    resultCount: (text: string) => string;
    selectedCount: (text: string) => string;
    renderSelectedChoices: <T>(
      selectedChoices: ReadonlyArray<NormalizedChoice<T>>
    ) => string;
    keysHelpTip: (
      keys: [key: string, action: string][]
    ) => string | undefined;
  };
};

type Choice<Value> = {
  value: Value;
  name?: string;
  short?: string;
  checked?: boolean;
  type?: never;
};

type NormalizedChoice<Value> = {
  value: Value;
  name: string;
  short: string;
  checked: boolean;
};

type SearchableCheckboxConfig<Value> = {
  message: string;
  choices: ReadonlyArray<Choice<Value> | string>;
  pageSize?: number;
  required?: boolean;
  theme?: PartialDeep<Theme<SearchableCheckboxTheme>>;
};

// ── Theme defaults ─────────────────────────────────────────────────

const defaultTheme: SearchableCheckboxTheme = {
  icon: {
    checked: chalk.green(figures.circleFilled),
    unchecked: figures.circle,
    cursor: figures.pointer,
  },
  style: {
    searchTerm: (text: string) => chalk.cyan(text),
    resultCount: (text: string) => chalk.dim(text),
    selectedCount: (text: string) => chalk.yellow(text),
    renderSelectedChoices: (selectedChoices) =>
      selectedChoices.map((choice) => choice.short).join(', '),
    keysHelpTip: (keys) =>
      keys
        .map(
          ([key, action]) =>
            `${chalk.bold(key)} ${chalk.dim(action)}`
        )
        .join(chalk.dim(' • ')),
  },
};

// ── Helpers ────────────────────────────────────────────────────────

function normalizeChoices<Value>(
  choices: ReadonlyArray<Choice<Value> | string>
): NormalizedChoice<Value>[] {
  return choices.map((choice) => {
    if (typeof choice === 'string') {
      return {
        value: choice as Value,
        name: choice,
        short: choice,
        checked: false,
      };
    }

    const name = choice.name ?? String(choice.value);
    return {
      value: choice.value,
      name,
      short: choice.short ?? name,
      checked: choice.checked ?? false,
    };
  });
}

type FilteredEntry<Value> = {
  item: NormalizedChoice<Value>;
  originalIndex: number;
};

// ── Prompt ─────────────────────────────────────────────────────────

const searchableCheckbox = createPrompt<
  string[],
  SearchableCheckboxConfig<string>
>((config, done) => {
  const { pageSize = 15, required } = config;
  const theme = makeTheme<SearchableCheckboxTheme>(defaultTheme, config.theme);

  const [status, setStatus] = useState<Status>('idle');
  const prefix = usePrefix({ status, theme });
  const [items, setItems] = useState(normalizeChoices(config.choices));
  const [searchTerm, setSearchTerm] = useState('');
  const [active, setActive] = useState(0);
  const [errorMsg, setError] = useState<string | undefined>();
  const prevFilteredLenRef = useRef<number>(-1);

  // Filter items by search term (case-insensitive substring)
  const filtered: FilteredEntry<string>[] = useMemo(() => {
    if (!searchTerm) {
      return items.map((item, i) => ({ item, originalIndex: i }));
    }

    const term = searchTerm.toLowerCase();
    return items
      .map((item, i) => ({ item, originalIndex: i }))
      .filter(({ item }) => item.name.toLowerCase().includes(term));
  }, [items, searchTerm]);

  // Reset active cursor when filtered list changes
  if (filtered.length !== prevFilteredLenRef.current) {
    prevFilteredLenRef.current = filtered.length;
    if (active >= filtered.length) {
      setActive(Math.max(0, filtered.length - 1));
    }
  }

  const selectedCount = useMemo(
    () => items.filter((item) => item.checked).length,
    [items]
  );

  useKeypress((key, rl) => {
    if (isEnterKey(key)) {
      const selection = items.filter((item) => item.checked);

      if (required && selection.length === 0) {
        setError('At least one choice must be selected');
        return;
      }

      setStatus('done');
      done(selection.map((choice) => choice.value));
      return;
    }

    if (isUpKey(key) || isDownKey(key)) {
      if (errorMsg) setError(undefined);
      rl.clearLine(0);
      rl.write(searchTerm);

      if (filtered.length === 0) return;

      const offset = isUpKey(key) ? -1 : 1;
      const next = (active + offset + filtered.length) % filtered.length;
      setActive(next);
      return;
    }

    if (isSpaceKey(key)) {
      rl.clearLine(0);
      rl.write(searchTerm);

      if (filtered.length === 0) return;

      const entry = filtered[active];
      if (!entry) return;

      setError(undefined);
      setItems(
        items.map((item, i) =>
          i === entry.originalIndex
            ? { ...item, checked: !item.checked }
            : item
        )
      );
      return;
    }

    // Ctrl+A toggles all (visible/filtered)
    if (key.name === 'a' && key.ctrl) {
      rl.clearLine(0);
      rl.write(searchTerm);

      if (searchTerm) {
        // Toggle only filtered items
        const filteredIndices = new Set(
          filtered.map((f) => f.originalIndex)
        );
        const selectFiltered = filtered.some(({ item }) => !item.checked);
        setItems(
          items.map((item, i) =>
            filteredIndices.has(i)
              ? { ...item, checked: selectFiltered }
              : item
          )
        );
      } else {
        // Toggle all items
        const selectAll = items.some((item) => !item.checked);
        setItems(items.map((item) => ({ ...item, checked: selectAll })));
      }
      return;
    }

    // Everything else is text input — update search from readline
    const currentLine = rl.line;
    if (currentLine !== searchTerm) {
      setSearchTerm(currentLine);
      setActive(0);
    }
  });

  // ── Render ───────────────────────────────────────────────────────

  const message = theme.style.message(config.message, status);

  if (status === 'done') {
    const selection = items.filter((item) => item.checked);
    const answer = theme.style.answer(
      theme.style.renderSelectedChoices(selection)
    );
    return [prefix, message, answer].filter(Boolean).join(' ');
  }

  const searchDisplay = theme.style.searchTerm(searchTerm || '');
  const header = [prefix, message, searchDisplay].filter(Boolean).join(' ');

  const page = usePagination({
    items: filtered,
    active,
    renderItem({ item: entry, isActive }: { item: FilteredEntry<string>; isActive: boolean }) {
      const { item } = entry;
      const cursor = isActive ? theme.icon.cursor : ' ';
      const checkbox = item.checked
        ? theme.icon.checked
        : theme.icon.unchecked;
      const color = isActive ? theme.style.highlight : (x: string) => x;
      return color(`${cursor}${checkbox} ${item.name}`);
    },
    pageSize,
    loop: true,
  });

  const selectedLine =
    selectedCount > 0
      ? theme.style.selectedCount(`  ${selectedCount} selected`)
      : '';

  const countLine = theme.style.resultCount(
    `  ${filtered.length} of ${items.length} schemas`
  );

  const noResults =
    filtered.length === 0 && searchTerm
      ? chalk.dim('  No schemas match your search')
      : '';

  const keys: [string, string][] = [
    ['↑↓', 'navigate'],
    ['space', 'select'],
    ['ctrl+a', searchTerm ? 'toggle filtered' : 'toggle all'],
    ['⏎', 'submit'],
  ];
  const helpLine = theme.style.keysHelpTip(keys);

  const body = [
    selectedLine,
    countLine,
    '',
    noResults || page,
    '',
    errorMsg ? theme.style.error(errorMsg) : '',
    helpLine,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .trimEnd();

  return [`${header}${cursorHide}`, body];
});

export default searchableCheckbox;
