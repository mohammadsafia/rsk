import { Button } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronsLeft, Menu, X } from 'lucide-react';

type DashboardSidebarDrawerProps = {
  collapse: boolean;
  onCollapse: () => void;
  className?: string;
  iconSize?: number;
  variant?: 'mobile' | 'desktop';
};

function MobileSidebarDrawer(props: DashboardSidebarDrawerProps) {
  const { t } = useAppTranslation('nav');

  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn('text-sidebar-foreground hover:bg-sidebar-accent h-9 w-9 md:hidden', props.className)}
      onClick={props.onCollapse}
      aria-label={props.collapse ? t('closeMenu') : t('openMenu')}
    >
      {props.collapse ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
}

function DesktopSidebarDrawer(props: DashboardSidebarDrawerProps) {
  const { t } = useAppTranslation('nav');

  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(
        'bg-background border-border text-muted-foreground hover:bg-accent hover:text-foreground absolute -inset-e-4 top-20 z-50 hidden h-8 w-8 rounded-full border shadow-sm transition-all duration-200 hover:scale-110 md:inline-flex',
        props.className,
      )}
      onClick={props.onCollapse}
      aria-label={props.collapse ? t('expandSidebar') : t('collapseSidebar')}
    >
      <ChevronsLeft
        size={props.iconSize ?? 14}
        className={cn('transition-transform duration-200 rtl:scale-x-[-1]', !props.collapse && 'rotate-180')}
      />
    </Button>
  );
}

function DashboardSidebarDrawer({ variant = 'desktop', ...props }: DashboardSidebarDrawerProps) {
  return variant === 'mobile' ? <MobileSidebarDrawer {...props} /> : <DesktopSidebarDrawer {...props} />;
}

export default DashboardSidebarDrawer;
