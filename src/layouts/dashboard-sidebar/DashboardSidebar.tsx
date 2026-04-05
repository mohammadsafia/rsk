import { useState } from 'react';

import { DashboardSidebarLink, SidebarSubLink, DashboardSidebarDrawer } from '@layouts';
import { cn } from '@utils';
import { APP_MENU } from '@routes';
import APP_CONFIGURATIONS from 'config/AppConfigurations';

function DashboardSidebar() {
  const [collapse, setCollapse] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleToggleCollapse = () => setCollapse((prevState) => !prevState);

  const handleExpandSidebar = () => setCollapse(false);

  const handleToggleMenu = () => {
    setShowMenu((prevState) => !prevState);
    setCollapse(false);
  };

  return (
    <aside className={cn('bg-background relative z-50 w-full transition-[width] duration-200 md:h-dvh', collapse ? 'md:w-17' : 'md:w-67')}>
      <div className={cn('flex h-full flex-col', showMenu && 'h-svh')}>
        <header
          className={cn('relative flex h-17.5 shrink-0 items-center shadow', collapse ? 'justify-center px-3' : 'justify-end px-3 md:px-6')}
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden',
              collapse ? 'w-px pl-3' : 'w-auto',
            )}
          >
            <img
              src={APP_CONFIGURATIONS.VITE_APP_TENANT_LOGO_URL}
              alt={APP_CONFIGURATIONS.VITE_APP_TENANT_NAME}
              className={cn('h-17.5 w-auto shrink-0 opacity-8')}
            />
          </div>

          <DashboardSidebarDrawer variant="mobile" collapse={showMenu} onCollapse={handleToggleMenu} />

          <DashboardSidebarDrawer collapse={!collapse} onCollapse={handleToggleCollapse} />
        </header>

        <nav
          className={cn(
            'bg-background min-h-0 flex-1 py-6',
            'md:max-h-none md:overflow-y-auto',
            showMenu
              ? 'animate-in slide-in-from-top max-h-screen overflow-y-auto transition duration-300 ease-out'
              : 'max-md:max-h-0 max-md:overflow-hidden',
          )}
        >
          <div className={cn('flex flex-col gap-3', collapse && 'overflow-clip')}>
            {APP_MENU.map((route) => {
              if (route.submenu && collapse) {
                return <DashboardSidebarLink key={route.id} route={route} collapse={collapse} onExpandSidebar={handleExpandSidebar} />;
              }

              if (route.submenu) {
                return <SidebarSubLink key={route.id} route={route} collapse={collapse} />;
              }

              return <DashboardSidebarLink key={route.id} route={route} collapse={collapse} />;
            })}
          </div>
        </nav>
      </div>

      <div className="pointer-events-none absolute inset-0 shadow-[inset_-2px_0px_8px_0px_rgba(35,29,100,0.08)]" />
    </aside>
  );
}

export default DashboardSidebar;
