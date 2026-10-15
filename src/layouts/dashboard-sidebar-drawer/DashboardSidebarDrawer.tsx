import { Button, IconButton } from '@components/ui';

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
    <IconButton
      className={cn('md:hidden', props.className)}
      onClick={props.onCollapse}
      aria-label={props.collapse ? t('closeMenu') : t('openMenu')}
    >
      {props.collapse ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </IconButton>
  );
}

function DesktopSidebarDrawer(props: DashboardSidebarDrawerProps) {
  const { t } = useAppTranslation('nav');

  return (
    <IconButton
      variant="outline"
      size="sm"
      className={cn(
        'bg-surface absolute -inset-e-4 top-20 z-50 hidden rounded-full transition-all duration-200 hover:scale-110 md:inline-flex',
        props.className,
      )}
      onClick={props.onCollapse}
      aria-label={props.collapse ? t('expandSidebar') : t('collapseSidebar')}
    >
      <ChevronsLeft
        size={props.iconSize ?? 14}
        className={cn('transition-transform duration-200 rtl:scale-x-[-1]', !props.collapse && 'rotate-180')}
      />
    </IconButton>
  );
}

function DashboardSidebarDrawer({ variant = 'desktop', ...props }: DashboardSidebarDrawerProps) {
  return variant === 'mobile' ? <MobileSidebarDrawer {...props} /> : <DesktopSidebarDrawer {...props} />;
}

export default DashboardSidebarDrawer;
