import { createContext, type FC, type HTMLAttributes, Suspense, useContext, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Loader2Icon } from 'lucide-react';

type LayoutState = {
  offset: number;
  fixed: boolean;
};

type HeaderProps = HTMLAttributes<HTMLDivElement> & {
  sticky?: boolean;
};

type SidebarProps = HTMLAttributes<HTMLDivElement>;

type ContentProps = HTMLAttributes<HTMLDivElement>;

type FooterProps = HTMLAttributes<HTMLDivElement>;

type LayoutProps = HTMLAttributes<HTMLDivElement> & {
  fixed?: boolean;
};

type LayoutComponent = FC<LayoutProps> & {
  Header: FC<HeaderProps>;
  Sidebar: FC<SidebarProps>;
  Content: FC<ContentProps>;
  Footer: FC<FooterProps>;
};

const LayoutContext = createContext<LayoutState | null>(null);

export const useLayoutContext = (): LayoutState => {
  const context = useContext(LayoutContext);

  if (context === null) {
    throw new Error('Layout components must be used within Layout');
  }

  return context;
};

const Header: FC<HeaderProps> = ({ className, sticky = false, ...props }) => {
  const { offset, fixed } = useLayoutContext();

  return (
    <header
      data-slot="layout.header"
      className={cn(
        'bg-surface flex items-center gap-4 p-4',
        offset > 10 && sticky ? 'shadow-sm' : 'shadow-none',
        fixed && '',
        sticky && 'sticky top-0 z-10',
        className,
      )}
      {...props}
    />
  );
};

const Sidebar: FC<SidebarProps> = ({ className, ...props }) => {
  const { fixed } = useLayoutContext();

  return (
    <aside
      data-slot="layout.sidebar"
      className={cn('bg-surface relative z-50 transition-[width]', fixed && 'sticky top-0', className)}
      {...props}
    />
  );
};

const ContentFallback: FC = () => {
  const { t } = useAppTranslation('common');

  return (
    <div role="status" data-slot="layout.loading" className="grid min-h-40 place-items-center">
      <Loader2Icon aria-hidden="true" className="text-fg-muted size-6 animate-spin motion-reduce:animate-none" />
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
};

const Content: FC<ContentProps> = ({ className, children, ...props }) => {
  const { fixed } = useLayoutContext();

  return (
    <main data-slot="layout.content" className={cn('relative p-2 md:px-10 md:py-4', fixed && className)} {...props}>
      <Suspense fallback={<ContentFallback />}>{children || <Outlet />}</Suspense>
    </main>
  );
};

const Footer: FC<FooterProps> = ({ className, ...props }) => {
  const { fixed } = useLayoutContext();

  return <footer data-slot="layout.footer" className={cn(fixed && '', className)} {...props} />;
};

const Layout: LayoutComponent = ({ className, fixed = false, ...props }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const div = divRef.current;

    if (!div) return undefined;

    const onScroll = () => setOffset(div.scrollTop);

    div.removeEventListener('scroll', onScroll);
    div.addEventListener('scroll', onScroll, { passive: true });
    return () => div.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <LayoutContext.Provider value={{ offset, fixed }}>
      <div
        ref={divRef}
        data-slot="layout"
        className={cn('min-h-dvh', fixed && 'md:grid md:grid-cols-[auto_1fr] md:grid-rows-[auto_1fr]', className)}
        {...props}
      />
    </LayoutContext.Provider>
  );
};

Layout.Header = Header;
Layout.Sidebar = Sidebar;
Layout.Content = Content;
Layout.Footer = Footer;

Layout.displayName = 'Layout';
Header.displayName = 'Layout.Header';
Sidebar.displayName = 'Layout.Sidebar';
Content.displayName = 'Layout.Content';
Footer.displayName = 'Layout.Footer';

export default Layout;
