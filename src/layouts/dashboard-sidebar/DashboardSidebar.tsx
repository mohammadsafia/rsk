import { useMemo, useState } from 'react';

import { Avatar, ScrollArea } from '@components/ui';
import { Conditional } from '@components/utils';

import { DashboardSidebarLink, SidebarSubLink, DashboardSidebarDrawer } from '@layouts';

import { useAppTranslation, useAuth } from '@hooks/shared';

import { cn } from '@utils';
import { APP_MENU, type AppMenu } from '@routes';
import { APP_CONFIGURATIONS } from '@app-config';

import { ChevronsLeft, ChevronsRight } from 'lucide-react';

const DEFAULT_GROUP = 'main';

type MenuGroup = { label: string; items: AppMenu[] };

function groupMenu(menu: AppMenu[]): MenuGroup[] {
  const order: string[] = [];
  const map = new Map<string, AppMenu[]>();

  for (const item of menu) {
    const label = item.group ?? DEFAULT_GROUP;

    if (!map.has(label)) {
      map.set(label, []);
      order.push(label);
    }

    map.get(label)!.push(item);
  }

  return order.map((label) => ({ label, items: map.get(label)! }));
}

function DashboardSidebar() {
  const [collapse, setCollapse] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { currentUser } = useAuth();
  const { t } = useAppTranslation('nav');

  const groups = useMemo(() => groupMenu(APP_MENU), []);

  const handleToggleCollapse = () => setCollapse((prevState) => !prevState);

  const handleToggleMenu = () => {
    setShowMenu((prevState) => !prevState);
    setCollapse(false);
  };

  const renderItem = (route: AppMenu) => {
    if (route.submenu && collapse) {
      return <DashboardSidebarLink key={route.id} route={route} collapse={collapse} onExpandSidebar={() => setCollapse(false)} />;
    }

    if (route.submenu) {
      return <SidebarSubLink key={route.id} route={route} collapse={collapse} />;
    }

    return <DashboardSidebarLink key={route.id} route={route} collapse={collapse} />;
  };

  return (
    <aside
      className={cn(
        'bg-sidebar border-border z-50 w-full shrink-0 rounded-2xl border shadow-spread transition-[width] duration-300 ease-in-out md:relative md:h-full',
        collapse ? 'md:w-17' : 'md:w-65',
      )}
    >
      <div className={cn('flex h-full flex-col', showMenu && 'h-svh')}>
        {/* Brand + desktop collapse toggle */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4 md:h-16">
          {/* Expanded: brand mark + wordmark */}
          <div className={cn('flex items-center gap-2.5 overflow-hidden', collapse && 'md:hidden')}>
            <span className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
              {APP_CONFIGURATIONS.APP_NAME.charAt(0)}
            </span>

            <span className="text-foreground truncate text-sm font-bold">{APP_CONFIGURATIONS.APP_NAME}</span>
          </div>

          {/* Collapsed (desktop): brand mark doubles as the expand button */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className={cn('group relative mx-auto hidden h-8 w-8 shrink-0 items-center justify-center', collapse ? 'md:flex' : 'md:hidden')}
          >
            <span className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-opacity group-hover:opacity-0">
              {APP_CONFIGURATIONS.APP_NAME.charAt(0)}
            </span>

            <ChevronsRight className="text-foreground absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 rtl:scale-x-[-1]" />
          </button>

          {/* Expanded (desktop): collapse toggle */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className={cn(
              'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hidden h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
              collapse ? 'md:hidden' : 'md:inline-flex',
            )}
          >
            <ChevronsLeft className="h-4 w-4 rtl:scale-x-[-1]" />
          </button>

          {/* Mobile menu toggle */}
          <DashboardSidebarDrawer variant="mobile" collapse={showMenu} onCollapse={handleToggleMenu} />
        </header>

        {/* Navigation */}
        <ScrollArea
          className={cn(
            'min-h-0 flex-1',
            showMenu ? 'max-h-screen' : 'max-h-0 overflow-hidden md:max-h-none',
            showMenu && 'animate-in slide-in-from-top transition duration-300 ease-out',
          )}
        >
          <nav className="px-3 py-2 md:py-3">
            {groups.map((group) => (
              <div key={group.label} className="mb-2 space-y-0.5">
                <p
                  className={cn(
                    'text-muted-foreground px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase',
                    collapse && 'md:sr-only',
                  )}
                >
                  {t(`groups.${group.label}`)}
                </p>

                {group.items.map(renderItem)}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User profile */}
        <div className="border-border shrink-0 border-t p-3">
          <div className={cn('flex items-center gap-3 rounded-lg px-2 py-1.5', collapse && 'md:justify-center md:px-0')}>
            <Avatar className="h-8 w-8 shrink-0">
              <Conditional.If condition={!!currentUser?.picture}>
                <Avatar.Image src={currentUser?.picture} alt="User avatar" />
              </Conditional.If>

              <Avatar.Fallback className="bg-primary/10 text-primary text-xs font-medium">
                {currentUser?.name?.charAt(0)?.toUpperCase()}
              </Avatar.Fallback>
            </Avatar>

            <div className={cn('min-w-0 flex-1', collapse && 'md:hidden')}>
              <p className="text-foreground truncate text-sm font-medium">{currentUser?.name}</p>

              <p className="text-muted-foreground truncate text-xs">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
