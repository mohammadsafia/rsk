import { Suspense, useMemo } from 'react';
import { Outlet } from 'react-router-dom';

import { Avatar, Spinner } from '@components/ui';
import { Conditional } from '@components/utils';
import { AppShell, CommandPalette, Sidebar, Toaster, useAppShell } from '@components/shared';

import { CommandPaletteProvider } from '@contexts';
import { AppHeader } from '../app-header';
import { useAppTranslation, useAuth } from '@hooks/shared';
import { useRouteUtils } from '@hooks/utils';

import { cn } from '@utils';
import { APP_MENU, type AppMenu } from '@routes';
import { APP_CONFIGURATIONS } from '@app-config';

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
        <div className={cn('flex min-w-0 items-center gap-2.5', collapsed && 'md:hidden')}>
          <span
            aria-hidden="true"
            className="bg-fg text-canvas flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold"
          >
            {APP_CONFIGURATIONS.APP_NAME.charAt(0)}
          </span>

          <span className="text-fg truncate text-sm font-semibold">{APP_CONFIGURATIONS.APP_NAME}</span>
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
                    label={t(route.id)}
                    active={isAnyRouteActive(route.submenu?.map((sub) => sub.path) ?? [])}
                  >
                    {route.submenu?.map((sub) => (
                      <Sidebar.Item key={sub.id} href={sub.path} icon={sub.icon} active={isActiveLink(sub.path)}>
                        {t(sub.id)}
                      </Sidebar.Item>
                    ))}
                  </Sidebar.SubMenu>
                </Conditional.If>

                <Conditional.Else>
                  <Sidebar.Item href={route.path} icon={route.icon} active={isActiveLink(route.path)}>
                    {t(route.id)}
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

function AppLayout() {
  return (
    <CommandPaletteProvider>
      <AppShell sidebar={<AppSidebar />}>
        <AppShell.Header>
          <AppHeader />
        </AppShell.Header>

        <AppShell.Content>
          <Suspense fallback={<Spinner overlay size="lg" />}>
            <Outlet />
          </Suspense>
        </AppShell.Content>
      </AppShell>

      <Toaster />

      <CommandPalette />
    </CommandPaletteProvider>
  );
}

export default AppLayout;
