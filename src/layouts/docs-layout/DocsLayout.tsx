import { Suspense, useMemo } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';

import { Spinner } from '@components/ui';
import { AppShell, LanguageSwitcher, Logo, Sidebar, ThemeSwitcher, Toaster } from '@components/shared';
import { getComponentDocsRegistry } from '@component-docs/registry';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { docsNavGroups } from '@component-docs/docs-nav';
import DocsSearch from '@pages/docs/components/DocsSearch';

const Dot = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={cn('size-1 rounded-full bg-current', className)} />
);

const TOP_LINK = 'text-fg-muted hover:text-fg aria-[current=page]:text-fg text-sm transition-colors';

function DocsLayout() {
  const { t } = useAppTranslation('docs');
  const { pathname } = useLocation();
  const groups = useMemo(() => docsNavGroups(getComponentDocsRegistry()), []);

  return (
    <AppShell
      storageKey={null}
      sidebar={
        <Sidebar>
          <Sidebar.Content aria-label={t('nav.label')}>
            {groups.map((group) => (
              <Sidebar.Group key={group.key} label={t(group.labelKey)}>
                {group.items.map((item) => (
                  <Sidebar.Item key={item.id} href={item.href} icon={Dot} active={pathname === item.href}>
                    {item.title}
                  </Sidebar.Item>
                ))}
              </Sidebar.Group>
            ))}
          </Sidebar.Content>
        </Sidebar>
      }
    >
      <AppShell.Header className="gap-6">
        <AppShell.MenuButton />

        <Link to="/" className="focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none">
          <Logo variant="lockup" size="sm" />
        </Link>

        <nav aria-label={t('nav.docs')} className="hidden items-center gap-5 md:flex">
          <NavLink end to="/docs" className={TOP_LINK}>
            {t('nav.docs')}
          </NavLink>
          <NavLink to="/docs/components" className={TOP_LINK}>
            {t('nav.components')}
          </NavLink>
          <NavLink to="/docs/foundations" className={TOP_LINK}>
            {t('nav.foundations')}
          </NavLink>
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <DocsSearch />
          <a href="https://github.com/mohammadsafia/rsk" className={cn(TOP_LINK, 'px-2')}>
            {t('nav.github')}
          </a>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </AppShell.Header>

      <AppShell.Content className="p-0">
        <Suspense fallback={<Spinner overlay size="lg" />}>
          <Outlet />
        </Suspense>
      </AppShell.Content>

      <Toaster />
    </AppShell>
  );
}

export default DocsLayout;
