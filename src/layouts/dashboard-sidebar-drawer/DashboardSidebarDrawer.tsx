import { cn } from '@utils';

import { AlignJustify, Menu, X } from 'lucide-react';

type DashboardSidebarDrawerProps = {
  collapse: boolean;
  onCollapse: () => void;
  className?: string;
  variant?: 'mobile' | 'desktop';
};

function MobileSidebarDrawer(props: DashboardSidebarDrawerProps) {
  return (
    <button
      type="button"
      className={cn('flex size-11 items-center justify-center text-foreground md:hidden', props.className)}
      onClick={props.onCollapse}
      aria-label={props.collapse ? 'Close menu' : 'Open menu'}
    >
      {props.collapse ? <X className="size-5" /> : <Menu className="size-5" />}
    </button>
  );
}

function DesktopSidebarDrawer(props: DashboardSidebarDrawerProps) {
  return (
    <button
      type="button"
      className={cn(
        'hidden size-11 shrink-0 cursor-pointer items-center justify-end md:flex',
        props.className,
      )}
      onClick={props.onCollapse}
      aria-label={props.collapse ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      <div className="flex items-center rounded bg-secondary-200 p-1">
        <AlignJustify
          className={cn(
            'size-6 text-secondary-800 transition-transform duration-200',
            !props.collapse && '-rotate-90',
          )}
        />
      </div>
    </button>
  );
}

function DashboardSidebarDrawer({ variant = 'desktop', ...props }: DashboardSidebarDrawerProps) {
  return variant === 'mobile' ? <MobileSidebarDrawer {...props} /> : <DesktopSidebarDrawer {...props} />;
}

export default DashboardSidebarDrawer;
