import { useState } from 'react';

import { DashboardSidebarLink, SidebarSubLink, DashboardSidebarDrawer } from '@layouts';
import { ScrollArea } from '@components/ui';
import { cn } from '@utils';
import { APP_MENU } from '@routes';

function DashboardSidebar() {
  const [collapse, setCollapse] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleToggleCollapse = () => setCollapse((prevState) => !prevState);

  const handleToggleMenu = () => {
    setShowMenu((prevState) => !prevState);
    setCollapse(false);
  };

  return (
    <aside
      className={cn(
        'bg-sidebar border-muted-200 sticky top-0 z-50 w-full border-e transition-[width] duration-300 ease-in-out md:relative md:h-dvh',
        collapse ? 'md:w-17' : 'md:w-65',
      )}
    >
      <div className={cn('flex h-full flex-col', showMenu && 'h-svh')}>
        {/* Logo header */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 md:h-16">
          <div className={cn('flex items-center justify-center transition-all duration-300', collapse && 'md:w-full')}>
            <span className={cn('text-foreground text-sm font-bold transition-all duration-300', collapse && 'md:text-xs')}>
              {collapse ? 'S' : 'Starter'}
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
            <div className="space-y-0.5">
              {APP_MENU.map((route) => {
                if (route.submenu && collapse) {
                  return (
                    <DashboardSidebarLink key={route.id} route={route} collapse={collapse} onExpandSidebar={() => setCollapse(false)} />
                  );
                }

                if (route.submenu) {
                  return <SidebarSubLink key={route.id} route={route} collapse={collapse} />;
                }

                return <DashboardSidebarLink key={route.id} route={route} collapse={collapse} />;
              })}
            </div>
          </nav>
        </ScrollArea>

        {/* Collapse toggle */}
        <DashboardSidebarDrawer collapse={!collapse} onCollapse={handleToggleCollapse} />
      </div>
    </aside>
  );
}

export default DashboardSidebar;
