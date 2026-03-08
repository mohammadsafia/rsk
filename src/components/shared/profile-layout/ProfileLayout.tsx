import { type ComponentProps, type FC } from 'react';

import { cn } from '@utils';

type ProfileLayoutProps = ComponentProps<'div'>;
type ProfileLayoutMainProps = ComponentProps<'div'>;
type ProfileLayoutSummaryProps = ComponentProps<'section'>;
type ProfileLayoutSidebarProps = ComponentProps<'aside'>;

type ProfileLayoutComponent = FC<ProfileLayoutProps> & {
  Main: FC<ProfileLayoutMainProps>;
  Summary: FC<ProfileLayoutSummaryProps>;
  Sidebar: FC<ProfileLayoutSidebarProps>;
};

const Main: FC<ProfileLayoutMainProps> = ({ className, children, ...props }) => (
  <div data-slot="profile-layout-main" className={cn('flex flex-1 flex-col gap-3', className)} {...props}>
    {children}
  </div>
);

const Summary: FC<ProfileLayoutSummaryProps> = ({ className, children, ...props }) => (
  <section data-slot="profile-layout-summary" className={cn('bg-primary-25 flex flex-col rounded-2xl p-2', className)} {...props}>
    {children}
  </section>
);

const Sidebar: FC<ProfileLayoutSidebarProps> = ({ className, children, ...props }) => (
  <aside
    data-slot="profile-layout-sidebar"
    className={cn('bg-primary-25 flex w-full flex-col gap-2 rounded-2xl p-2 lg:w-63.75 lg:shrink-0', className)}
    {...props}
  >
    {children}
  </aside>
);

const ProfileLayout: ProfileLayoutComponent = ({ className, children, ...props }) => (
  <div data-slot="profile-layout" className={cn('flex flex-col gap-3 lg:flex-row', className)} {...props}>
    {children}
  </div>
);

ProfileLayout.Main = Main;
ProfileLayout.Summary = Summary;
ProfileLayout.Sidebar = Sidebar;

export default ProfileLayout;
