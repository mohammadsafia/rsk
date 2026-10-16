import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Command } from '@components/ui';
import { getComponentDocsRegistry } from '@component-docs/registry';

import { useAppTranslation } from '@hooks/shared';

import { Search } from 'lucide-react';

import { buildSearchIndex, foldSearchText, type SearchItem } from './docs-search-index';

const GROUPS: SearchItem['group'][] = ['guides', 'components', 'sections'];

/** Diacritic- and case-insensitive "contains" ranking; page titles outrank section matches through group order. */
const filter = (value: string, search: string) => (value.includes(foldSearchText(search.trim())) ? 1 : 0);

export default function DocsSearch() {
  const { t } = useAppTranslation('docs');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const index = useMemo(() => buildSearchIndex(getComponentDocsRegistry()), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-fg-muted bg-surface border-border hover:bg-hover hover:text-fg focus-visible:ring-ring h-control-sm hidden w-56 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:flex"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        <span className="flex-1 text-start">{t('search.trigger')}</span>
        <kbd aria-hidden="true" className="bg-surface-sunken border-border text-2xs rounded-sm border px-1.5 font-mono">
          ⌘K
        </kbd>
      </button>

      <Command.Dialog title={t('search.trigger')} open={open} onOpenChange={setOpen} filter={filter}>
        <Command.Input placeholder={t('search.placeholder')} />

        <Command.List>
          <Command.Empty>{t('search.empty')}</Command.Empty>

          {GROUPS.map((group) => (
            <Command.Group key={group} heading={t(`search.${group}`)}>
              {index
                .filter((item) => item.group === group)
                .map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.keywords} ${item.id}`}
                    onSelect={() => {
                      setOpen(false);
                      navigate(item.href);
                    }}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-fg truncate">{item.title}</span>
                      <span className="text-fg-muted truncate text-xs">{item.subtitle}</span>
                    </span>
                  </Command.Item>
                ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
