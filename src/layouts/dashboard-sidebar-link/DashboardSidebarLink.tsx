import { Link } from 'react-router-dom';

import { Collapsible } from '@components/ui';

import { useAuthorization } from '@hooks/shared';
import { useRouteUtils } from '@hooks/utils';
import { cn } from '@utils';
import { type AppMenu, ROUTES_PATH } from '@routes';

import { ChevronDown } from 'lucide-react';
import { AuthorizationWrapper } from 'components/permissions';
type SidebarLinkProps = {
  route: AppMenu;
  collapse: boolean;
  subLink?: boolean;
  onExpandSidebar?: () => void;
};

const LINK_BASE_STYLES =
  'group relative flex w-full cursor-pointer items-center gap-2 px-6 h-11 text-sm font-medium transition-colors duration-150';

const LINK_DEFAULT_STYLES = 'text-foreground hover:bg-primary-25 hover:border-l-2 hover:border-primary';

const LINK_ACTIVE_STYLES = 'bg-primary-15 border-l-2 border-primary font-bold text-foreground';

export function SidebarSubLink({ route, collapse }: SidebarLinkProps) {
  const { isAnyRouteActive } = useRouteUtils();
  const { hasPermission, hasAnyPermission, hasAnyRole } = useAuthorization();

  const hasAccessToSubmenu =
    route.submenu?.some((subRoute) => {
      if (subRoute.roles && subRoute.roles.length > 0 && !hasAnyRole(subRoute.roles)) return false;

      if (subRoute.permission) return hasPermission(subRoute.permission);

      if (subRoute.permissions) return hasAnyPermission(subRoute.permissions);

      return true;
    }) ?? false;

  if (!hasAccessToSubmenu) {
    return null;
  }

  const childPaths = route.submenu?.map((sub) => sub.path) ?? [];
  const isActive = isAnyRouteActive([route.path, ...childPaths]);

  return (
    <Collapsible defaultOpen={isActive}>
      <Collapsible.Trigger className={cn(LINK_BASE_STYLES, isActive ? LINK_ACTIVE_STYLES : LINK_DEFAULT_STYLES)}>
        <route.icon className="text-foreground size-6 shrink-0" />

        <span className="flex-1 truncate text-left">{route.name}</span>

        <ChevronDown className='size-4 shrink-0 transition-transform duration-200 group-data-[state="open"]:-rotate-180' />
      </Collapsible.Trigger>

      <Collapsible.Content asChild>
        <ul className="mt-1 flex flex-col gap-1">
          {route.submenu!.map((subRoute) => (
            <AuthorizationWrapper key={subRoute.id} permissions={subRoute.permission ? [subRoute.permission] : []}>
              <li>
                <DashboardSidebarLink route={subRoute} subLink collapse={collapse} />
              </li>
            </AuthorizationWrapper>
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible>
  );
}

function DashboardSidebarLink({ route, collapse, subLink, onExpandSidebar }: SidebarLinkProps) {
  const { isActiveLink, isAnyRouteActive } = useRouteUtils();
  const { hasPermission, hasAnyPermission, hasAnyRole } = useAuthorization();

  const hasAccess = () => {
    if (route.roles && route.roles.length > 0 && !hasAnyRole(route.roles)) return false;

    if (route.permission) return hasPermission(route.permission);

    if (route.permissions) return hasAnyPermission(route.permissions);

    return true;
  };

  if (!hasAccess()) {
    return null;
  }

  const childPaths = route.submenu?.map((sub) => sub.path) ?? [];
  const isActive = onExpandSidebar ? isAnyRouteActive([route.path, ...childPaths]) : isActiveLink(route.path);
  const linkPath = route.path === ROUTES_PATH.HOME.INDEX || route.path === ROUTES_PATH.ROOT.INDEX ? route.path : `/${route.path}`;

  if (onExpandSidebar && collapse) {
    return (
      <button
        type="button"
        title={route.name ?? route.path}
        onClick={onExpandSidebar}
        className={cn(LINK_BASE_STYLES, isActive ? LINK_ACTIVE_STYLES : LINK_DEFAULT_STYLES)}
      >
        <route.icon className="text-foreground size-6 shrink-0" />
        <span className="truncate">{route.name ?? route.path}</span>
      </button>
    );
  }

  return (
    <Link
      title={route.name ?? route.path}
      to={linkPath}
      className={cn(LINK_BASE_STYLES, isActive ? LINK_ACTIVE_STYLES : LINK_DEFAULT_STYLES, {
        'h-auto py-2 pl-14 text-sm font-medium': subLink,
      })}
    >
      {!subLink && <route.icon className="text-foreground size-6 shrink-0" />}

      <span className="truncate">{route.name ?? route.path}</span>
    </Link>
  );
}

export default DashboardSidebarLink;
