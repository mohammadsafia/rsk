'use client';

import { type ReactElement, type ReactNode, Suspense, useMemo } from 'react';

import { Avatar, Spinner } from '@components/ui';
import { Conditional } from '@components/utils';
import { AppShell, type AppShellProps, LazyCommandPalette, Logo, Sidebar, Toaster, useAppShell } from '@components/shared';

import { CommandPaletteProvider } from '@contexts';
import { AppHeader } from '../app-header';
import { useAppTranslation, useAuth } from '@hooks/shared';
import { useRouteUtils } from '@hooks/utils';

import { cn } from '@utils';
import { APP_MENU, type AppMenu } from '@routes';

const DEFAULT_GROUP = 'main';

type MenuGroup = { label: string; items: AppMenu[] };

const groupMenu = (menu: AppMenu[]): MenuGroup[] => {
  const groups = new Map<string, AppMenu[]>();

  for (const item of menu) {
    const label = item.group ?? DEFAULT_GROUP;
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }

  return [...groups].map(([label, items]) => ({ label, items }));
};

function AppSidebar() {
  const { t } = useAppTranslation('nav');
  const { currentUser } = useAuth();
  const { collapsed } = useAppShell();
  const { isActiveLink, isAnyRouteActive } = useRouteUtils();

  const groups = useMemo(() => groupMenu(APP_MENU), []);

  return (
    <Sidebar>
      <Sidebar.Header>
        <div className={cn('flex min-w-0 items-center', collapsed && 'md:hidden')}>
          <Logo variant="lockup" size="md" />
        </div>

        <Sidebar.CollapseButton />
      </Sidebar.Header>

      <Sidebar.Content>
        {groups.map((group) => (
          <Sidebar.Group key={group.label} label={t(`groups.${group.label}`)}>
            {group.items.map((route) => (
              <Conditional key={route.id}>
                <Conditional.If condition={!!route.submenu?.length}>
                  <Sidebar.SubMenu
                    icon={route.icon}
                    label={t(route.labelKey ?? route.id)}
                    active={isAnyRouteActive(route.submenu?.map((sub) => sub.path) ?? [])}
                  >
                    {route.submenu?.map((sub) => (
                      <Sidebar.Item key={sub.id} href={sub.path} icon={sub.icon} active={isActiveLink(sub.path)}>
                        {t(sub.labelKey ?? sub.id)}
                      </Sidebar.Item>
                    ))}
                  </Sidebar.SubMenu>
                </Conditional.If>

                <Conditional.Else>
                  <Sidebar.Item href={route.path} icon={route.icon} active={isActiveLink(route.path)}>
                    {t(route.labelKey ?? route.id)}
                  </Sidebar.Item>
                </Conditional.Else>
              </Conditional>
            ))}
          </Sidebar.Group>
        ))}
      </Sidebar.Content>

      <Sidebar.Footer>
        <div className={cn('flex items-center gap-3', collapsed && 'md:justify-center')}>
          <Avatar size="md" className="shrink-0">
            <Conditional.If condition={!!currentUser?.picture}>
              <Avatar.Image src={currentUser?.picture} alt="" />
            </Conditional.If>

            <Avatar.Fallback className="text-xs">{currentUser?.name?.charAt(0)?.toUpperCase()}</Avatar.Fallback>
          </Avatar>

          <div className={cn('min-w-0 flex-1', collapsed && 'md:sr-only')}>
            <p className="text-fg truncate text-sm font-medium">{currentUser?.name}</p>

            <p className="text-fg-muted truncate text-xs">{currentUser?.email}</p>
          </div>
        </div>
      </Sidebar.Footer>
    </Sidebar>
  );
}

type AppLayoutShellProps = {
  children: ReactNode;
  /** How the shell keeps its collapsed state: storage by default; a Next app passes the server's cookie value. */
  shell?: Pick<AppShellProps, 'storageKey' | 'initialCollapsed' | 'onCollapsedChange'>;
};

/** The signed-in app around a page: sidebar, header, command palette and toaster. Each starter's router puts the page in. */
export function AppLayoutShell({ children, shell }: AppLayoutShellProps): ReactElement {
  return (
    <CommandPaletteProvider>
      <AppShell sidebar={<AppSidebar />} {...shell}>
        <AppShell.Header>
          <AppHeader />
        </AppShell.Header>

        <AppShell.Content>
          <Suspense fallback={<Spinner overlay size="lg" />}>{children}</Suspense>
        </AppShell.Content>
      </AppShell>

      <Toaster />

      <LazyCommandPalette />
    </CommandPaletteProvider>
  );
}
