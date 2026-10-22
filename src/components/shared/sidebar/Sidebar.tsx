'use client';

import {
  type ComponentPropsWithoutRef,
  createContext,
  type ElementType,
  type FC,
  type MouseEvent,
  type ReactNode,
  useContext,
  useId,
  useState,
} from 'react';

import { IconButton, ScrollArea, Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';
import { useAppShell } from '@components/shared/app-shell/AppShellContext';

import { KitLink } from '@contexts';
import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronDown, ChevronsLeft } from 'lucide-react';

const SidebarContext = createContext({ collapsed: false });

type SidebarProps = ComponentPropsWithoutRef<'div'> & { collapsed?: boolean };
type GroupProps = ComponentPropsWithoutRef<'div'> & { label: ReactNode };
type ItemProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: string;
  icon: ElementType;
  active?: boolean;
  badge?: ReactNode;
};
type SubMenuProps = { icon: ElementType; label: ReactNode; active?: boolean; children: ReactNode };

type SidebarComponent = FC<SidebarProps> & {
  Header: FC<ComponentPropsWithoutRef<'div'>>;
  Content: FC<ComponentPropsWithoutRef<'nav'>>;
  Group: FC<GroupProps>;
  Item: FC<ItemProps>;
  SubMenu: FC<SubMenuProps>;
  Footer: FC<ComponentPropsWithoutRef<'div'>>;
  CollapseButton: FC<{ className?: string }>;
};

const ROW =
  'text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-ring flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0';

const useCollapsed = () => useContext(SidebarContext).collapsed;

const Header: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => {
  const collapsed = useCollapsed();

  return (
    <div
      data-slot="sidebar-header"
      className={cn('flex h-14 shrink-0 items-center justify-between gap-2 px-3', collapsed && 'md:justify-center md:px-0', className)}
      {...props}
    />
  );
};

const Content: FC<ComponentPropsWithoutRef<'nav'>> = ({ className, children, ...props }) => {
  const { t } = useAppTranslation('nav');

  return (
    <ScrollArea className="min-h-0 flex-1">
      <nav data-slot="sidebar-content" aria-label={t('navigation')} className={cn('flex flex-col gap-4 px-3 py-2', className)} {...props}>
        {children}
      </nav>

      <ScrollArea.Bar />
    </ScrollArea>
  );
};

const Group: FC<GroupProps> = ({ label, className, children, ...props }) => {
  const collapsed = useCollapsed();
  const labelId = useId();

  return (
    <div data-slot="sidebar-group" role="group" aria-labelledby={labelId} className={cn('flex flex-col gap-0.5', className)} {...props}>
      <p
        id={labelId}
        className={cn(
          'text-fg-muted text-2xs px-3 pb-1 font-medium tracking-wider uppercase rtl:tracking-normal',
          collapsed && 'md:sr-only',
        )}
      >
        {label}
      </p>

      {children}
    </div>
  );
};

