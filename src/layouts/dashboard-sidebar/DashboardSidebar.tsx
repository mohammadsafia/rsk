import { useMemo, useState } from 'react';

import { Avatar, ScrollArea } from '@components/ui';
import { Conditional } from '@components/utils';

import { DashboardSidebarLink, SidebarSubLink, DashboardSidebarDrawer } from '@layouts';

import { useAuth } from '@hooks/shared';

import { cn } from '@utils';
import { APP_MENU, type AppMenu } from '@routes';
import { APP_CONFIGURATIONS } from '@app-config';

const DEFAULT_GROUP = 'Main';

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
        {/* Brand */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 md:h-16">
          <div className={cn('flex items-center gap-2.5 overflow-hidden transition-all duration-300', collapse && 'md:w-full md:justify-center')}>
            <span className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
              {APP_CONFIGURATIONS.APP_NAME.charAt(0)}
            </span>

            <span className={cn('text-foreground truncate text-sm font-bold transition-all duration-300', collapse && 'md:hidden')}>
              {APP_CONFIGURATIONS.APP_NAME}
            </span>
          </div>

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
                  {group.label}
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

        {/* Collapse toggle */}
        <DashboardSidebarDrawer collapse={!collapse} onCollapse={handleToggleCollapse} />
      </div>
    </aside>
  );
}

export default DashboardSidebar;
