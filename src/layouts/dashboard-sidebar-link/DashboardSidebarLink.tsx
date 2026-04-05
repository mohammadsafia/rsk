import { Link } from 'react-router-dom';

import { Collapsible } from '@components/ui';

import { useRouteUtils } from '@hooks/utils';
import { cn } from '@utils';
import { type AppMenu, FULL_ROUTES_PATH } from '@routes';

import { ChevronDown } from 'lucide-react';

type SidebarLinkProps = {
  route: AppMenu;
  collapse: boolean;
  subLink?: boolean;
  onExpandSidebar?: () => void;
};

const LINK_BASE_STYLES =
  'group relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200';

const LINK_DEFAULT_STYLES = 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';

const LINK_ACTIVE_STYLES =
  'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm before:absolute before:start-0 before:top-1/2 before:h-5 before:-translate-y-1/2 before:w-[3px] before:rounded-full rounded-sm before:bg-primary';

export function SidebarSubLink({ route, collapse }: SidebarLinkProps) {
  const { isAnyRouteActive } = useRouteUtils();

  const childPaths = route.submenu?.map((sub) => sub.path) ?? [];
  const isActive = isAnyRouteActive([route.path, ...childPaths]);

  return (
    <Collapsible defaultOpen={isActive}>
      <Collapsible.Trigger className={cn(LINK_BASE_STYLES, isActive ? LINK_ACTIVE_STYLES : LINK_DEFAULT_STYLES)}>
        <route.icon className="h-5 w-5 shrink-0" />

        <span className="flex-1 truncate text-start">{route.name}</span>

        <ChevronDown className='h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state="open"]:-rotate-180' />
      </Collapsible.Trigger>

      <Collapsible.Content asChild>
        <ul className="mt-1 space-y-1 ps-8">
          {route.submenu!.map((subRoute) => (
            <li key={subRoute.id}>
              <DashboardSidebarLink route={subRoute} subLink collapse={collapse} />
            </li>
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible>
  );
}

function DashboardSidebarLink({ route, collapse, subLink, onExpandSidebar }: SidebarLinkProps) {
  const { isActiveLink, isAnyRouteActive } = useRouteUtils();

  const childPaths = route.submenu?.map((sub) => sub.path) ?? [];
  const isActive = onExpandSidebar ? isAnyRouteActive([route.path, ...childPaths]) : isActiveLink(route.path);
  const linkPath = route.path === FULL_ROUTES_PATH.HOME.INDEX || route.path === FULL_ROUTES_PATH.ROOT.INDEX ? route.path : `/${route.path}`;

  if (onExpandSidebar && collapse) {
    return (
      <button
        type="button"
        title={route.name ?? route.path}
        onClick={onExpandSidebar}
        className={cn(LINK_BASE_STYLES, isActive ? LINK_ACTIVE_STYLES : LINK_DEFAULT_STYLES, 'justify-center')}
      >
        <route.icon className="h-5 w-5 shrink-0" />
      </button>
    );
  }

  return (
    <Link
      title={route.name ?? route.path}
      to={route.path}
      className={cn(LINK_BASE_STYLES, isActive ? LINK_ACTIVE_STYLES : LINK_DEFAULT_STYLES, {
        'justify-center': collapse && !subLink,
        'rounded-none border-s-2 ps-4': subLink,
      })}
    >
      <route.icon className="h-5 w-5 shrink-0" />

      <span className={cn('truncate', { 'sr-only': collapse && !subLink })}>{route.name ?? route.path}</span>
    </Link>
  );
}

export default DashboardSidebarLink;