const Item: FC<ItemProps> = ({ href, icon: Icon, active = false, badge, className, children, onClick, ...props }) => {
  const collapsed = useCollapsed();
  const { direction } = useAppTranslation();
  const { mobileOpen, closeMobile, contentId } = useAppShell();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!mobileOpen) return;
    closeMobile(false);
    // The link is about to be hidden with the drawer; hand focus to the page it opens.
    document.getElementById(contentId)?.focus();
  };

  return (
    <Tooltip content={children} side={direction === 'rtl' ? 'left' : 'right'} disabled={!collapsed || mobileOpen}>
      <KitLink
        href={href}
        data-slot="sidebar-item"
        aria-current={active ? 'page' : undefined}
        className={cn(
          ROW,
          'group/sidebar-item aria-[current=page]:text-fg aria-[current=page]:font-medium',
          // Collapsed, the label is hidden: the ink bar under the icon marks the current item (not colour alone).
          collapsed && 'md:justify-center md:px-0 md:aria-[current=page]:ink-block',
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        <Icon aria-hidden="true" />

        <span
          data-slot="sidebar-item-label"
          className={cn('-mb-1 flex-1 truncate pb-1 group-aria-[current=page]/sidebar-item:ink', collapsed && 'md:sr-only')}
        >
          {children}
        </span>

        <Conditional.If condition={badge !== undefined && badge !== null}>
          <span
            className={cn('bg-surface-raised text-fg-muted text-2xs rounded-full px-1.5 font-mono tabular-nums', collapsed && 'md:hidden')}
          >
            {badge}
          </span>
        </Conditional.If>
      </KitLink>
    </Tooltip>
  );
};

const SubMenu: FC<SubMenuProps> = ({ icon: Icon, label, active = false, children }) => {
  const collapsed = useCollapsed();
  const { direction } = useAppTranslation();
  const { setCollapsed, mobileOpen } = useAppShell();
  const [open, setOpen] = useState(active);
  const panelId = useId();
  // Collapsing is a desktop (md+) state; the mobile drawer always shows the full sidebar.
  const iconOnly = collapsed && !mobileOpen;

  const handleClick = () => {
    if (iconOnly) {
      setCollapsed(false);
      setOpen(true);
      return;
    }
    setOpen((value) => !value);
  };

  return (
    <div data-slot="sidebar-submenu" className="flex flex-col gap-0.5">
      <Tooltip content={label} side={direction === 'rtl' ? 'left' : 'right'} disabled={!iconOnly}>
        <button
          type="button"
          aria-expanded={open && !iconOnly}
          aria-controls={panelId}
          data-active={active || undefined}
          className={cn(ROW, 'data-[active]:text-fg', collapsed && 'md:justify-center md:px-0')}
          onClick={handleClick}
        >
          <Icon aria-hidden="true" />

          <span className={cn('flex-1 truncate text-start', collapsed && 'md:sr-only')}>{label}</span>

          <ChevronDown
            aria-hidden="true"
            className={cn('transition-transform motion-reduce:transition-none', open && 'rotate-180', collapsed && 'md:hidden')}
          />
        </button>
      </Tooltip>

      <Conditional.If condition={open && !iconOnly}>
        <div id={panelId} className="flex flex-col gap-0.5 ps-7">
          {children}
        </div>
      </Conditional.If>
    </div>
  );
};

const Footer: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => (
  <div data-slot="sidebar-footer" className={cn('border-sidebar-border shrink-0 border-t p-3', className)} {...props} />
);

const CollapseButton: FC<{ className?: string }> = ({ className }) => {
  const { t } = useAppTranslation('nav');
  const { toggleCollapsed } = useAppShell();
  const collapsed = useCollapsed();

  return (
    <IconButton
      size="sm"
      tooltip={false}
      aria-label={t(collapsed ? 'expandSidebar' : 'collapseSidebar')}
      className={cn('max-md:hidden', className)}
      onClick={toggleCollapsed}
    >
      <ChevronsLeft aria-hidden="true" className={cn('rtl:-scale-x-100', collapsed && 'rotate-180')} />
    </IconButton>
  );
};

const Sidebar: SidebarComponent = ({ collapsed: collapsedProp, className, ...props }) => {
  const shell = useAppShell();
  const collapsed = collapsedProp ?? shell.collapsed;

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div data-slot="sidebar" data-collapsed={collapsed} className={cn('flex h-full min-h-0 flex-col', className)} {...props} />
    </SidebarContext.Provider>
  );
};

Sidebar.Header = Header;
Sidebar.Content = Content;
Sidebar.Group = Group;
Sidebar.Item = Item;
Sidebar.SubMenu = SubMenu;
Sidebar.Footer = Footer;
Sidebar.CollapseButton = CollapseButton;
Sidebar.displayName = 'Sidebar';

export default Sidebar;
